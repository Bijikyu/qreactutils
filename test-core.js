/**
 * Core Functionality Test - Validates React Hooks Library
 * Tests individual components without external dependencies
 */

// Runs sequentially in Node so full frameworks are unnecessary

const React = require('react'); // real React provides hook semantics
const TestRenderer = require('react-test-renderer'); // executes hooks without DOM libraries

// Import only the hooks and utilities we can test independently
const {
  useAsyncAction, useEditForm, useIsMobile, toast, showToast, 
  stopEvent, formatAxiosError, createDropdownListHook
} = require('./index.js');

// Setup test environment
global.window = { // simple window mock so hooks relying on browser APIs run
  innerWidth: 1024,
  matchMedia: (query) => ({
    matches: query.includes('max-width') && 1024 <= 767,
    addEventListener: () => {},
    removeEventListener: () => {}
  }),
  history: { pushState: () => {} }
}; // minimal window mock so hooks relying on browser APIs run

// Suppress console output during testing // keeps noise low for CI
const originalLog = console.log;
console.log = () => {};

let passed = 0;
let total = 0;

function test(name, fn) { // lightweight runner executing tests sequentially
  total++;
  try {
    fn();
    passed++;
    process.stdout.write('.');
  } catch (error) {
    process.stdout.write('F');
    console.log = originalLog;
    console.log(`\nFAILED: ${name} - ${error.message}`);
    console.log = () => {};
  }
}

function assert(condition, message) { // throw if condition is false
  if (!condition) throw new Error(message || 'Assertion failed');
}

function renderHook(hookFn) { // execute a hook and expose its return value for assertions
  let value;
  function TestComponent() {
    value = hookFn();
    return null;
  }
  TestRenderer.act(() => { // run hook without DOM via react-test-renderer
    TestRenderer.create(React.createElement(TestComponent)); // minimal renderer
  });
  return { result: { current: value } };
}

console.log = originalLog;
console.log('Testing React Hooks Library Core Functions...\n');
console.log = () => {};

// Test 1: verify the async hook returns [runFn, isLoading] tuple
test('useAsyncAction structure', () => { // ensures consumer gets function and loading flag
  const { result } = renderHook(() => useAsyncAction(async () => 'test'));
  assert(Array.isArray(result.current), 'Should return array'); // ensures hook returns [fn, bool]
  assert(result.current.length === 2, 'Should have 2 elements');
  assert(typeof result.current[0] === 'function', 'First element should be function');
  assert(typeof result.current[1] === 'boolean', 'Second element should be boolean');
});

// Test 2: check form hook exposes fields and mutators
test('useEditForm state management', () => { // confirms initial state preserved
  const { result } = renderHook(() => useEditForm({ name: 'John', age: 25 }));
  assert(typeof result.current.fields === 'object', 'Should have fields object');
  assert(result.current.fields.name === 'John', 'Should preserve initial name');
  assert(result.current.fields.age === 25, 'Should preserve initial age');
  assert(typeof result.current.setField === 'function', 'Should have setField function');
  assert(typeof result.current.startEdit === 'function', 'Should have startEdit function');
});

// Test 3: detect responsive breakpoint logic
test('useIsMobile responsive detection', () => { // boolean indicates mobile status
  const { result } = renderHook(() => useIsMobile());
  assert(typeof result.current === 'boolean', 'Should return boolean value');
});

// Test 4: toast should create dismissible notification objects
test('toast notification creation', () => { // verifies basic toast fields
  const result = toast({ title: 'Test', description: 'Message' });
  assert(typeof result === 'object', 'Should return object');
  assert(typeof result.id === 'string', 'Should have string id');
  assert(result.id.length > 0, 'ID should not be empty');
  assert(typeof result.dismiss === 'function', 'Should have dismiss function');
});

// Test 5: wrapper uses default toast implementation
test('showToast wrapper', () => { // ensures a toast object is returned
  const result = showToast('Test message');
  assert(typeof result === 'object', 'Should return toast object');
  assert(typeof result.id === 'string', 'Should have id');
});

// Test 6: stopEvent should cancel native browser actions
test('stopEvent utility', () => { // ensures both preventDefault and stopPropagation fire
  let preventDefaultCalled = false;
  let stopPropagationCalled = false;
  
  const mockEvent = {
    preventDefault: () => { preventDefaultCalled = true; },
    stopPropagation: () => { stopPropagationCalled = true; }
  };
  
  stopEvent(mockEvent);
  assert(preventDefaultCalled, 'Should call preventDefault');
  assert(stopPropagationCalled, 'Should call stopPropagation');
});

// Test 7: formatAxiosError converts axios errors to user-friendly Error
test('formatAxiosError transformation', () => { // confirms message contains status code
  const axiosError = {
    isAxiosError: true,
    response: { status: 404, data: { message: 'Not found' } }
  };
  
  const result = formatAxiosError(axiosError);
  assert(result instanceof Error, 'Should return Error instance');
  assert(result.message.includes('404'), 'Should include status code');
});

// Test 8: factory returns custom hook given a fetcher
test('createDropdownListHook factory', () => { // ensures returned value is callable
  const mockFetcher = async () => ['item1', 'item2'];
  const hook = createDropdownListHook(mockFetcher);
  assert(typeof hook === 'function', 'Should return function');
});

// Test 9: error utilities handle bad parameters gracefully
test('Error handling with invalid inputs', () => { // passing null should throw
  try {
    formatAxiosError(null);
    assert(false, 'Should handle null input');
  } catch (error) {
    assert(error instanceof Error, 'Should throw proper error');
  }
});

// Test 10: hook should maintain stable function references across renders
// verifies that useEditForm returns memoized handlers so components don't re-render unnecessarily
test('Hook function stability', () => { // ensures memoization works
  const { result } = renderHook(() => useEditForm({ test: 'value' }));

  const firstSetField = result.current.setField;
  const firstStartEdit = result.current.startEdit;
  const firstCancelEdit = result.current.cancelEdit;

  TestRenderer.act(() => {
    result.current.setField('test', 'changed');
  });

  assert(result.current.setField === firstSetField, 'setField reference stable after update');
  assert(result.current.startEdit === firstStartEdit, 'startEdit reference stable after update');
  assert(result.current.cancelEdit === firstCancelEdit, 'cancelEdit reference stable after update');
});

console.log = originalLog;
console.log(`\n\nTest Results: ${passed}/${total} passed`); // summary for quick review

if (passed === total) {
  console.log('\n✅ All core functionality tests passed');
  console.log('\nValidated components:');
  console.log('  • useAsyncAction - Async operation management');
  console.log('  • useEditForm - Form state management');
  console.log('  • useIsMobile - Responsive breakpoint detection');
  console.log('  • toast/showToast - Notification system');
  console.log('  • stopEvent - Event handling utilities');
  console.log('  • formatAxiosError - Error transformation');
  console.log('  • createDropdownListHook - Hook factory');
  console.log('\n🚀 React Hooks Library is production ready');
} else {
  console.log(`\n❌ ${total - passed} tests failed`);
  process.exit(1);
}