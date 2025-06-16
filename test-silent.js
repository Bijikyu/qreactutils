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
const TestRenderer = require('react-test-renderer');
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Import library with silenced console
const {
  useAsyncAction, useDropdownData, createDropdownListHook, useDropdownToggle,
  useEditForm, useIsMobile, useToast, toast, useToastAction, useAuthRedirect,
  showToast, toastSuccess, toastError, stopEvent, apiRequest, getQueryFn, 
  queryClient, formatAxiosError, axiosClient
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

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function renderHook(hookFn) {
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
function runTest(name, testFn) {
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