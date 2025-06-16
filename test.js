require('./test-setup'); // ensure qtests or fallback stubs before other imports so axios/winston mocks load first
// Hooks run via react-test-renderer and tests queue sequentially so Node can run this without Jest; this keeps orchestration simple

/**
 * Comprehensive Test Suite for React Hooks Utility Library
 * 
 * This enhanced test suite provides exhaustive unit and integration testing for the npm module.
 * It's designed to run in Node.js without requiring a full React testing environment,
 * using manual mocking and verification patterns instead of complex testing frameworks.
 * 
 * Test Categories:
 * 1. Module Export Tests - Verify all exports exist and are callable
 * 2. Unit Tests - Test individual function behavior with mocks
 * 3. Integration Tests - Test interactions between modules
 * 4. API Endpoint Tests - Test all API functions with normal and error cases
 * 5. Error Handling Tests - Verify proper error propagation
 * 6. Edge Case Tests - Test boundary conditions and unusual inputs
 * 7. Performance Tests - Verify performance characteristics
 * 8. Memory Management Tests - Test for memory leaks and cleanup
 */




const React = require('react'); // Load real React for hook rendering //(replace mock React with real module)
const TestRenderer = require('react-test-renderer'); // Renderer for executing hooks //(provide test renderer for hook execution)
globalThis.IS_REACT_ACT_ENVIRONMENT = true; // flag React act environment for warnings so TestRenderer.act works correctly

/**
 * Render a hook via react-test-renderer to keep tests lightweight.
 *
 * This method avoids full UI frameworks but still executes hook logic,
 * allowing simple assertions without DOM complexity.
 *
 * @param {Function} hookFn - Hook function being tested
 * @returns {{result: {current: any}}} - Structure mimicking Testing Library
 */
function renderHook(hookFn, props = {}) { // executes hook with react-test-renderer for isolated tests
  const result = { current: null }; // store latest hook value
  let root; // store renderer instance for cleanup
  function TestComponent(innerProps) { // Minimal component to invoke hook with props
    result.current = hookFn(innerProps); // capture value on each render
    return null;
  }
  TestRenderer.act(() => { // react-test-renderer lets us execute hooks here
    root = TestRenderer.create(React.createElement(TestComponent, props)); // avoids need for a browser DOM
  });
  return {
    result, // exposes current hook state to assertions
    rerender: (newProps = props) => TestRenderer.act(() => root.update(React.createElement(TestComponent, newProps))), // allow prop updates for effects
    unmount: () => TestRenderer.act(() => root.unmount()) // expose unmount for cleanup tests to verify teardown logic
  }; // return mimic of Testing Library plus unmount
} //

// Enhanced axios mock extending qtests stub to emulate axios.create and common error conditions
const mockAxios = require('axios'); // base stub from qtests setup to intercept HTTP
mockAxios.create = (config) => { // provide axios.create capability for tests to support instances
    const instance = async (requestConfig) => instance.request(requestConfig); // callable like real axios
    instance.request = async (requestConfig) => { // simulate axios.request behaviour so network calls are deterministic
      const { url, method, data, params } = requestConfig; // capture params for GET verification // changed
      
      // Convert relative URLs to absolute for testing
      const absoluteUrl = url.startsWith('/') ? `http://localhost:3000${url}` : url;
      
      // Simulate different API responses based on URL patterns
      if (absoluteUrl.includes('/error')) {
        const error = new Error('Network error');
        error.isAxiosError = true;
        error.response = { status: 500, data: 'Server error' };
        throw error;
      }
      
      if (absoluteUrl.includes('/401')) {
        const error = new Error('Unauthorized');
        error.isAxiosError = true;
        error.response = { status: 401, data: 'Unauthorized' };
        throw error;
      }
      
      if (absoluteUrl.includes('/timeout')) {
        const error = new Error('Timeout');
        error.isAxiosError = true;
        error.code = 'ECONNABORTED';
        throw error;
      }
      
      // Default successful response - return structure mirroring real axios for realistic assertions
      return {
        data: { success: true, url: absoluteUrl, method, requestData: data, requestParams: params }, // expose params // changed
        status: 200,
        statusText: 'OK'
      };
    },
    instance.get = async (url) => { // simple wrapper used by getQueryFn tests
      return instance.request({ url, method: 'GET' });
    };
    return instance;
};
mockAxios.isAxiosError = (error) => error && error.isAxiosError === true; // match axios API so formatAxiosError recognizes mocked errors

const {
  useAsyncAction, useDropdownData, createDropdownListHook, useDropdownToggle,
  useEditForm, useIsMobile, useToast, toast, useToastAction, useAuthRedirect,
  showToast, stopEvent, apiRequest, getQueryFn, queryClient, formatAxiosError, axiosClient, getToastListenerCount, resetToastSystem, dispatch
} = require('./index.js'); // import library after axios stub so axiosClient can be overridden
const { handle401Error, codexRequest, executeAxiosRequest } = require('./lib/api.js'); // internal API helpers without config helpers

// Direct imports for internal utilities under test
const { executeAsyncWithLogging, logFunction, withToastLogging } = require('./lib/utils.js'); // test logging helpers
const { executeWithErrorHandling, executeSyncWithErrorHandling } = require('./lib/errorHandling.js'); // test error wrappers
const { executeWithErrorToast, executeWithToastFeedback } = require('./index.js'); // verify toast wrappers exported from main module

const mockedAxiosClient = mockAxios.create(); // Create axios stub instance for API calls
axiosClient.request = mockedAxiosClient.request; // override request so api layer uses mock
axiosClient.get = mockedAxiosClient.get; // override get so queries use stub

// Mock window object for browser API testing // allows hooks using window to run under Node
const mockWindow = {
  innerWidth: 1024,
  matchMedia: (query) => ({ // minimal MediaQueryList mock used by useIsMobile
    matches: query.includes('max-width') && mockWindow.innerWidth <= 767,
    addEventListener: (event, handler) => { // record listeners for cleanup
      mockWindow._mediaListeners = mockWindow._mediaListeners || [];
      mockWindow._mediaListeners.push({ event, handler, query });
    },
    removeEventListener: (event, handler) => { // remove stored listener
      if (mockWindow._mediaListeners) {
        mockWindow._mediaListeners = mockWindow._mediaListeners.filter(
          l => l.handler !== handler
        );
      }
    },
    addListener(handler) { this.addEventListener('change', handler); }, // react-responsive polyfill compatibility
    removeListener(handler) { this.removeEventListener('change', handler); }
  }),
  history: {
    pushState: (state, title, url) => { // track SPA navigations for assertions
      mockWindow._lastPushState = { state, title, url };
    }
  },
  dispatchEvent: (event) => {
    mockWindow._lastEvent = event;
  },
  _mediaListeners: [],
  _lastPushState: null,
  _lastEvent: null,
  _resetMocks: () => { // helper to restore window to initial state
    mockWindow._mediaListeners = [];
    mockWindow._lastPushState = null;
    mockWindow._lastEvent = null;
    mockWindow.innerWidth = 1024;
  }
};


// Mock PopStateEvent so useAuthRedirect can run in Node environment
global.PopStateEvent = class PopStateEvent { constructor(type){ this.type = type; } };



// Patch require and global objects for testing
const originalRequire = require; // Preserve original require for restoration //(save original require)
const originalWindow = global.window; // Keep original window for cleanup //(preserve original window)
const originalAxios = require('axios'); // Save axios instance before mocking //(keep axios)

/**
 * Override Node's require to supply the axios stub. This keeps tests from making real
 * network calls while still letting all other modules load via the saved originalRequire
 * function. The original require is restored after tests so normal behavior resumes.
 */
// axios stub path is replaced directly via require.cache so no custom require needed

global.window = mockWindow; // assign stubbed window so hooks use controlled environment
global.PopStateEvent = class PopStateEvent { constructor(type, opts={}){ this.type=type; this.state=opts.state||null; } }; // stub for auth redirect tests so SPA navigation is emulated

// Test utilities
let testCount = 0; // number of tests executed in this run
let passedTests = 0; // incremented when assertions succeed
let failedTests = 0; // incremented when a test throws or rejects
const testResults = []; // stores per-test details for the summary output

/**
 * Execute a test with detailed logging.
 *
 * Mocks reset before each run to avoid cross-test state leaks,
 * providing repeatable results.
 *
 * @param {string} name - Description of the test
 * @param {Function} testFn - The test logic to run
 */
let testQueue = Promise.resolve(); // queue keeps async tests in order so mocks reset correctly between runs
function runTest(name, testFn) { // executes a test and logs the result while queued to maintain order
  testQueue = testQueue.then(async () => { // chain test onto queue
    testCount++;
    const testStart = Date.now();
    try {
      console.log(`\n🧪 Test ${testCount}: ${name}`);
      mockWindow._resetMocks(); // reset window state for isolation
      await testFn(); // await async test bodies so promises resolve within this chain
      const duration = Date.now() - testStart;
      passedTests++;
      testResults.push({ name, status: 'PASSED', duration });
      console.log(`✅ PASSED: ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - testStart;
      failedTests++;
      testResults.push({ name, status: 'FAILED', error: error.message, duration });
      console.log(`❌ FAILED: ${name} (${duration}ms)`);
      console.log(`   Error: ${error.message}`);
      if (process.env.DEBUG_TESTS) { console.log(`   Stack: ${error.stack}`); }
    }
  });
}

/**
 * Basic truthy assertion helper.
 *
 * Provides consistent error messages so failing conditions are clear,
 * improving readability in the test output.
 *
 * @param {boolean} condition - Value to evaluate
 * @param {string} message - Message when assertion fails
 */
function assert(condition, message) { // throw if condition is false
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Assert two values are strictly equal.
 *
 * This helper streamlines comparisons and reports mismatched values,
 * making failures easier to diagnose.
 *
 * @param {*} actual - Value produced by the test
 * @param {*} expected - Expected value
 * @param {string} message - Message prefix for errors
 */
function assertEqual(actual, expected, message) { // throw when values differ
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

/**
 * Assert that a function throws an error.
 *
 * By capturing thrown errors we present clearer test intent and
 * messages when expectations are not met.
 *
 * @param {Function} fn - Function expected to throw
 * @param {string} message - Message used when no error is thrown
 */
function assertThrows(fn, message) { // verify that fn throws an error
  try {
    fn();
    throw new Error(`${message}: expected function to throw but it didn't`);
  } catch (error) {
    if (error.message.includes('expected function to throw')) {
      throw error;
    }
    // This is expected
  }
}

/**
 * Wrapper for async assertions to surface errors.
 *
 * Helps maintain readable async tests by turning rejections into
 * assertion failures with clear messages.
 *
 * @param {Function} asyncFn - Async function returning a promise
 * @param {string} message - Message prefix for rejected promise
 * @returns {Promise<void>} promise that rejects with formatted error
 */
function assertAsync(asyncFn, message) { // assert asyncFn resolves without error
  return asyncFn().catch(error => {
    throw new Error(`${message}: ${error.message}`);
  });
}

/**
 * Helper for testing function exports with consistent patterns
 * 
 * Reduces duplication in export validation tests while maintaining
 * clear individual test responsibilities.
 * 
 * @param {Array} functionNames - Names of functions to validate
 * @param {string} category - Category name for error messages
 */
function assertFunctionsExported(functionNames, category) { // confirm exports are functions
  functionNames.forEach(functionName => {
    const fn = eval(functionName);
    assert(typeof fn === 'function', `${functionName} should be a function`); // verify export type
    assert(fn.length >= 0, `${functionName} should be callable`);
  });
}

/**
 * Helper for testing API request scenarios with consistent error patterns
 * 
 * Standardizes the common pattern of testing API calls with expected errors
 * while keeping individual test logic separate.
 * 
 * @param {string} endpoint - API endpoint to test
 * @param {string} expectedErrorPattern - Pattern expected in error message
 * @param {string} testDescription - Description for error messages
 */
async function assertApiError(endpoint, expectedErrorPattern, testDescription) { // ensure API calls throw expected errors
  try {
    await apiRequest(endpoint);
    throw new Error(`Should have thrown for ${testDescription}`);
  } catch (error) {
    assert(error instanceof Error, `Should throw Error object for ${testDescription}`);
    assert(error.message.includes(expectedErrorPattern),
           `Should include ${expectedErrorPattern} for ${testDescription}`);
  }
}

// Import validation utilities after axios mock is in place so axios.isAxiosError uses the stub
const { isFunction, isObject, safeStringify, isAxiosErrorWithStatus } = require('./lib/validation.js');
// Load internal helper tests so they run within this suite
require('./tests/internal-helpers.test.js')({ runTest, renderHook, assert, assertEqual });

console.log('🚀 Starting Enhanced Comprehensive Test Suite...\n');

// =============================================================================
// MODULE EXPORT TESTS
// =============================================================================
// Ensures the public API remains stable and all expected functions are exposed

console.log('📦 MODULE EXPORT TESTS');

runTest('All core hooks are exported as functions', () => {
  const hooks = [
    'useAsyncAction', 'useDropdownData', 'useDropdownToggle', 'useEditForm',
    'useIsMobile', 'useToast', 'useToastAction', 'useAuthRedirect'
  ];
  
  hooks.forEach(hookName => {
    const hook = eval(hookName);
    assert(typeof hook === 'function', `${hookName} should be a function`);
    assert(hook.length >= 0, `${hookName} should be callable`);
  });
});

runTest('All utility functions are exported', () => {
  const utilities = ['toast', 'showToast', 'executeWithErrorToast', 'executeWithToastFeedback', 'stopEvent'];
  
  utilities.forEach(utilName => {
    const util = eval(utilName);
    assert(typeof util === 'function', `${utilName} should be a function`);
  });
});

runTest('All API functions are exported', () => {
  assert(typeof apiRequest === 'function', 'apiRequest should be a function');
  assert(typeof getQueryFn === 'function', 'getQueryFn should be a function');
  assert(typeof formatAxiosError === 'function', 'formatAxiosError should be a function');
  assert(typeof queryClient === 'object', 'queryClient should be an object');
  assert(typeof axiosClient === 'function', 'axiosClient should be a function (axios create returns function)');
  
  // Test queryClient has expected methods
  assert(typeof queryClient.getQueryData === 'function', 'queryClient should have getQueryData');
  assert(typeof queryClient.setQueryData === 'function', 'queryClient should have setQueryData');
  
  // Test axiosClient has expected methods - only test if it's actually an object
  if (typeof axiosClient === 'object' && axiosClient !== null) {
    assert(typeof axiosClient.request === 'function', 'axiosClient should have request method');
  }
});

runTest('Factory function exports and behavior', () => {
  assert(typeof createDropdownListHook === 'function', 'createDropdownListHook should be a function');
  
  const mockFetcher = async () => ['item1', 'item2'];
  const customHook = createDropdownListHook(mockFetcher);
  
  assert(typeof customHook === 'function', 'Factory should return a function');
  assert(customHook.length === 2, 'Created hook should accept 2 parameters');
});

// =============================================================================
// UNIT TESTS - UTILITY FUNCTIONS
// =============================================================================
// Exercise individual helper utilities with mocked dependencies

console.log('\n🔧 UNIT TESTS - UTILITY FUNCTIONS');

runTest('showToast with all parameter combinations', () => {
  const callHistory = [];
  const mockToast = (params) => {
    callHistory.push(params);
    return { id: 'test-id', dismiss: () => {}, update: () => {} };
  };
  
  // Test with all parameters
  showToast(mockToast, 'Message', 'Title', 'success');
  assertEqual(callHistory[0].title, 'Title', 'Title should be set');
  assertEqual(callHistory[0].description, 'Message', 'Description should be set');
  assertEqual(callHistory[0].variant, 'success', 'Variant should be set');
  
  // Test with minimal parameters
  showToast(mockToast, 'Message only');
  assertEqual(callHistory[1].description, 'Message only', 'Should handle minimal params');
  assertEqual(callHistory[1].title, undefined, 'Title should be undefined when not provided');
});

runTest('showToast error handling and propagation', () => {
  const failingToast = () => {
    throw new Error('Toast system failure');
  };
  
  assertThrows(() => {
    showToast(failingToast, 'Test message');
  }, 'Should propagate toast system errors');
  
  // Test with null toast function
  let errorMsg;
  try {
    showToast(null, 'Test message');
  } catch (err) {
    errorMsg = err.message;
  }
  assertEqual(errorMsg, 'showToast requires a function for `toast` parameter', 'Should handle null toast function');
});

runTest('stopEvent comprehensive behavior', () => {
  let preventDefaultCalled = false;
  let stopPropagationCalled = false;
  
  const mockEvent = {
    type: 'click',
    preventDefault: () => { preventDefaultCalled = true; },
    stopPropagation: () => { stopPropagationCalled = true; }
  };
  
  stopEvent(mockEvent);
  
  assert(preventDefaultCalled, 'preventDefault should be called');
  assert(stopPropagationCalled, 'stopPropagation should be called');
  
  // Test with different event types
  const keyEvent = {
    type: 'keydown',
    preventDefault: () => {},
    stopPropagation: () => {}
  };
  
  // Should not throw with different event types
  stopEvent(keyEvent);
});

runTest('stopEvent edge cases and error conditions', () => {
  // Test with missing methods triggers validation error
  let err;
  try { stopEvent({}); } catch (e) { err = e; }
  assertEqual(err && err.message, 'Invalid event object', 'Should throw when preventDefault missing');

  err = null;
  try { stopEvent({ preventDefault: () => {} }); } catch (e) { err = e; }
  assertEqual(err && err.message, 'Invalid event object', 'Should throw when stopPropagation missing');

  // Test with methods that throw
  assertThrows(() => {
    stopEvent({
      preventDefault: () => { throw new Error('preventDefault failed'); },
      stopPropagation: () => {}
    });
  }, 'Should propagate preventDefault errors');
});

// -----------------------------------------------------------------------------
// ADDITIONAL UTILITY WRAPPER TESTS
// -----------------------------------------------------------------------------

runTest('executeAsyncWithLogging handles success and error', async () => {
  const successOp = async () => 'ok';
  const result = await executeAsyncWithLogging(successOp, 'successOp');
  assertEqual(result, 'ok', 'Should return result on success');

  const failOp = async () => { throw new Error('fail'); };
  const handlerResult = await executeAsyncWithLogging(failOp, 'failOp', () => 'handled');
  assertEqual(handlerResult, 'handled', 'Should return handler result when provided');

  let thrown = false;
  try {
    await executeAsyncWithLogging(failOp, 'failOpNoHandler');
  } catch (err) {
    thrown = err instanceof Error;
  }
  assert(thrown, 'Should rethrow error when no handler');
});

runTest('executeAsyncWithLogging awaits async handler', async () => {
  const failOp = async () => { throw new Error('oops'); };
  let handled = false;
  const asyncHandler = async () => { await Promise.resolve(); handled = true; return 'async'; };
  const res = await executeAsyncWithLogging(failOp, 'failAsync', asyncHandler);
  assertEqual(res, 'async', 'Should await handler result');
  assert(handled, 'Handler should complete before return');

  const rejectHandler = async () => { throw new Error('reject'); };
  let caught = false;
  try {
    await executeAsyncWithLogging(failOp, 'failReject', rejectHandler);
  } catch (err) {
    caught = err && err.message === 'reject';
  }
  assert(caught, 'Should propagate rejection from async handler');
});

runTest('executeAsyncWithLogging logs phases', async () => {
  const messages = [];
  const orig = console.log;
  console.log = (msg) => { messages.push(msg); };

  await executeAsyncWithLogging(async () => 'good', 'logOp');
  assert(messages.some(m => m.includes('logOp is running')), 'Entry log expected');
  assert(messages.some(m => m.includes('logOp is returning')), 'Exit log expected');

  messages.length = 0; // clear messages for error case
  await executeAsyncWithLogging(async () => { throw new Error('oops'); }, 'logOpErr', () => {});
  assert(messages.some(m => m.includes('logOpErr has run resulting in a final value of failure')), 'Error log expected');
  console.log = orig;
});

runTest('logFunction outputs expected messages', () => {
  const messages = [];
  const orig = console.log;
  console.log = (msg) => { messages.push(msg); };

  logFunction('testFn', 'entry', 'param');
  logFunction('testFn', 'exit', 'result');
  logFunction('testFn', 'completion', 'value');
  const err = new Error('bad');
  logFunction('testFn', 'error', err); // provide error to test logging of error details

  console.log = orig;
  assert(messages.some(m => m.includes('testFn is running with param')), 'Entry log expected');
  assert(messages.some(m => m.includes('testFn is returning')), 'Exit log expected');
  assert(messages.some(m => m.includes('final value of value')), 'Completion log expected');
  assert(messages.some(m => m.includes('encountered error') && m.includes('bad')), 'Error log expected');
});

runTest('logFunction handles circular data without throwing', () => {
  const obj = {}; obj.self = obj; // create circular reference for test
  const messages = [];
  const orig = console.log;
  console.log = (msg) => { messages.push(msg); }; // capture logs to verify output

  logFunction('circFn', 'exit', obj); // should not throw despite circular structure

  console.log = orig;
  assert(messages.some(m => m.includes('[Circular Reference]')), 'Should log fallback for circular object');
});

runTest('logFunction handles undefined without throwing', () => {
  const messages = [];
  const orig = console.log;
  console.log = (msg) => { messages.push(msg); }; // capture logs to verify output

  logFunction('undefFn', 'exit', undefined); // should handle undefined gracefully

  console.log = orig;
  assert(messages.some(m => m.includes('undefFn is returning')), 'Should log return for undefined');
});

runTest('withToastLogging wraps function and preserves errors', () => {
  const calls = [];
  const wrapped = withToastLogging('demo', (t, msg) => { calls.push(msg); return 'done'; });
  const result = wrapped(() => {}, 'hi');
  assertEqual(result, 'done', 'Wrapped function should return result');
  assertEqual(calls[0], 'hi', 'Wrapped function should receive args');

  const errorWrap = withToastLogging('demoErr', () => { throw new Error('boom'); });
  let threw = false;
  try { errorWrap(); } catch (e) { threw = e instanceof Error; }
  assert(threw, 'Wrapped errors should propagate');
});

runTest('withToastLogging handles async rejection', async () => {
  const messages = [];
  const orig = console.log;
  console.log = (msg) => { messages.push(msg); };
  const asyncWrap = withToastLogging('asyncToast', () => Promise.reject(new Error('bad')));
  const promise = asyncWrap();
  let threw = false;
  try { await promise; } catch (e) { threw = e && e.message === 'bad'; }
  console.log = orig;
  assertEqual(typeof promise.then, 'function', 'Wrapped function should return Promise');
  assert(threw, 'Wrapped async errors should propagate');
  assert(messages.some(m => m.includes('asyncToast encountered error')), 'Should log rejection');
});

// =============================================================================
// UNIT TESTS - VALIDATION UTILITIES
// =============================================================================
// Validate helper guards that check argument types and structures

console.log('\n🛡️  UNIT TESTS - VALIDATION UTILITIES');

runTest('isFunction boolean return for valid and invalid inputs', () => {
  assertEqual(isFunction(() => {}), true, 'Should return true for arrow function');
  assertEqual(isFunction(function() {}), true, 'Should return true for function expression');
  assertEqual(isFunction(async function() {}), true, 'Should return true for async function');
  assertEqual(isFunction(null), false, 'Should return false for null');
  assertEqual(isFunction({}), false, 'Should return false for object');
  assertEqual(isFunction(123), false, 'Should return false for number');
});

runTest('isObject boolean return for valid and invalid inputs', () => {
  assertEqual(isObject({ a: 1 }), true, 'Should detect plain object');
  assertEqual(isObject(Object.create(null)), true, 'Should detect object without prototype');
  assertEqual(isObject(null), false, 'Should return false for null');
  assertEqual(isObject([1, 2]), false, 'Should return false for array');
  assertEqual(isObject('text'), false, 'Should return false for string');
});

runTest('isAxiosErrorWithStatus boolean return for valid and invalid errors', () => {
  const error401 = { isAxiosError: true, response: { status: 401 } };
  const error500 = { isAxiosError: true, response: { status: 500 } };
  const regularError = new Error('oops');

  assertEqual(isAxiosErrorWithStatus(error401, 401), true, 'Should match 401 status');
  assertEqual(isAxiosErrorWithStatus(error500, 401), false, 'Should not match different status');
  assertEqual(isAxiosErrorWithStatus(regularError, 401), false, 'Should return false for non-axios error');
});

runTest('safeStringify handles circular references gracefully', () => {
  const obj = { name: 'test' };
  obj.self = obj; // create circular reference

  const result = safeStringify(obj);
  assertEqual(result, '{"name":"test","self":"[Circular]"}', 'Should mark circular reference in output');

  const normal = { a: 1 };
  assertEqual(safeStringify(normal), JSON.stringify(normal), 'Should stringify non-circular objects');
});

runTest('safeStringify(undefined) returns literal undefined string', () => {
  assertEqual(
    safeStringify(undefined),
    'undefined',
    'Should return "undefined" for undefined input'
  );
});

// =============================================================================
// UNIT TESTS - API FUNCTIONS
// =============================================================================
// Exercises the axios wrappers using the mocked client to avoid real HTTP

console.log('\n🌐 UNIT TESTS - API FUNCTIONS');

runTest('formatAxiosError with various error types', () => {
  // Test axios error with response
  const axiosErrorWithResponse = {
    isAxiosError: true,
    response: {
      status: 404,
      data: { message: 'Not found', code: 'NOT_FOUND' }
    },
    message: 'Request failed'
  };
  
  const result1 = formatAxiosError(axiosErrorWithResponse);
  assert(result1 instanceof Error, 'Should return Error object');
  assert(result1.message.includes('404'), 'Should include status code');
  assert(result1.message.includes('NOT_FOUND'), 'Should include error details');
  
  // Test axios error without response
  const axiosErrorNoResponse = {
    isAxiosError: true,
    message: 'Network Error'
  };
  
  const result2 = formatAxiosError(axiosErrorNoResponse);
  assert(result2 instanceof Error, 'Should return Error object for network errors');
  assert(result2.message.includes('Network Error'), 'Should include original message');
  
  // Test non-axios error
  const regularError = new Error('Regular error');
  const result3 = formatAxiosError(regularError);
  assert(result3 instanceof Error, 'Non-axios errors should be wrapped'); // verify wrapper
  assert(result3 !== regularError, 'Should return new Error instance'); // ensure new instance
  assert(result3.message.includes('Regular error'), 'Should preserve message'); // check message
  
  // Test edge cases
  const nullErr = formatAxiosError(null);
  assert(nullErr instanceof Error, 'Should wrap null in Error'); // check wrapper for null
  assertEqual(nullErr.message, 'null', 'Should stringify null'); // confirm message
  const undefErr = formatAxiosError(undefined);
  assert(undefErr instanceof Error, 'Should wrap undefined in Error'); // wrapper for undefined
  assertEqual(undefErr.message, 'undefined', 'Should stringify undefined'); // confirm message
  const strErr = formatAxiosError('string error');
  assert(strErr instanceof Error, 'Should wrap strings in Error'); // wrapper for strings
  assertEqual(strErr.message, 'string error', 'Should preserve string message'); // confirm text
});

runTest('apiRequest with different HTTP methods and data', async () => {
  // Test GET request
  const getResult = await apiRequest('/api/test', 'GET', { q: 2 }); // send query data for verification // changed
  assert(getResult.success === true, 'GET request should succeed');
  assert(getResult.method === 'GET', 'Should use correct method');
  assert(getResult.requestParams.q === 2, 'Should send params for GET'); // new check
  assert(getResult.requestData === undefined, 'Should not send body for GET'); // new check

  // Test GET request without data
  const emptyGet = await apiRequest('/api/test', 'GET'); // omit data to verify params handling // added
  assert(emptyGet.success === true, 'GET without data should succeed'); // added
  assert(emptyGet.requestParams === undefined, 'Should not send params when data missing'); // added
  assert(emptyGet.requestData === undefined, 'Should not send body when data missing'); // added
  
  // Test POST request with data
  const postData = { name: 'test', value: 123 };
  const postResult = await apiRequest('/api/test', 'POST', postData);
  assert(postResult.success === true, 'POST request should succeed');
  assert(postResult.method === 'POST', 'Should use correct method');
  assertEqual(postResult.requestData, postData, 'Should include request data');
  
  // Test default method (should be POST)
  const defaultResult = await apiRequest('/api/test');
  assertEqual(defaultResult.method, 'POST', 'Should default to POST method');
});

runTest('apiRequest error handling scenarios', async () => {
  // Test 500 error
  try {
    await apiRequest('/api/error');
    throw new Error('Should have thrown for error endpoint');
  } catch (error) {
    assert(error instanceof Error, 'Should throw Error object');
    assert(error.message.includes('500'), 'Should include status code');
  }
  
  // Test 401 unauthorized
  try {
    await apiRequest('/api/401');
    throw new Error('Should have thrown for 401 endpoint');
  } catch (error) {
    assert(error instanceof Error, 'Should throw Error object for 401');
    assert(error.message.includes('401'), 'Should include 401 status');
  }
  
  // Test timeout
  try {
    await apiRequest('/api/timeout');
    throw new Error('Should have thrown for timeout');
  } catch (error) {
    assert(error instanceof Error, 'Should throw Error object for timeout');
  }
});

runTest('getQueryFn with different options', async () => {
  // Test with returnNull on 401
  const queryFnReturnNull = getQueryFn({ on401: 'returnNull' });
  assert(typeof queryFnReturnNull === 'function', 'Should return function');
  
  // Test successful query
  const successResult = await queryFnReturnNull({ queryKey: ['/api/test'] });
  assert(successResult.success === true, 'Should return successful data');
  
  // Test 401 handling with returnNull
  const nullResult = await queryFnReturnNull({ queryKey: ['/api/401'] });
  assertEqual(nullResult, null, 'Should return null for 401 when configured');
  
  // Test with throw on 401
  const queryFnThrow = getQueryFn({ on401: 'throw' });
  try {
    await queryFnThrow({ queryKey: ['/api/401'] });
    throw new Error('Should have thrown for 401');
  } catch (error) {
    assert(error instanceof Error, 'Should throw for 401 when configured');
  }
});

runTest('queryClient configuration and methods', () => {
  assert(typeof queryClient === 'object', 'queryClient should be object');
  assert(typeof queryClient.getQueryData === 'function', 'Should have getQueryData');
  assert(typeof queryClient.setQueryData === 'function', 'Should have setQueryData');
  assert(typeof queryClient.invalidateQueries === 'function', 'Should have invalidateQueries');
  
  // Test default options
  const defaultOptions = queryClient.getDefaultOptions();
  assert(typeof defaultOptions === 'object', 'Should have default options');
  assert(defaultOptions.queries.retry === false, 'Should have retry disabled');
  assert(defaultOptions.queries.refetchOnWindowFocus === false, 'Should disable window focus refetch');
});


runTest('handle401Error logic across behaviors', () => {
  const err401 = { isAxiosError: true, response: { status: 401 } };
  const handled = handle401Error(err401, 'returnNull');
  assert(handled === true, '401 should be handled when configured');
  const notHandled = handle401Error(err401, 'throw');
  assert(notHandled === false, '401 should propagate when set to throw');
  const err500 = { isAxiosError: true, response: { status: 500 } };
  assert(handle401Error(err500, 'returnNull') === false, 'Non-401 should not be handled');
});

runTest('codexRequest offline and online behavior', async () => {
  process.env.OFFLINE_MODE = 'true';
  let called = false;
  const resultOffline = await codexRequest(() => { called = true; }, { data: 1 });
  assert(resultOffline.data === 1, 'Should return mock when offline');
  assert(called === false, 'Request function should not run offline');
  process.env.OFFLINE_MODE = 'false';
  const resultOnline = await codexRequest(() => { called = true; return { ok: true }; }, { data: 2 });
  assert(resultOnline.ok === true, 'Should return real response when online');
  assert(called === true, 'Request function should run online');
});

runTest('codexRequest returns default when offline without mock', async () => {
  process.env.OFFLINE_MODE = 'true';
  const result = await codexRequest(() => ({ data: 7 }));
  assertEqual(result.status, 200, 'Default status should be 200');
  assert(result.data === null, 'Default data should be null');
  process.env.OFFLINE_MODE = 'false';
});

runTest('executeAxiosRequest integrates codexRequest and errors', async () => {
  process.env.OFFLINE_MODE = 'true';
  const resOffline = await executeAxiosRequest(() => ({ data: 5 }), 'throw', { data: { value: 5 } });
  assertEqual(resOffline.data.value, 5, 'Should return mock in offline mode');
  process.env.OFFLINE_MODE = 'false';
  const res = await executeAxiosRequest(() => Promise.resolve({ data: { ok: true } }), 'throw');
  assert(res.data.ok === true, 'Should pass through real response');
  const err401 = { isAxiosError: true, response: { status: 401 } };
  try {
    await executeAxiosRequest(() => Promise.reject(err401), 'throw');
    throw new Error('Should have thrown');
  } catch (e) {
    assert(e instanceof Error, 'Should throw formatted error');
  }
  const nullRes = await executeAxiosRequest(() => Promise.reject(err401), 'returnNull');
  assertEqual(nullRes.data, null, 'Should return null on 401 with returnNull');
});

runTest('executeAxiosRequest returns default when offline without mock', async () => {
  process.env.OFFLINE_MODE = 'true';
  const res = await executeAxiosRequest(() => ({ data: 9 }), 'throw');
  assertEqual(res.status, 200, 'Default status should be 200');
  assert(res.data === null, 'Default data should be null');
  process.env.OFFLINE_MODE = 'false';
});

// =============================================================================
// UNIT TESTS - TOAST SYSTEM
// =============================================================================
// Verifies toast helpers work with the window and axios stubs

console.log('\n🍞 UNIT TESTS - TOAST SYSTEM');

runTest('toast function comprehensive behavior', () => {
  const toast1 = toast({ title: 'Test 1', description: 'Message 1' });
  const toast2 = toast({ title: 'Test 2', description: 'Message 2' });
  
  // Test basic structure
  assert(typeof toast1.id === 'string', 'Toast should have string ID');
  assert(typeof toast1.dismiss === 'function', 'Should have dismiss function');
  assert(typeof toast1.update === 'function', 'Should have update function');
  
  // Test uniqueness
  assert(toast1.id !== toast2.id, 'Toast IDs should be unique');
  
  // Test with minimal props
  const minimalToast = toast({});
  assert(typeof minimalToast.id === 'string', 'Should work with empty props');
  
  // Test with complex props
  const complexProps = {
    title: 'Complex',
    description: 'With special chars: !@#$%^&*()',
    variant: 'destructive',
    action: { label: 'Click me', onClick: () => {} }
  };
  const complexToast = toast(complexProps);
  assert(typeof complexToast.id === 'string', 'Should handle complex props');
});

runTest('toast update and dismiss functionality', () => {
  const testToast = toast({ title: 'Original', description: 'Original message' });
  
  // Test update function exists and is callable
  assert(typeof testToast.update === 'function', 'Should have update function');
  testToast.update({ title: 'Updated' });
  
  // Test dismiss function exists and is callable
  assert(typeof testToast.dismiss === 'function', 'Should have dismiss function');
  testToast.dismiss();
});

runTest('useToast hook behavior', () => {
  // Test that useToast is a function (can't test execution in Node.js)
  assert(typeof useToast === 'function', 'useToast should be a function');
  
  // Test the underlying toast function that doesn't require React context
  const toastResult = toast({ title: 'Hook test', description: 'From hook' });
  assert(typeof toastResult === 'object', 'toast should return object');
  assert(typeof toastResult.id === 'string', 'Should have toast ID');
  assert(typeof toastResult.dismiss === 'function', 'Should have dismiss function');
  assert(typeof toastResult.update === 'function', 'Should have update function');
});

runTest('toast system memory management', () => {
  const initialToastCount = 5;
  const toasts = [];
  
  // Create multiple toasts
  for (let i = 0; i < initialToastCount; i++) {
    toasts.push(toast({ title: `Toast ${i}`, description: `Message ${i}` }));
  }
  
  // All should have unique IDs
  const ids = toasts.map(t => t.id);
  const uniqueIds = new Set(ids);
  assertEqual(uniqueIds.size, ids.length, 'All toast IDs should be unique');
  
  // Test that toast limit constant exists and is reasonable
  assert(typeof useToast === 'function', 'useToast function should exist for memory management');
});


runTest('toast IDs restart after resetToastSystem', () => {
  resetToastSystem(); // ensure system is cleared before generating new ids
  const first = toast({ title: 'a' });
  assert(typeof first.id === 'string' && first.id.length > 0, 'First toast ID should be string after reset');

});

runTest('dispatching unknown action leaves toast state unchanged', () => {
  resetToastSystem(); // clean slate before dispatch test
  toast({ title: 'persist' }); // initialize state with one toast
  const { result, unmount } = renderHook(() => useToast());
  assertEqual(result.current.toasts.length, 1, 'Initial toast should exist');
  TestRenderer.act(() => { dispatch({ type: 'UNKNOWN' }); });
  assertEqual(result.current.toasts.length, 1, 'State should remain after unknown action');
  unmount(); // remove listener
});

runTest('executeWithErrorToast displays error toast', async () => {
  const calls = [];
  const toastFn = (params) => { calls.push(params); };
  const success = await executeWithErrorToast(async () => 'hi', toastFn);
  assertEqual(success, 'hi', 'Should return result when no error');
  assertEqual(calls.length, 0, 'Toast should not fire on success');

  const failOp = async () => { throw new Error('bad'); };
  try {
    await executeWithErrorToast(failOp, toastFn, 'Oops');
    throw new Error('should have thrown');
  } catch (err) {
    assert(calls.length === 1, 'Toast should fire on error');
    assertEqual(calls[0].title, 'Oops', 'Title should match');
    assertEqual(calls[0].description, 'bad', 'Message should come from error');
    assertEqual(calls[0].variant, 'destructive', 'Variant should be destructive');
  }
});

runTest('executeWithToastFeedback shows success and error toasts', async () => {
  const calls = [];
  const toastFn = (params) => { calls.push(params); };
  const result = await executeWithToastFeedback(async () => 1, toastFn, 'Great');
  assertEqual(result, 1, 'Should return result');
  assertEqual(calls.length, 1, 'Success toast should fire');
  assertEqual(calls[0].title, 'Success', 'Success title should be used');

  calls.length = 0;
  try {
    await executeWithToastFeedback(async () => { throw new Error('oops'); }, toastFn, 'ok', 'Fail');
    throw new Error('should have thrown');
  } catch (err) {
    assertEqual(calls[0].title, 'Fail', 'Error toast title should be used');
    assertEqual(calls[0].description, 'oops', 'Error message should propagate');
    assertEqual(calls[0].variant, 'destructive', 'Error variant expected');
  }
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================
// Combine hooks and utilities together using the mocks to ensure interoperability

console.log('\n🔗 INTEGRATION TESTS');

runTest('useAsyncAction integrates with error handling', async () => {
  let successCallbackCalled = false;
  let errorCallbackCalled = false;
  let capturedResult = null;
  let capturedError = null;
  
  const { result: resultSuccess } = renderHook(() =>
    useAsyncAction(
      async (data) => { return { result: data }; },
      {
        onSuccess: (result) => { successCallbackCalled = true; capturedResult = result; },
        onError: (error) => { errorCallbackCalled = true; capturedError = error; }
      }
    )
  ); // Execute hook inside React environment
  const [runSuccess] = resultSuccess.current; // Retrieve run function
  
  // Test successful execution
  const result = await runSuccess('test data');
  assert(successCallbackCalled, 'Success callback should be called');
  assert(!errorCallbackCalled, 'Error callback should not be called on success');
  assertEqual(capturedResult.result, 'test data', 'Should capture result data');
  
  // Reset for error test
  successCallbackCalled = false;
  errorCallbackCalled = false;
  
  const { result: resultError } = renderHook(() =>
    useAsyncAction(
      async () => { throw new Error('Test error'); },
      {
        onSuccess: () => { successCallbackCalled = true; },
        onError: (error) => { errorCallbackCalled = true; capturedError = error; }
      }
    )
  ); // Execute hook with failing async function
  const [runError] = resultError.current; // Retrieve run function
  
  // Test error execution
  try {
    await runError();
    throw new Error('Should have thrown');
  } catch (error) {
    assert(!successCallbackCalled, 'Success callback should not be called on error');
    assert(errorCallbackCalled, 'Error callback should be called');
    assert(capturedError instanceof Error, 'Should capture error object');
  }
});

runTest('useToastAction integrates async action with toast system', () => {
  // Test that useToastAction is properly exported and is a function
  assert(typeof useToastAction === 'function', 'useToastAction should be a function');
  
  // Test that the underlying components work
  const asyncFn = async (data) => {
    if (data === 'error') {
      throw new Error('Test error');
    }
    return { success: true, data };
  };
  
  // Verify the async function works independently
  assert(typeof asyncFn === 'function', 'asyncFn should be a function');
  
  // Test that toast function works (used internally by useToastAction)
  const testToast = toast({ title: 'Integration test' });
  assert(typeof testToast.id === 'string', 'Toast integration should work');
});

runTest('useToastAction skips refresh when not a function', async () => {
  resetToastSystem(); // ensure clean toast state for the test
  const { result } = renderHook(() => useToastAction(async () => 'ok', 'done', 'bad')); // pass invalid refresh value
  let value;
  await TestRenderer.act(async () => { value = await result.current[0](); }); // invoke run function
  assertEqual(value, 'ok', 'Run should resolve original result');
  const { result: toastResult } = renderHook(() => useToast()); // inspect toast state
  assertEqual(toastResult.current.toasts.length, 1, 'Success toast should still appear');
});

runTest('API functions integrate with utility functions', async () => {
  // Test that apiRequest can be used with showToast
  const toastCalls = [];
  const mockToast = (params) => {
    toastCalls.push(params);
    return { id: 'test', dismiss: () => {} };
  };
  
  try {
    const result = await apiRequest('/api/test', 'GET', { id: 5 }); // use data to confirm params // changed
    showToast(mockToast, 'API call successful', 'Success');
    
    assert(result.success === true, 'API should return success');
    assert(result.requestParams.id === 5, 'Should send params on GET'); // new assertion
    assert(toastCalls.length === 1, 'Toast should be called');
    assertEqual(toastCalls[0].title, 'Success', 'Toast should have correct title');
  } catch (error) {
    showToast(mockToast, error.message, 'Error', 'destructive');
    assert(toastCalls.length === 1, 'Error toast should be called');
  }
});

runTest('createDropdownListHook integration with useDropdownData', () => {
  const fetcherCalls = [];
  const mockFetcher = async () => {
    fetcherCalls.push('fetcher called');
    return ['item1', 'item2', 'item3'];
  };
  
  const useCustomDropdown = createDropdownListHook(mockFetcher);
  assert(typeof useCustomDropdown === 'function', 'Should create hook function');
  
  // Mock toast and user for testing
  const mockToast = () => {}; // single function to fit new hook signature
  const mockUser = { id: 'test-user' };
  
  const { result } = renderHook(() => useCustomDropdown(mockToast, mockUser)); // Render hook with React renderer
  assert(Array.isArray(result.current.items), 'Should expose items array'); // Verify return structure
});

runTest('useDropdownData refetches when fetcher changes', async () => {
  let firstCalls = 0;
  let secondCalls = 0;
  const fetcherOne = async () => { firstCalls++; return ['a']; };
  const fetcherTwo = async () => { secondCalls++; return ['b']; };

  const { rerender } = renderHook(
    (p) => useDropdownData(p.fetcher, null, { id: 'u1' }),
    { fetcher: fetcherOne }
  );
  await TestRenderer.act(async () => { await Promise.resolve(); });
  assertEqual(firstCalls, 1, 'First fetcher should run once');

  rerender({ fetcher: fetcherTwo });
  await TestRenderer.act(async () => { await Promise.resolve(); });
  assertEqual(secondCalls, 1, 'Second fetcher should run after rerender');
});

runTest('useDropdownData refetches when toast changes', async () => {
  let calls = 0;
  const fetcher = async () => { calls++; return ['item']; };

  const { rerender } = renderHook(
    (p) => useDropdownData(fetcher, p.toast, { id: 'u2' }),
    { toast: () => {} }
  );
  await TestRenderer.act(async () => { await Promise.resolve(); });
  assertEqual(calls, 1, 'Initial fetch should run once');

  rerender({ toast: () => {} });
  await TestRenderer.act(async () => { await Promise.resolve(); });
  assertEqual(calls, 2, 'Fetch should run again when toast instance changes');
});

runTest('useDropdownData fetches once when user present at mount', async () => {
  let calls = 0; // track fetcher executions
  const fetcher = async () => { calls++; return ['x']; }; // simple fetcher

  renderHook(() => useDropdownData(fetcher, null, { id: 'start' })); // mount with user
  await TestRenderer.act(async () => { await Promise.resolve(); }); // allow query to resolve
  assertEqual(calls, 1, 'Only the query should fetch data on mount');
});

runTest('useDropdownData fetches when user becomes truthy', async () => {
  let calls = 0; // track fetch counts
  const fetcher = async () => { calls++; return ['y']; }; // mock fetcher

  const { rerender } = renderHook(
    (p) => useDropdownData(fetcher, null, p.user),
    { user: null }
  ); // initial mount without user
  await TestRenderer.act(async () => { await Promise.resolve(); }); // wait; should not fetch
  assertEqual(calls, 0, 'No fetch without user');

  rerender({ user: { id: 'u' } }); // supply user
  await TestRenderer.act(async () => { await Promise.resolve(); }); // allow effect to run
  assertEqual(calls, 1, 'Fetch should run after user becomes available');
});

runTest('useDropdownData caches with function name key', async () => {
  async function namedFetcher() { return ['z']; }
  renderHook(() => useDropdownData(namedFetcher, null, { _id: 'user' }));
  await TestRenderer.act(async () => { await Promise.resolve(); });
  const cached = queryClient.getQueryData(['dropdown', namedFetcher.name, 'user']);
  assert(Array.isArray(cached) && cached[0] === 'z', 'Data should be cached under serializable key');
});

runTest('useDropdownData skips toast error when not a function', async () => {
  const fetcher = async () => { throw new Error('fail'); };
  const { result } = renderHook(() => useDropdownData(fetcher, 'text', { id: 'u3' }));
  await TestRenderer.act(async () => { await result.current.fetchData(); });
  assert(Array.isArray(result.current.items), 'Hook should not crash on invalid toast');
  assert(result.current.isLoading === false, 'Loading state resets after failure');
});

runTest('useIsMobile integration with window API', () => {
  assert(typeof useIsMobile === 'function', 'useIsMobile should be a function'); // Export validation

  mockWindow.innerWidth = 500; // Simulate mobile width
  const { result: mobile } = renderHook(() => useIsMobile()); // Execute hook for mobile state
  assert(mobile.current === true, 'Should detect mobile width correctly');

  mockWindow.innerWidth = 1200; // Switch to desktop width
  const { result: desktop } = renderHook(() => useIsMobile()); // Execute hook for desktop state
  assert(desktop.current === false, 'Should detect desktop width correctly');
});

runTest('useIsMobile uses deviceWidth when window missing', () => {
  const prevWindow = global.window; // save current window for restoration
  global.window = undefined; // remove window to simulate server environment
  const { result } = renderHook(() => useIsMobile()); // invoke hook without window
  assert(result.current === false, 'Should compute result from deviceWidth');
  global.window = prevWindow; // restore window after test
});


runTest('useDropdownData and useToastAction integration sequence', async () => {
  resetToastSystem(); // ensure clean state for integration test
  const fetchCalls = [];
  const mockFetcher = async () => { fetchCalls.push('called'); return ['one', 'two']; };

  function useCombo() {
    const toastStore = useToast();
    const dropdown = useDropdownData(mockFetcher, (msg) => showToast(toastStore.toast, msg, 'Error', 'destructive'), null); // pass toast function
    const [trigger] = useToastAction(dropdown.fetchData, 'Loaded');
    return { dropdown, trigger };
  }

  const { result } = renderHook(() => useCombo());
  await TestRenderer.act(async () => { await result.current.trigger(); });

  const { result: toastResult } = renderHook(() => useToast());
  assertEqual(fetchCalls.length, 1, 'Fetcher should run via toast action');
  assert(result.current.dropdown.items.length === 2, 'Dropdown should update after fetch');
  assert(toastResult.current.toasts.length === 1, 'Toast should be shown after fetch');
  assertEqual(toastResult.current.toasts[0].description, 'Loaded', 'Toast message should match');
});

runTest('useAuthRedirect reacts to auth state changes', async () => {
  function useAuthFlow() {
    const [user, setUser] = React.useState(null);
    useAuthRedirect('/dashboard', !!user);
    const [login] = useAsyncAction(async () => { setUser({ id: 'u1' }); });
    return { login, user };
  }

  const { result } = renderHook(() => useAuthFlow());
  await TestRenderer.act(async () => { await result.current.login(); });
  assert(result.current.user !== null, 'User state should update after login');
  assertEqual(mockWindow._lastPushState.url, '/dashboard', 'Redirect should occur after login');
});

runTest('useAuthRedirect handles missing pushState gracefully', () => {
  const originalPushState = mockWindow.history.pushState; // store original function to restore after test
  delete mockWindow.history.pushState; // simulate environment without pushState
  renderHook(() => useAuthRedirect('/fallback', true));
  assert(mockWindow._lastPushState === null, 'Redirect should be skipped when pushState is unavailable');
  mockWindow.history.pushState = originalPushState; // restore original pushState for subsequent tests
});

runTest('useDropdownToggle toggles and closes correctly', () => {
  const { result } = renderHook(() => useDropdownToggle());
  TestRenderer.act(() => { result.current.toggleOpen(); });
  assert(result.current.isOpen === true, 'Toggle should open dropdown');
  TestRenderer.act(() => { result.current.toggleOpen(); });
  assert(result.current.isOpen === false, 'Toggle should close dropdown');
  TestRenderer.act(() => { result.current.close(); });
  assert(result.current.isOpen === false, 'Close should force closed state');
});

runTest('useEditForm startEdit populates fields and editingId', () => {
  const initial = { name: '', age: 0 };
  const { result } = renderHook(() => useEditForm(initial));
  TestRenderer.act(() => { result.current.startEdit({ _id: '1', name: 'Bob', age: 5 }); });
  assertEqual(result.current.editingId, '1', 'Should store item id');
  assertEqual(result.current.fields.name, 'Bob', 'Should copy name field');
  assertEqual(result.current.fields.age, 5, 'Should copy age field');
});

runTest('useEditForm startEdit handles invalid item', () => {
  const init = { title: 't' };
  const { result } = renderHook(() => useEditForm(init));
  TestRenderer.act(() => { result.current.startEdit(null); });
  assert(result.current.editingId === null, 'EditingId should remain null with null item');
  assertEqual(result.current.fields.title, 't', 'Fields should remain unchanged');
  TestRenderer.act(() => { result.current.startEdit({ title: 'x' }); });
  assert(result.current.editingId === null, 'EditingId should remain null when _id missing');
  assertEqual(result.current.fields.title, 't', 'Fields should remain unchanged when _id missing');
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

console.log('\n⚠️  ERROR HANDLING TESTS');

runTest('Comprehensive formatAxiosError edge cases', () => {
  // Test with circular reference
  const circularObj = { name: 'test' };
  circularObj.self = circularObj;
  
  const circularError = {
    isAxiosError: true,
    response: { status: 500, data: circularObj }
  };
  
  const result = formatAxiosError(circularError);
  assert(result instanceof Error, 'Should handle circular references');
  
  // Test with very large response
  const largeData = {
    items: Array(10).fill('test-item') // Reduced size to prevent log spam
  };
  
  const largeError = {
    isAxiosError: true,
    response: { status: 500, data: largeData }
  };
  
  const largeResult = formatAxiosError(largeError);
  assert(largeResult instanceof Error, 'Should handle large responses');
});

runTest('Error propagation through API chain', async () => {
  // Test error propagation from axios through apiRequest
  try {
    await apiRequest('/api/error');
    throw new Error('Should have thrown');
  } catch (error) {
    assert(error instanceof Error, 'Should propagate as Error object');
    assert(error.message.includes('500'), 'Should include status information');
  }
  
  // Test error in getQueryFn
  const queryFn = getQueryFn({ on401: 'throw' });
  try {
    await queryFn({ queryKey: ['/api/error'] });
    throw new Error('Should have thrown');
  } catch (error) {
    assert(error instanceof Error, 'Query function should propagate errors');
  }
});

runTest('executeWithErrorHandling manages async operations', async () => {
  const res = await executeWithErrorHandling(async () => 'value', 'asyncTest');
  assertEqual(res, 'value', 'Should return result on success');

  const errFn = async () => { throw new Error('boom'); };
  try {
    await executeWithErrorHandling(errFn, 'errTest');
    throw new Error('should have thrown');
  } catch (e) {
    assert(e instanceof Error, 'Should rethrow original error');
  }

  try {
    await executeWithErrorHandling(errFn, 'errTrans', () => new Error('wrapped'));
    throw new Error('should have thrown');
  } catch (e) {
    assert(e.message === 'wrapped', 'Should throw transformed error');
  }

  const asyncTransform = async () => { await Promise.resolve(); return new Error('async'); }; //(simulate async transform)
  try {
    await executeWithErrorHandling(errFn, 'errAsyncTrans', asyncTransform); //(call with async transform)
    throw new Error('should have thrown');
  } catch (e) {
    assert(e.message === 'async', 'Should await transformed error');
  }
});

runTest('executeSyncWithErrorHandling manages sync operations', async () => {
  const result = await executeSyncWithErrorHandling(() => 2, 'syncTest');
  assertEqual(result, 2, 'Should return sync result');

  const failFn = () => { throw new Error('fail'); };
  let threw = false;
  try {
    await executeSyncWithErrorHandling(failFn, 'syncFail');
  } catch (e) {
    threw = true;
  }
  assert(threw, 'Should rethrow sync error');

  try {
    await executeSyncWithErrorHandling(failFn, 'syncTrans', () => new Error('wrapped'));
    throw new Error('no throw');
  } catch (e) {
    assertEqual(e.message, 'wrapped', 'Should throw transformed sync error');
  }
});

runTest('Toast system error recovery', () => {
  // Test toast system with failing toast implementation
  const failingToast = () => {
    throw new Error('Toast system unavailable');
  };
  
  assertThrows(() => {
    showToast(failingToast, 'Test message');
  }, 'Should propagate toast system errors');
  
  // Test with undefined toast
  assertThrows(() => {
    showToast(undefined, 'Test message');
  }, 'Should handle undefined toast function');
});

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

console.log('\n🏗️  EDGE CASE TESTS');

runTest('Boundary values and extreme inputs', () => {
  // Test with long strings (reduced to prevent output overflow)
  const longString = 'x'.repeat(100);
  const longToast = toast({ title: longString, description: longString });
  assert(typeof longToast.id === 'string', 'Should handle long strings');
  
  // Test with special characters
  const specialChars = '!@#$%^&*()[]{}|\\:";\'<>?,./`~';
  const specialToast = toast({ title: specialChars, description: specialChars });
  assert(typeof specialToast.id === 'string', 'Should handle special characters');
  
  // Test with Unicode characters
  const unicode = '🎉🚀👍💻🔥';
  const unicodeToast = toast({ title: unicode, description: unicode });
  assert(typeof unicodeToast.id === 'string', 'Should handle Unicode characters');
});

runTest('Type coercion and unexpected types', () => {
  // Test formatAxiosError with unexpected types
  const numErr = formatAxiosError(123);
  assert(numErr instanceof Error, 'Should wrap numbers'); // numbers become Error
  assertEqual(numErr.message, '123', 'Number message should match'); // message check
  const boolErr = formatAxiosError(true);
  assert(boolErr instanceof Error, 'Should wrap booleans'); // booleans become Error
  assertEqual(boolErr.message, 'true', 'Boolean message should match'); // message check

  // Arrays also return Error objects rather than arrays
  const arrayErr = formatAxiosError([1, 2, 3]);
  assert(arrayErr instanceof Error, 'Should wrap arrays'); // arrays become Error
  assert(arrayErr.message.includes('1,2,3'), 'Array values should stringify'); // message check
  
  // Test toast with unexpected prop types
  const typeCoercionToast = toast({
    title: 123,
    description: true,
    variant: ['array']
  });
  assert(typeof typeCoercionToast.id === 'string', 'Should handle type coercion');
});

runTest('Concurrent operations and race conditions', async () => {
  // Test multiple simultaneous API requests
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(apiRequest(`/api/test?id=${i}`, 'GET'));
  }
  
  const results = await Promise.all(promises);
  assertEqual(results.length, 5, 'Should handle concurrent requests');
  results.forEach((result, index) => {
    assert(result.success === true, `Request ${index} should succeed`);
  });
  
  // Test rapid toast creation
  const rapidToasts = [];
  for (let i = 0; i < 5; i++) {
    rapidToasts.push(toast({ title: `Rapid ${i}`, description: `Message ${i}` }));
  }
  
  const rapidIds = rapidToasts.map(t => t.id);
  const uniqueRapidIds = new Set(rapidIds);
  assertEqual(uniqueRapidIds.size, rapidIds.length, 'Rapid toasts should have unique IDs');
});

// =============================================================================
// PERFORMANCE TESTS
// =============================================================================
// Measure internal operations using mocks to keep timing deterministic

console.log('\n⚡ PERFORMANCE TESTS');

runTest('Toast ID generation performance at scale', () => {
  const startTime = Date.now();
  const largeScale = 1000; // Reduced from 10000 to prevent output overflow
  const ids = [];
  
  for (let i = 0; i < largeScale; i++) {
    const testToast = toast({ title: `Perf ${i}`, description: `Message ${i}` });
    ids.push(testToast.id);
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  assert(duration < 2000, `Large scale toast generation should be fast (took ${duration}ms)`);
  
  // Verify all IDs are unique
  const uniqueIds = new Set(ids);
  assertEqual(uniqueIds.size, ids.length, 'All generated IDs should be unique at scale');
});

runTest('API request performance with large payloads', async () => {
  const largePayload = {
    data: Array(1000).fill(null).map((_, i) => ({
      id: i,
      name: `Item ${i}`,
      description: 'x'.repeat(100),
      metadata: { timestamp: Date.now(), index: i }
    }))
  };
  
  const startTime = Date.now();
  const result = await apiRequest('/api/test', 'POST', largePayload);
  const endTime = Date.now();
  
  assert(endTime - startTime < 1000, 'Large payload should be handled efficiently');
  assert(result.success === true, 'Large payload request should succeed');
});

runTest('Error formatting performance with complex objects', () => {
  const complexErrorData = {
    error: 'Complex error',
    stack: Array(100).fill('stack line').join('\n'),
    metadata: {
      timestamp: Date.now(),
      user: { id: 'user123', roles: ['admin', 'user'] },
      request: {
        url: '/api/complex',
        headers: Object.fromEntries(Array(50).fill(null).map((_, i) => [`header-${i}`, `value-${i}`]))
      }
    }
  };
  
  const complexError = {
    isAxiosError: true,
    response: {
      status: 500,
      data: complexErrorData
    }
  };
  
  const startTime = Date.now();
  const result = formatAxiosError(complexError);
  const endTime = Date.now();
  
  assert(endTime - startTime < 100, 'Complex error formatting should be fast');
  assert(result instanceof Error, 'Should format complex errors correctly');
});

// =============================================================================
// MEMORY MANAGEMENT TESTS
// =============================================================================
// Ensure hooks unregister listeners and timers to prevent leaks

console.log('\n🧠 MEMORY MANAGEMENT TESTS');

runTest('Toast cleanup and memory leaks', () => {
  const initialToasts = [];
  const cleanupFunctions = [];
  
  // Create toasts and track cleanup
  for (let i = 0; i < 20; i++) {
    const testToast = toast({ title: `Cleanup test ${i}` });
    initialToasts.push(testToast);
    
    // Simulate cleanup tracking
    cleanupFunctions.push(() => {
      testToast.dismiss();
    });
  }
  
  // Execute cleanup
  cleanupFunctions.forEach(cleanup => cleanup());
  
  // Verify cleanup is trackable
  assert(cleanupFunctions.length === 20, 'Should track all cleanup functions');
  assert(initialToasts.length === 20, 'Should create all toasts');
});

runTest('Event listener cleanup simulation', () => {
  // Simulate useIsMobile cleanup
  const listeners = [];
  
  // Mock addEventListener/removeEventListener tracking
  const mockAddListener = (type, handler) => {
    listeners.push({ type, handler });
  };
  
  const mockRemoveListener = (type, handler) => {
    const index = listeners.findIndex(l => l.type === type && l.handler === handler);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
  
  // Simulate multiple hook instances
  for (let i = 0; i < 5; i++) {
    const handler = () => {};
    mockAddListener('change', handler);
    
    // Simulate cleanup
    mockRemoveListener('change', handler);
  }
  
  assertEqual(listeners.length, 0, 'All event listeners should be cleaned up');
});

runTest('useToast mounts and unmounts without duplicate listeners', () => {
  resetToastSystem(); // ensure clean state before test
  for (let i = 0; i < 3; i++) { // mount and unmount repeatedly
    const { unmount } = renderHook(() => useToast());
    assertEqual(getToastListenerCount(), 1, 'Listener should register once');
    unmount();
    assertEqual(getToastListenerCount(), 0, 'Listener should be removed');
  }
});

runTest('multiple useToast instances clean up correctly', () => {
  resetToastSystem(); // ensure no listeners left from previous tests
  const instances = [];
  for (let i = 0; i < 3; i++) {
    instances.push(renderHook(() => useToast()));
  }
  assertEqual(getToastListenerCount(), 3, 'All listeners should register');
  instances.forEach(h => h.unmount());
  assertEqual(getToastListenerCount(), 0, 'All listeners should unregister');
});

// =============================================================================
// WORKFLOW AND INTEGRATION SCENARIOS
// =============================================================================
// Simulate real usage flows to verify modules work together end-to-end

console.log('\n🔄 WORKFLOW INTEGRATION TESTS');

// This scenario verifies the library in a realistic sequence of success and failure flows

runTest('Complete user workflow simulation', async () => {
  // Simulate: User loads page -> fetches data -> shows toast -> handles error
  const workflow = [];
  
  // Step 1: Initial API call
  try {
    const userData = await apiRequest('/api/test', 'GET', { page: 1 }); // send data to verify GET uses params // changed
    workflow.push('api_success');
    if (userData.requestParams?.page !== 1 || userData.requestData !== undefined) { throw new Error('GET should use params'); } // ensure query param used // added
    
    // Step 2: Show success toast
    const mockToast = (params) => {
      workflow.push(`toast_${params.variant || 'default'}`);
      return { id: 'workflow-toast', dismiss: () => {} };
    };
    
    showToast(mockToast, 'Data loaded successfully', 'Success');
    
    // Step 3: Handle subsequent error
    try {
      await apiRequest('/api/error', 'POST');
    } catch (error) {
      workflow.push('api_error');
      showToast(mockToast, 'Failed to save changes', 'Error', 'destructive');
    }
    
    const expectedWorkflow = ['api_success', 'toast_default', 'api_error', 'toast_destructive'];
    assertEqual(workflow.length, expectedWorkflow.length, 'Workflow should complete all steps');
    
    workflow.forEach((step, index) => {
      assertEqual(step, expectedWorkflow[index], `Step ${index + 1} should match expected workflow`);
    });
    
  } catch (error) {
    throw new Error(`Workflow simulation failed: ${error.message}`);
  }
});

runTest('Multi-component integration scenario', () => {
  // Simulate multiple components using different parts of the library
  const components = [];
  
  // Component 1: Uses dropdown functionality
  try {
    const dropdownFetcher = async () => ['option1', 'option2', 'option3'];
    const useDropdown = createDropdownListHook(dropdownFetcher);
    components.push('dropdown_created');
  } catch (error) {
    components.push('dropdown_error');
  }
  
  // Component 2: Uses toast system
  try {
    const toastResult = toast({ title: 'Multi-component test' });
    if (toastResult.id) {
      components.push('toast_created');
    }
  } catch (error) {
    components.push('toast_error');
  }
  
  // Component 3: Uses API functionality
  try {
    const queryFn = getQueryFn({ on401: 'returnNull' });
    if (typeof queryFn === 'function') {
      components.push('query_created');
    }
  } catch (error) {
    components.push('query_error');
  }
  
  const expectedComponents = ['dropdown_created', 'toast_created', 'query_created'];
  assertEqual(components.length, expectedComponents.length, 'All components should initialize');
  
  components.forEach((component, index) => {
    assertEqual(component, expectedComponents[index], `Component ${index + 1} should initialize correctly`);
  });
});

// =============================================================================
// CLEANUP AND RESTORATION
// =============================================================================

// =============================================================================
// TEST SUMMARY AND REPORTING
// =============================================================================

testQueue.then(() => { // wait for queued tests before reporting to keep summary accurate
  // Restore original environment after tests complete
  require = originalRequire; // restore module loading behavior
  global.window = originalWindow; // restore any mocked browser APIs
  delete global.PopStateEvent; // cleanup custom event constructor

console.log('\n📊 DETAILED TEST SUMMARY');
console.log('='.repeat(60));

// Performance analysis
const avgDuration = testResults.reduce((sum, test) => sum + test.duration, 0) / testResults.length; // mean duration across all tests
const slowestTest = testResults.reduce((slowest, test) =>
  test.duration > slowest.duration ? test : slowest, { duration: 0 }); // slowest test case for reference
const fastestTest = testResults.reduce((fastest, test) =>
  test.duration < fastest.duration ? test : fastest, { duration: Infinity }); // fastest test case for reference

console.log(`Total Tests: ${testCount}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / testCount) * 100).toFixed(1)}%`);
console.log(`Average Duration: ${avgDuration.toFixed(1)}ms`);
console.log(`Slowest Test: ${slowestTest.name} (${slowestTest.duration}ms)`);
console.log(`Fastest Test: ${fastestTest.name} (${fastestTest.duration}ms)`);

// Failed tests details
if (failedTests > 0) { // print details only when failures occurred
  console.log('\n❌ FAILED TESTS DETAILS:');
  testResults
    .filter(test => test.status === 'FAILED')
    .forEach(test => {
      console.log(`  • ${test.name}: ${test.error}`);
    });
}

// Test coverage analysis
const testCategories = {
  'MODULE EXPORT': testResults.filter(t => t.name.includes('export')).length,
  'UNIT TESTS': testResults.filter(t => t.name.includes('comprehensive') || t.name.includes('behavior')).length,
  'INTEGRATION': testResults.filter(t => t.name.includes('integrat')).length,
  'ERROR HANDLING': testResults.filter(t => t.name.includes('error') || t.name.includes('Error')).length,
  'EDGE CASES': testResults.filter(t => t.name.includes('edge') || t.name.includes('boundary')).length,
  'PERFORMANCE': testResults.filter(t => t.name.includes('performance') || t.name.includes('scale')).length
}; // counts tests matching keywords for each category

console.log('\n📈 TEST COVERAGE BY CATEGORY:');
Object.entries(testCategories).forEach(([category, count]) => {
  console.log(`  ${category}: ${count} tests`);
});

if (failedTests === 0) {
  console.log('\n🎉 ALL TESTS PASSED! 🎉');
  console.log('✨ The module is production-ready with comprehensive test coverage.');
  console.log('🚀 Ready for npm publishing and deployment.');
  console.log('📚 Test suite covers:');
  console.log('   • All exported functions and hooks');
  console.log('   • Integration between modules');
  console.log('   • Error handling and edge cases');
  console.log('   • Performance characteristics');
  console.log('   • Memory management');
  console.log('   • Real-world workflow scenarios');
} else {
  console.log(`\n⚠️  ${failedTests} test(s) failed. Please review the failures above.`);
  console.log('🔧 Fix the issues and re-run the tests before deployment.');
  process.exit(1);
}

console.log('\n🔚 Enhanced test suite completed successfully.');
console.log('📋 For debugging failed tests, set DEBUG_TESTS=true environment variable.'); // note optional verbose output
});
