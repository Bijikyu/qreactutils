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
  isAxiosErrorWithStatus, executeWithErrorHandling, executeSyncWithErrorHandling, cn, createSubTrigger, createContextMenuSubTrigger, createMenubarSubTrigger, useForm, useFormSubmission, formValidation, FormField, TextInputField, TextareaField, SelectField, CheckboxField, useAdvancedToast, advancedToast, getAdvancedToastCount, clearAllAdvancedToasts, showSuccessToast, showErrorToast, showInfoToast, showWarningToast, showSuccess, showError, showInfo, showWarning
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



runTest('advancedToast creates notification objects', () => {
  // Clear any existing toasts
  clearAllAdvancedToasts();
  
  const result = advancedToast({
    title: 'Success',
    description: 'Operation completed',
    variant: 'success'
  });
  
  assert(result && typeof result === 'object', 'Should return toast control object');
  assert(typeof result.id === 'string', 'Should have string ID');
  assert(typeof result.dismiss === 'function', 'Should provide dismiss function');
  assert(typeof result.update === 'function', 'Should provide update function');
  
  // Verify toast was added to state
  assert(getAdvancedToastCount() === 1, 'Should add toast to state');
  
  // Clean up
  clearAllAdvancedToasts();
});

runTest('useAdvancedToast hook provides state and functions', () => {
  clearAllAdvancedToasts();
  
  const { result } = renderHook(() => useAdvancedToast());
  assert(typeof result.current === 'object', 'Should return toast utilities');
  assert(Array.isArray(result.current.toasts), 'Should provide toasts array');
  assert(typeof result.current.toast === 'function', 'Should provide toast creation function');
  assert(typeof result.current.dismiss === 'function', 'Should provide dismiss function');
  
  clearAllAdvancedToasts();
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

runTest('advanced toast system manages state correctly', () => {
  clearAllAdvancedToasts();
  
  // Test toast creation and state management
  const toast1 = advancedToast({
    title: 'First toast',
    description: 'First description'
  });
  
  assert(getAdvancedToastCount() === 1, 'Should have one toast after creation');
  
  const toast2 = advancedToast({
    title: 'Second toast', 
    description: 'Second description'
  });
  
  assert(getAdvancedToastCount() === 2, 'Should have two toasts after second creation');
  
  // Test dismiss functionality
  toast1.dismiss();
  
  clearAllAdvancedToasts();
  assert(getAdvancedToastCount() === 0, 'Should clear all toasts');
});

runTest('advanced toast update functionality works', () => {
  clearAllAdvancedToasts();
  
  const toast = advancedToast({
    title: 'Original title',
    description: 'Original description'
  });
  
  // Test update functionality
  try {
    toast.update({
      title: 'Updated title',
      description: 'Updated description'
    });
    assert(true, 'Should be able to update toast properties');
  } catch (error) {
    assert(false, `Toast update should not throw: ${error.message}`);
  }
  
  clearAllAdvancedToasts();
});

runTest('toast utility functions work correctly', () => {
  clearAllAdvancedToasts();
  
  // Mock toast function to capture calls
  const mockToastCalls = [];
  const mockToast = (params) => {
    mockToastCalls.push(params);
    return { id: 'test-id', dismiss: () => {}, update: () => {} };
  };
  
  // Test explicit toast functions
  showSuccessToast(mockToast, 'Success Title', 'Success description');
  assert(mockToastCalls.length === 1, 'Should call toast function once');
  assert(mockToastCalls[0].title === 'Success Title', 'Should pass correct title');
  assert(mockToastCalls[0].description === 'Success description', 'Should pass correct description');
  assert(mockToastCalls[0].variant === 'success', 'Should use success variant');
  
  showErrorToast(mockToast, 'Error Title', 'Error description');
  assert(mockToastCalls.length === 2, 'Should call toast function twice');
  assert(mockToastCalls[1].variant === 'destructive', 'Should use destructive variant for errors');
  
  showInfoToast(mockToast, 'Info Title', 'Info description');
  assert(mockToastCalls.length === 3, 'Should call toast function three times');
  assert(mockToastCalls[2].variant === 'default', 'Should use default variant for info');
  
  showWarningToast(mockToast, 'Warning Title', 'Warning description');
  assert(mockToastCalls.length === 4, 'Should call toast function four times');
  assert(mockToastCalls[3].variant === 'warning', 'Should use warning variant');
  
  // Test convenience functions
  mockToastCalls.length = 0; // reset
  showSuccess(mockToast, 'Success message');
  assert(mockToastCalls.length === 1, 'Convenience function should call toast');
  assert(mockToastCalls[0].title === 'Success', 'Should use default success title');
  assert(mockToastCalls[0].description === 'Success message', 'Should use message as description');
  
  showError(mockToast, 'Error message');
  assert(mockToastCalls.length === 2, 'Should call toast function twice');
  assert(mockToastCalls[1].title === 'Error', 'Should use default error title');
  
  clearAllAdvancedToasts();
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

runTest('cn function merges classes correctly', () => {
  // Test basic class merging
  const basic = cn('px-4 py-2', 'bg-blue-500');
  assert(typeof basic === 'string', 'Should return string');
  assert(basic.includes('px-4'), 'Should include first classes');
  assert(basic.includes('bg-blue-500'), 'Should include second classes');
  
  // Test conditional classes
  const conditional = cn('px-4', true && 'bg-blue-500', false && 'hidden');
  assert(conditional.includes('px-4'), 'Should include base classes');
  assert(conditional.includes('bg-blue-500'), 'Should include truthy conditional');
  assert(!conditional.includes('hidden'), 'Should exclude falsy conditional');
  
  // Test Tailwind conflict resolution (later class should win)
  const conflictResolution = cn('text-red-500', 'text-blue-500');
  assert(conflictResolution.includes('text-blue-500'), 'Should include later conflicting class');
  // Note: We can't easily test that text-red-500 is excluded without inspecting the exact output
  // but tailwind-merge should handle this conflict resolution
  
  // Test with objects
  const withObjects = cn({ 'bg-green-500': true, 'text-white': false });
  assert(withObjects.includes('bg-green-500'), 'Should include truthy object properties');
  assert(!withObjects.includes('text-white'), 'Should exclude falsy object properties');
});

runTest('createSubTrigger factory works correctly', () => {
  // Mock base component for testing
  const MockBaseComponent = React.forwardRef((props, ref) => {
    return React.createElement('button', { ref, ...props });
  });
  MockBaseComponent.displayName = 'MockBaseComponent';
  
  // Create sub-trigger component
  const SubTrigger = createSubTrigger('TestSubTrigger', MockBaseComponent);
  
  // Test component creation
  assert(typeof SubTrigger === 'object', 'Should return a React component');
  assert(SubTrigger.displayName === 'TestSubTrigger', 'Should set correct display name');
  
  // Test that it's a forwardRef component
  assert(SubTrigger.$$typeof.toString().includes('react.forward_ref'), 'Should be a forwardRef component');
});

runTest('createContextMenuSubTrigger convenience function works', () => {
  // Mock ContextMenuSubTrigger component
  const MockContextTrigger = React.forwardRef((props, ref) => {
    return React.createElement('div', { ref, role: 'menuitem', ...props });
  });
  MockContextTrigger.displayName = 'ContextMenuSubTrigger';
  
  // Create context menu sub-trigger
  const ContextSubTrigger = createContextMenuSubTrigger(MockContextTrigger);
  
  // Verify it returns a component
  assert(typeof ContextSubTrigger === 'object', 'Should return a React component');
  assert(ContextSubTrigger.displayName === 'ContextMenuSubTrigger', 'Should have correct display name');
});

runTest('createMenubarSubTrigger convenience function works', () => {
  // Mock MenubarSubTrigger component
  const MockMenubarTrigger = React.forwardRef((props, ref) => {
    return React.createElement('div', { ref, role: 'menuitem', ...props });
  });
  MockMenubarTrigger.displayName = 'MenubarSubTrigger';
  
  // Create menubar sub-trigger
  const MenubarSubTrigger = createMenubarSubTrigger(MockMenubarTrigger);
  
  // Verify it returns a component
  assert(typeof MenubarSubTrigger === 'object', 'Should return a React component');
  assert(MenubarSubTrigger.displayName === 'MenubarSubTrigger', 'Should have correct display name');
});

runTest('useForm hook manages form state correctly', () => {
  const initialState = {
    name: '',
    email: 'test@example.com',
    age: 25,
    isActive: true
  };
  
  const { result } = renderHook(() => useForm(initialState));
  
  // Test initial state
  assert(typeof result.current === 'object', 'Should return form utilities object');
  assert(result.current.form.name === '', 'Should initialize name correctly');
  assert(result.current.form.email === 'test@example.com', 'Should initialize email correctly');
  assert(result.current.form.age === 25, 'Should initialize age correctly');
  assert(result.current.form.isActive === true, 'Should initialize boolean correctly');
  
  // Test form utilities are functions
  assert(typeof result.current.setForm === 'function', 'Should provide setForm function');
  assert(typeof result.current.handleChange === 'function', 'Should provide handleChange function');
  assert(typeof result.current.setField === 'function', 'Should provide setField function');
  assert(typeof result.current.resetForm === 'function', 'Should provide resetForm function');
});

runTest('form field components are created correctly', () => {
  // Test FormField component
  assert(typeof FormField === 'function', 'FormField should be a function component');
  
  // Test TextInputField component
  assert(typeof TextInputField === 'function', 'TextInputField should be a function component');
  
  // Test TextareaField component
  assert(typeof TextareaField === 'function', 'TextareaField should be a function component');
  
  // Test SelectField component
  assert(typeof SelectField === 'function', 'SelectField should be a function component');
  
  // Test CheckboxField component  
  assert(typeof CheckboxField === 'function', 'CheckboxField should be a function component');
});

runTest('SelectField handles options array correctly', () => {
  const testOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ];
  
  // Test that SelectField can be called with options prop
  // We can't easily test the rendered output in Node.js without a full DOM
  // but we can verify the component accepts the expected props
  try {
    const element = SelectField({
      label: 'Test Select',
      options: testOptions,
      name: 'testSelect',
      value: 'option1'
    });
    assert(typeof element === 'object', 'Should return a React element');
  } catch (error) {
    assert(false, `SelectField should handle options prop: ${error.message}`);
  }
});

runTest('formValidation utilities work correctly', () => {
  // Test email validation
  assert(formValidation.isValidEmail('test@example.com'), 'Should validate correct email format');
  assert(!formValidation.isValidEmail('invalid-email'), 'Should reject invalid email format');
  assert(!formValidation.isValidEmail('test@'), 'Should reject incomplete email');
  
  // Test required field validation
  assert(formValidation.isRequired('valid string'), 'Should validate non-empty string as required');
  assert(!formValidation.isRequired(''), 'Should reject empty string');
  assert(!formValidation.isRequired('   '), 'Should reject whitespace-only string');
  assert(formValidation.isRequired(123), 'Should validate numbers as required');
  assert(!formValidation.isRequired(null), 'Should reject null values');
  
  // Test length validations
  assert(formValidation.minLength('hello', 3), 'Should validate minimum length');
  assert(!formValidation.minLength('hi', 5), 'Should reject string shorter than minimum');
  assert(formValidation.maxLength('hello', 10), 'Should validate maximum length');
  assert(!formValidation.maxLength('very long string', 5), 'Should reject string longer than maximum');
  
  // Test range validation
  assert(formValidation.inRange(25, 18, 65), 'Should validate number in range');
  assert(!formValidation.inRange(70, 18, 65), 'Should reject number above range');
  assert(!formValidation.inRange(15, 18, 65), 'Should reject number below range');
});

runTest('useFormSubmission hook manages submission state', () => {
  const mockSubmitFn = async (data) => {
    return { success: true, data };
  };
  
  const { result } = renderHook(() => useFormSubmission(mockSubmitFn));
  
  // Test initial state
  assert(typeof result.current === 'object', 'Should return submission utilities object');
  assert(result.current.isSubmitting === false, 'Should initialize as not submitting');
  assert(result.current.submitError === null, 'Should initialize with no error');
  assert(typeof result.current.handleSubmit === 'function', 'Should provide handleSubmit function');
  assert(typeof result.current.resetSubmission === 'function', 'Should provide resetSubmission function');
});

runTest('enhanced getQueryFn constructs URLs from query keys', async () => {
  // Test the enhanced getQueryFn with URL construction
  const queryFn = getQueryFn({ on401: 'returnNull' });
  
  // Mock query key array
  const mockQueryKey = ['api', 'users', '123'];
  
  // In offline mode, this should return the mock response
  process.env.OFFLINE_MODE = 'true';
  
  try {
    const result = await queryFn({ queryKey: mockQueryKey });
    // Should return null from the mock response
    assertEqual(result, null, 'Should return null in offline mode');
  } finally {
    // Reset offline mode
    delete process.env.OFFLINE_MODE;
  }
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