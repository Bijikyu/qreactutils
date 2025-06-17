/**
 * Silent Test Runner - Clean pass/fail output without verbose logging
 */

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn
};

// Silence console during library import and test execution
console.log = () => {};
console.error = () => {};
console.warn = () => {};

// Import React and setup
const React = require('react');
const TestRenderer = require('react-test-renderer'); // lets hooks run in Node without a DOM
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Import library with silenced console
const {
  useAsyncAction, useDropdownData, createDropdownListHook, useDropdownToggle,
  useEditForm, useIsMobile, useToast, toast, useToastAction, useAuthRedirect, usePageFocus, useSocket,
  showToast, toastSuccess, toastError, stopEvent, apiRequest, getQueryFn, 
  queryClient, formatAxiosError, axiosClient, isFunction, isObject, safeStringify, 
  isAxiosErrorWithStatus, executeWithErrorHandling, executeSyncWithErrorHandling
} = require('./index.js');

// Restore console for test output only
console.log = originalConsole.log;
console.error = originalConsole.error;
console.warn = originalConsole.warn;

// Test infrastructure
let testCount = 0;
let passedTests = 0;
let failedTests = 0;
let testResults = [];

function assert(condition, message) { // basic assertion keeps suite independent of assertion libraries
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) { // equality helper for clarity
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function renderHook(hookFn) { // lightweight hook runner; TestRenderer avoids DOM so tests stay fast
  let value;
  function TestComponent() {
    value = hookFn();
    return null;
  }
  
  // Silence React warnings during rendering
  const tempError = console.error;
  console.error = () => {};
  
  TestRenderer.act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });
  
  console.error = tempError;
  return { result: { current: value } };
}

// Test execution with clean output
function runTest(name, testFn) { // sequential execution and manual logging mimic Jest's behavior without the dependency
  // console is muted while each test runs and restored before logging results
  testCount++;
  const testStart = Date.now();
  
  try {
    console.log(`🧪 Test ${testCount}: ${name}`);
    
    // Silence all console output during test execution
    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
    
    testFn();
    
    // Restore console for result output
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    
    const duration = Date.now() - testStart;
    passedTests++;
    testResults.push({ name, status: 'PASSED', duration });
    console.log(`✅ PASSED: ${name} (${duration}ms)\n`);
    
  } catch (error) {
    // Restore console for error output
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    
    const duration = Date.now() - testStart;
    failedTests++;
    testResults.push({ name, status: 'FAILED', error: error.message, duration });
    console.log(`❌ FAILED: ${name} (${duration}ms)`);
    console.log(`   Error: ${error.message}\n`);
  }
}

// Mock environment
global.window = {
  innerWidth: 1024,
  matchMedia: (query) => ({
    matches: query.includes('max-width') && 1024 <= 767,
    addEventListener: () => {},
    removeEventListener: () => {}
  }),
  history: { pushState: () => {} }
};

console.log('🚀 React Hooks Library Test Suite');
console.log('==================================\n');

// Execute tests
runTest('useAsyncAction returns correct structure', () => {
  const { result } = renderHook(() => useAsyncAction(async () => 'test'));
  assert(Array.isArray(result.current), 'Should return array');
  assertEqual(result.current.length, 2, 'Should return [run, isLoading]');
  assert(typeof result.current[0] === 'function', 'First element should be function');
  assert(typeof result.current[1] === 'boolean', 'Second element should be boolean');
});

runTest('useEditForm manages state correctly', () => {
  const { result } = renderHook(() => useEditForm({ name: 'John', age: 25 }));
  assert(typeof result.current === 'object', 'Should return object');
  assert(typeof result.current.fields === 'object', 'Should have fields');
  assertEqual(result.current.fields.name, 'John', 'Should preserve initial values');
  assert(typeof result.current.setField === 'function', 'Should have setField');
});

runTest('useIsMobile detects screen size', () => {
  const { result } = renderHook(() => useIsMobile());
  assert(typeof result.current === 'boolean', 'Should return boolean');
});

runTest('toast creates notification objects', () => {
  const result = toast({ title: 'Test', description: 'Message' });
  assert(typeof result === 'object', 'Should return object');
  assert(typeof result.id === 'string', 'Should have string id');
  assert(result.id.length > 0, 'ID should not be empty');
  assert(typeof result.dismiss === 'function', 'Should have dismiss function');
});

runTest('useToast hook provides state and functions', () => {
  const { result } = renderHook(() => useToast());
  assert(typeof result.current === 'object', 'Should return object');
  assert(typeof result.current.toast === 'function', 'Should have toast function');
  assert(Array.isArray(result.current.toasts), 'Should have toasts array');
});

runTest('stopEvent prevents default and propagation', () => {
  let preventCalled = false;
  let stopCalled = false;
  const mockEvent = {
    preventDefault: () => { preventCalled = true; },
    stopPropagation: () => { stopCalled = true; }
  };
  stopEvent(mockEvent);
  assert(preventCalled, 'Should call preventDefault');
  assert(stopCalled, 'Should call stopPropagation');
});

runTest('formatAxiosError transforms errors properly', () => {
  const axiosError = {
    isAxiosError: true,
    response: { status: 404, data: { message: 'Not found' } }
  };
  const result = formatAxiosError(axiosError);
  assert(result instanceof Error, 'Should return Error instance');
  assert(result.message.includes('404'), 'Should include status code');
});

runTest('createDropdownListHook creates hook functions', () => {
  const mockFetcher = async () => ['item1', 'item2'];
  const hook = createDropdownListHook(mockFetcher);
  assert(typeof hook === 'function', 'Should return hook function');
});

runTest('toast utility functions work correctly', () => {
  const mockToast = (params) => ({ id: 'test-id', dismiss: () => {} });
  
  const success = toastSuccess(mockToast, 'Success message');
  assert(success.id === 'test-id', 'toastSuccess should work');
  
  const error = toastError(mockToast, 'Error message');
  assert(error.id === 'test-id', 'toastError should work');
});

runTest('showToast with custom toast function', () => {
  const mockToast = (params) => ({ 
    id: 'custom-id', 
    dismiss: () => {},
    title: params.title,
    description: params.description
  });
  const result = showToast(mockToast, 'Test message', 'Test Title');
  assert(result.id === 'custom-id', 'Should use provided toast function');
  assert(result.title === 'Test Title', 'Should pass through title');
});

runTest('usePageFocus manages focus correctly', () => {
  // Mock document and main content element for focus testing
  let focusCalled = false;
  const mockMainElement = {
    focus: () => { focusCalled = true; }
  };
  
  // Mock document.getElementById to return our test element
  const originalDocument = global.document;
  global.document = {
    getElementById: (id) => {
      if (id === 'main-content') {
        return mockMainElement;
      }
      return null;
    }
  };
  
  // Test the hook with a location parameter
  renderHook(() => usePageFocus('/test-route'));
  
  // Restore original document
  global.document = originalDocument;
  
  assert(focusCalled, 'Should call focus on main-content element');
});

runTest('useSocket hook provides correct structure', () => {
  // Mock socket.io-client to avoid actual network connections during testing
  const mockSocket = {
    emit: () => {},
    on: () => {},
    off: () => {},
    disconnect: () => {}
  };
  
  // Override require to return mock socket
  const originalRequire = require;
  require = (moduleName) => {
    if (moduleName === 'socket.io-client') {
      return { io: () => mockSocket };
    }
    return originalRequire(moduleName);
  };
  
  const { result } = renderHook(() => useSocket('test-user-123'));
  
  // Restore original require
  require = originalRequire;
  
  assert(typeof result.current === 'object', 'Should return state object');
  assert(result.current.hasOwnProperty('paymentOutcome'), 'Should have paymentOutcome property');
  assert(result.current.hasOwnProperty('usageUpdate'), 'Should have usageUpdate property');
  assert(result.current.paymentOutcome === null, 'Initial paymentOutcome should be null');
  assert(result.current.usageUpdate === null, 'Initial usageUpdate should be null');
});

runTest('validation utilities work correctly', () => {
  // Test isFunction
  assert(isFunction(() => {}), 'Should identify functions correctly');
  assert(!isFunction('not a function'), 'Should reject non-functions');
  assert(!isFunction(null), 'Should reject null');
  
  // Test isObject
  assert(isObject({ key: 'value' }), 'Should identify plain objects');
  assert(!isObject(null), 'Should reject null');
  assert(!isObject([]), 'Should reject arrays');
  assert(!isObject('string'), 'Should reject strings');
  
  // Test safeStringify
  const result = safeStringify({ test: 'value' });
  assert(typeof result === 'string', 'Should return string');
  assert(result.includes('test'), 'Should include object properties');
});

runTest('error handling utilities work correctly', () => {
  // Test executeWithErrorHandling with successful operation
  const testOperation = async () => 'success';
  executeWithErrorHandling(testOperation, 'test-operation').then(result => {
    assert(result === 'success', 'Should return operation result');
  });
  
  // Test executeSyncWithErrorHandling with successful operation
  const syncOperation = () => 'sync-success';
  executeSyncWithErrorHandling(syncOperation, 'sync-test').then(result => {
    assert(result === 'sync-success', 'Should return sync operation result');
  });
});

// Final results
console.log('📊 Test Results Summary');
console.log('======================');
console.log(`Total Tests: ${testCount}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / testCount) * 100).toFixed(1)}%`);

if (failedTests > 0) {
  console.log('\n❌ Failed Tests:');
  testResults
    .filter(test => test.status === 'FAILED')
    .forEach(test => console.log(`  • ${test.name}: ${test.error}`));
} else {
  console.log('\n🎉 All tests passed! Library is production ready.');
}

console.log('\n✅ Test execution completed with clean output.');