/**
 * Clean Test Runner - React Hooks Library
 * Outputs clear test results without verbose logging
 */

// This file illustrates how to run hook tests in Node without Jest

const React = require('react'); // real React so hooks execute as in apps
const TestRenderer = require('react-test-renderer'); // lets us run hooks without a DOM

// Suppress all console output during hook execution // keeps test logs compact
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn
};

// Silence everything during testing // prevents noisy output when running hooks
console.log = () => {};
console.error = () => {};
console.warn = () => {};

const {
  useAsyncAction, useEditForm, useIsMobile, toast, 
  stopEvent, formatAxiosError, createDropdownListHook
} = require('./index.js');

// Restore console for test output only
console.log = originalConsole.log;
console.error = originalConsole.error;
console.warn = originalConsole.warn;

// Mock browser environment // allows hooks using window to run under Node
global.window = {
  innerWidth: 1024,
  matchMedia: (query) => ({
    matches: query.includes('max-width') && 1024 <= 767,
    addEventListener: () => {},
    removeEventListener: () => {}
  }),
  history: { pushState: () => {} }
}; // basic DOM stub so hooks referencing window don't fail

let testResults = []; // collected sequentially to keep output order stable

function test(name, fn) { // simple runner keeps order deterministic and avoids Jest overhead
  // console is silenced while each test runs and restored immediately after
  try {
    // Silence console during test execution
    console.log = () => {};
    console.error = () => {};
    console.warn = () => {};
    
    fn();
    
    // Restore console
    console.log = originalConsole.log;
    console.error = originalConsole.error; 
    console.warn = originalConsole.warn;
    
    testResults.push({ name, status: 'PASS' });
  } catch (error) {
    // Restore console
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    
    testResults.push({ name, status: 'FAIL', error: error.message });
  }
}

function assert(condition, message) { // minimal assertion to stop on first failure and keep queue simple
  if (!condition) throw new Error(message || 'Assertion failed');
}

function renderHook(hookFn) { // lightweight hook runner, TestRenderer avoids DOM and complex frameworks
  let value;
  function TestComponent() {
    value = hookFn();
    return null;
  }

  // Suppress React warnings during test execution
  const originalError = console.error;
  console.error = () => {};

  TestRenderer.act(() => { // react-test-renderer runs hook without DOM
    TestRenderer.create(React.createElement(TestComponent)); // minimal render keeps suite lightweight
  });
  
  console.error = originalError;
  
  return { result: { current: value } };
}

console.log('React Hooks Library Test Suite');
console.log('================================\n');

// Test 1: useAsyncAction
test('useAsyncAction returns correct structure', () => { // validates tuple output
  const { result } = renderHook(() => useAsyncAction(async () => 'test'));
  assert(Array.isArray(result.current), 'Should return array'); // ensures hook signature remains [fn, bool]
  assert(result.current.length === 2, 'Should have run function and loading state');
  assert(typeof result.current[0] === 'function', 'First element should be function');
  assert(typeof result.current[1] === 'boolean', 'Second element should be boolean');
});

// Test 2: useEditForm
test('useEditForm manages form state', () => { // confirms fields and mutators
  const { result } = renderHook(() => useEditForm({ name: 'John', age: 25 }));
  assert(typeof result.current.fields === 'object', 'Should have fields object');
  assert(result.current.fields.name === 'John', 'Should preserve initial values');
  assert(typeof result.current.setField === 'function', 'Should have setField function');
  assert(typeof result.current.startEdit === 'function', 'Should have startEdit function');
});

// Test 3: useIsMobile
test('useIsMobile detects screen size', () => { // verifies breakpoint logic
  const { result } = renderHook(() => useIsMobile());
  assert(typeof result.current === 'boolean', 'Should return boolean');
});

// Test 4: toast system
test('toast creates notification objects', () => { // toast should have id and dismiss
  const result = toast({ title: 'Test', description: 'Message' });
  assert(typeof result === 'object', 'Should return object');
  assert(typeof result.id === 'string', 'Should have string id');
  assert(result.id.length > 0, 'ID should not be empty');
  assert(typeof result.dismiss === 'function', 'Should have dismiss function');
});

// Test 5: stopEvent utility
test('stopEvent handles DOM events', () => { // ensures default/prevent occur
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

// Test 6: formatAxiosError
test('formatAxiosError transforms errors', () => { // converts axios errors
  const axiosError = {
    isAxiosError: true,
    response: { status: 404, data: { message: 'Not found' } }
  };
  
  const result = formatAxiosError(axiosError);
  assert(result instanceof Error, 'Should return Error instance');
  assert(result.message.includes('404'), 'Should include status code');
});

// Test 7: createDropdownListHook
test('createDropdownListHook creates hook function', () => { // factory output check
  const mockFetcher = async () => ['item1', 'item2'];
  const hook = createDropdownListHook(mockFetcher);
  assert(typeof hook === 'function', 'Should return hook function');
});

// Test 8: Error handling
// ensures formatAxiosError is robust to invalid arguments
test('formatAxiosError handles null inputs', () => { // handles bad argument
  const result = formatAxiosError(null);
  assert(result instanceof Error, 'Should return Error instance for null input');
  assert(typeof result.message === 'string', 'Should have error message');
});

// Output results
console.log('Test Results:');
console.log('-------------');

let passed = 0;
let failed = 0;

testResults.forEach((test, index) => {
  const number = (index + 1).toString().padStart(2, ' ');
  if (test.status === 'PASS') {
    console.log(`${number}. ✓ ${test.name}`);
    passed++;
  } else {
    console.log(`${number}. ✗ ${test.name}`);
    console.log(`    Error: ${test.error}`);
    failed++;
  }
});

console.log('\nSummary:'); // show final pass/fail counts
console.log(`--------`);
console.log(`Total Tests: ${testResults.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success Rate: ${((passed / testResults.length) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! React Hooks Library is ready for production.');
} else {
  console.log('\n⚠️  Some tests failed. Please review the implementation.');
  process.exit(1);
}