/**
 * Focused Test Runner - Clean output, real failures only
 */

const React = require('react');
const TestRenderer = require('react-test-renderer'); // allows hooks to run without a browser

// Completely silence all output during test execution
// Tests call silenceConsole() before each run and restoreConsole() afterwards so logs don't pollute results
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

function silenceConsole() {
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
  console.info = () => {};
}

function restoreConsole() {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
}

// Import library with console silenced
silenceConsole();
const {
  useAsyncAction, useEditForm, useIsMobile, toast, 
  stopEvent, formatAxiosError, createDropdownListHook,
  showToast, toastSuccess, toastError, useToast
} = require('./index.js');
restoreConsole();

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

let tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) { // sequential runner keeps single-threaded order instead of using Jest
  // logs are silenced during execution and restored after to keep output readable
  try {
    silenceConsole();
    fn();
    restoreConsole();
    tests.push({ name, status: 'PASS' });
    passed++;
  } catch (error) {
    restoreConsole();
    tests.push({ name, status: 'FAIL', error: error.message });
    failed++;
  }
}

function assert(condition, message) { // simple assertion helper to keep environment minimal
  if (!condition) throw new Error(message || 'Assertion failed');
}

function renderHook(hookFn) { // run hook via TestRenderer so updates flush immediately without DOM
  let value;
  function TestComponent() {
    value = hookFn();
    return null;
  }
  TestRenderer.act(() => {
    TestRenderer.create(React.createElement(TestComponent));
  });
  return { result: { current: value } };
}

console.log('React Hooks Library Test Results');
console.log('================================\n');

// Core functionality tests
test('useAsyncAction hook structure', () => {
  const { result } = renderHook(() => useAsyncAction(async () => 'test'));
  assert(Array.isArray(result.current), 'Should return array');
  assert(result.current.length === 2, 'Should have [run, loading]');
  assert(typeof result.current[0] === 'function', 'First element should be function');
  assert(typeof result.current[1] === 'boolean', 'Second element should be boolean');
});

test('useEditForm state management', () => {
  const { result } = renderHook(() => useEditForm({ name: 'test', count: 5 }));
  assert(typeof result.current === 'object', 'Should return object');
  assert(typeof result.current.fields === 'object', 'Should have fields');
  assert(result.current.fields.name === 'test', 'Should preserve initial values');
  assert(typeof result.current.setField === 'function', 'Should have setField');
});

test('useIsMobile responsive detection', () => {
  const { result } = renderHook(() => useIsMobile());
  assert(typeof result.current === 'boolean', 'Should return boolean');
});

test('toast notification creation', () => {
  const result = toast({ title: 'Test', description: 'Message' });
  assert(typeof result === 'object', 'Should return object');
  assert(typeof result.id === 'string', 'Should have id');
  assert(result.id.length > 0, 'ID should not be empty');
  assert(typeof result.dismiss === 'function', 'Should have dismiss');
});

test('useToast hook returns state object', () => {
  const { result } = renderHook(() => useToast());
  assert(typeof result.current === 'object', 'Should return object');
  assert(typeof result.current.toast === 'function', 'Should have toast function');
  assert(Array.isArray(result.current.toasts), 'Should have toasts array');
});

test('stopEvent prevents event propagation', () => {
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

test('formatAxiosError transforms errors', () => {
  const axiosError = {
    isAxiosError: true,
    response: { status: 404, data: { message: 'Not found' } }
  };
  const result = formatAxiosError(axiosError);
  assert(result instanceof Error, 'Should return Error');
  assert(result.message.includes('404'), 'Should include status');
});

test('createDropdownListHook factory function', () => {
  const fetcher = async () => ['item1', 'item2'];
  const hook = createDropdownListHook(fetcher);
  assert(typeof hook === 'function', 'Should return function');
});

test('showToast with toast function', () => {
  const mockToast = (params) => ({ id: 'test-id', dismiss: () => {} });
  const result = showToast(mockToast, 'Test message', 'Test Title');
  assert(result.id === 'test-id', 'Should use provided toast function');
});

test('toast utility functions', () => {
  const mockToast = (params) => ({ id: 'mock', dismiss: () => {} });
  
  const success = toastSuccess(mockToast, 'Success message');
  assert(success.id === 'mock', 'toastSuccess should work');
  
  const error = toastError(mockToast, 'Error message');
  assert(error.id === 'mock', 'toastError should work');
});

// Output results
console.log('Individual Test Results:');
console.log('-----------------------');
tests.forEach((test, index) => {
  const num = (index + 1).toString().padStart(2, ' ');
  if (test.status === 'PASS') {
    console.log(`${num}. ✓ ${test.name}`);
  } else {
    console.log(`${num}. ✗ ${test.name}`);
    console.log(`    Error: ${test.error}`);
  }
});

console.log('\nSummary:');
console.log('--------');
console.log(`Total: ${tests.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n✅ All tests passed - Library is functioning correctly');
} else {
  console.log(`\n❌ ${failed} test(s) failed - Issues need resolution`);
  process.exit(1);
}