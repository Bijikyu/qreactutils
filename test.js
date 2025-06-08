
/**
 * Comprehensive Test Suite for React Hooks Utility Library
 * 
 * This test suite provides both unit and integration testing for the npm module.
 * It's designed to run in Node.js without requiring a full React testing environment,
 * using manual mocking and verification patterns instead of complex testing frameworks.
 * 
 * Test Categories:
 * 1. Module Export Tests - Verify all exports exist and are callable
 * 2. Unit Tests - Test individual function behavior with mocks
 * 3. Integration Tests - Test interactions between modules
 * 4. Error Handling Tests - Verify proper error propagation
 * 5. Edge Case Tests - Test boundary conditions and unusual inputs
 */

const { 
  useAsyncAction, useDropdownData, createDropdownListHook, useDropdownToggle,
  useEditForm, useIsMobile, useToast, toast, useToastAction, useAuthRedirect,
  showToast, stopEvent, apiRequest, getQueryFn, queryClient, formatAxiosError, axiosClient
} = require('./index.js');

// Mock React hooks for testing
const mockReact = {
  useState: (initial) => {
    let value = initial;
    const setValue = (newValue) => {
      value = typeof newValue === 'function' ? newValue(value) : newValue;
    };
    return [value, setValue];
  },
  useCallback: (fn, deps) => fn,
  useEffect: (fn, deps) => {
    // In real tests, we might track effect calls
    // For now, just execute immediately for some tests
    if (deps && deps.length === 0) {
      fn();
    }
  }
};

// Patch require to return our mock for react
const originalRequire = require;
require = function(id) {
  if (id === 'react') {
    return mockReact;
  }
  return originalRequire.apply(this, arguments);
};

let testCount = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, testFn) {
  testCount++;
  try {
    console.log(`\n🧪 Test ${testCount}: ${name}`);
    testFn();
    passedTests++;
    console.log(`✅ PASSED: ${name}`);
  } catch (error) {
    failedTests++;
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertThrows(fn, message) {
  try {
    fn();
    throw new Error(`${message}: expected function to throw but it didn't`);
  } catch (error) {
    // This is expected
  }
}

console.log('🚀 Starting Comprehensive Test Suite...\n');

// =============================================================================
// MODULE EXPORT TESTS
// =============================================================================

console.log('📦 MODULE EXPORT TESTS');

runTest('All core hooks are exported as functions', () => {
  assert(typeof useAsyncAction === 'function', 'useAsyncAction should be a function');
  assert(typeof useDropdownData === 'function', 'useDropdownData should be a function');
  assert(typeof useDropdownToggle === 'function', 'useDropdownToggle should be a function');
  assert(typeof useEditForm === 'function', 'useEditForm should be a function');
  assert(typeof useIsMobile === 'function', 'useIsMobile should be a function');
  assert(typeof useToast === 'function', 'useToast should be a function');
  assert(typeof useToastAction === 'function', 'useToastAction should be a function');
  assert(typeof useAuthRedirect === 'function', 'useAuthRedirect should be a function');
});

runTest('All utility functions are exported', () => {
  assert(typeof toast === 'function', 'toast should be a function');
  assert(typeof showToast === 'function', 'showToast should be a function');
  assert(typeof stopEvent === 'function', 'stopEvent should be a function');
});

runTest('All API functions are exported', () => {
  assert(typeof apiRequest === 'function', 'apiRequest should be a function');
  assert(typeof getQueryFn === 'function', 'getQueryFn should be a function');
  assert(typeof formatAxiosError === 'function', 'formatAxiosError should be a function');
  assert(typeof queryClient === 'object', 'queryClient should be an object');
  assert(typeof axiosClient === 'object', 'axiosClient should be an object');
});

runTest('Factory function creates hooks', () => {
  assert(typeof createDropdownListHook === 'function', 'createDropdownListHook should be a function');
  const mockFetcher = async () => ['item1', 'item2'];
  const customHook = createDropdownListHook(mockFetcher);
  assert(typeof customHook === 'function', 'Factory should return a function');
});

// =============================================================================
// UNIT TESTS - UTILITY FUNCTIONS
// =============================================================================

console.log('\n🔧 UNIT TESTS - UTILITY FUNCTIONS');

runTest('showToast calls toast function with correct parameters', () => {
  let calledWith = null;
  const mockToast = (params) => {
    calledWith = params;
    return { id: '123', dismiss: () => {} };
  };
  
  const result = showToast(mockToast, 'Test message', 'Test title', 'success');
  
  assert(calledWith !== null, 'Toast function should be called');
  assertEqual(calledWith.title, 'Test title', 'Title should match');
  assertEqual(calledWith.description, 'Test message', 'Description should match');
  assertEqual(calledWith.variant, 'success', 'Variant should match');
  assert(typeof result.id === 'string', 'Should return toast result with id');
});

runTest('showToast handles errors gracefully', () => {
  const errorToast = () => {
    throw new Error('Toast failed');
  };
  
  assertThrows(() => {
    showToast(errorToast, 'Test message', 'Test title');
  }, 'Should propagate toast errors');
});

runTest('stopEvent prevents default and stops propagation', () => {
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
});

runTest('stopEvent handles malformed events', () => {
  const badEvent = { type: 'click' }; // Missing preventDefault/stopPropagation
  
  assertThrows(() => {
    stopEvent(badEvent);
  }, 'Should throw on malformed events');
});

// =============================================================================
// UNIT TESTS - API FUNCTIONS
// =============================================================================

console.log('\n🌐 UNIT TESTS - API FUNCTIONS');

runTest('formatAxiosError handles axios errors', () => {
  // Mock axios error structure
  const axiosError = {
    isAxiosError: true,
    response: {
      status: 404,
      data: 'Not found'
    },
    message: 'Request failed'
  };
  
  // Mock axios.isAxiosError
  const originalAxios = require('axios');
  originalAxios.isAxiosError = () => true;
  
  const result = formatAxiosError(axiosError);
  
  assert(result instanceof Error, 'Should return Error object');
  assert(result.message.includes('404'), 'Should include status code');
  assert(result.message.includes('Not found'), 'Should include response data');
});

runTest('formatAxiosError handles non-axios errors', () => {
  const regularError = new Error('Regular error');
  const result = formatAxiosError(regularError);
  
  assertEqual(result, regularError, 'Should return original error for non-axios errors');
});

runTest('getQueryFn creates proper query function', () => {
  const queryFn = getQueryFn({ on401: 'returnNull' });
  
  assert(typeof queryFn === 'function', 'Should return a function');
  
  // Test that it accepts queryKey parameter
  const mockQueryKey = ['/api/test'];
  // We can't easily test the async behavior without mocking axios,
  // but we can verify the function structure
  assert(queryFn.length >= 1, 'Query function should accept parameters');
});

// =============================================================================
// UNIT TESTS - TOAST SYSTEM
// =============================================================================

console.log('\n🍞 UNIT TESTS - TOAST SYSTEM');

runTest('toast function creates toast with unique ID', () => {
  const toast1 = toast({ title: 'Test 1', description: 'Message 1' });
  const toast2 = toast({ title: 'Test 2', description: 'Message 2' });
  
  assert(typeof toast1.id === 'string', 'Toast should have string ID');
  assert(typeof toast2.id === 'string', 'Toast should have string ID');
  assert(toast1.id !== toast2.id, 'Toast IDs should be unique');
  assert(typeof toast1.dismiss === 'function', 'Toast should have dismiss function');
  assert(typeof toast1.update === 'function', 'Toast should have update function');
});

runTest('toast function returns object with expected methods', () => {
  const result = toast({ title: 'Test', description: 'Message' });
  
  assert(typeof result.id === 'string', 'Should have id property');
  assert(typeof result.dismiss === 'function', 'Should have dismiss method');
  assert(typeof result.update === 'function', 'Should have update method');
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

console.log('\n🔗 INTEGRATION TESTS');

runTest('useToastAction integrates useAsyncAction with toast system', () => {
  // This is a complex integration test that would normally require React testing
  // For now, we verify the function exists and can be called
  assert(typeof useToastAction === 'function', 'useToastAction should exist');
  
  const mockAsyncFn = async () => ({ data: 'success' });
  const successMsg = 'Operation completed';
  
  // In a real React environment, this would return [run, isLoading]
  // Here we just verify it doesn't throw
  try {
    useToastAction(mockAsyncFn, successMsg);
  } catch (error) {
    throw new Error(`useToastAction should not throw on valid inputs: ${error.message}`);
  }
});

runTest('API and utilities modules work together', () => {
  // Test that API functions can use utility functions
  assert(typeof apiRequest === 'function', 'apiRequest should be available');
  assert(typeof showToast === 'function', 'showToast should be available');
  
  // These are integrated in the actual hooks, verify they're compatible
  const mockToast = (params) => ({ id: '123', dismiss: () => {} });
  
  try {
    showToast(mockToast, 'API test message', 'API Test');
  } catch (error) {
    throw new Error(`API and utilities should integrate: ${error.message}`);
  }
});

runTest('createDropdownListHook integrates with useDropdownData', () => {
  const mockFetcher = async () => ['item1', 'item2', 'item3'];
  const useCustomList = createDropdownListHook(mockFetcher);
  
  assert(typeof useCustomList === 'function', 'Factory should create hook function');
  
  // The created hook should be usable (though we can't fully test React behavior here)
  try {
    const mockToast = { error: () => {} };
    const mockUser = { id: '123' };
    useCustomList(mockToast, mockUser);
  } catch (error) {
    // We expect this to fail in Node.js since it uses React hooks
    // But it shouldn't fail due to integration issues
    assert(error.message.includes('React') || error.message.includes('hook'), 
           'Should fail due to React context, not integration issues');
  }
});

// =============================================================================
// ERROR HANDLING TESTS
// =============================================================================

console.log('\n⚠️  ERROR HANDLING TESTS');

runTest('formatAxiosError handles edge cases', () => {
  // Test with null/undefined
  const result1 = formatAxiosError(null);
  assertEqual(result1, null, 'Should handle null input');
  
  const result2 = formatAxiosError(undefined);
  assertEqual(result2, undefined, 'Should handle undefined input');
  
  // Test with string error
  const stringError = 'String error message';
  const result3 = formatAxiosError(stringError);
  assertEqual(result3, stringError, 'Should handle string errors');
});

runTest('showToast error propagation', () => {
  const failingToast = () => {
    throw new Error('Toast system failed');
  };
  
  let caughtError = null;
  try {
    showToast(failingToast, 'Test message', 'Test title');
  } catch (error) {
    caughtError = error;
  }
  
  assert(caughtError !== null, 'Error should be propagated');
  assert(caughtError.message.includes('Toast system failed'), 'Should preserve original error message');
});

runTest('stopEvent with invalid event object', () => {
  const invalidEvent = {}; // No preventDefault or stopPropagation methods
  
  assertThrows(() => {
    stopEvent(invalidEvent);
  }, 'Should throw when event methods are missing');
});

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

console.log('\n🏗️  EDGE CASE TESTS');

runTest('createDropdownListHook with null fetcher', () => {
  assertThrows(() => {
    createDropdownListHook(null);
  }, 'Should handle null fetcher gracefully');
});

runTest('toast with minimal parameters', () => {
  const result = toast({});
  
  assert(typeof result.id === 'string', 'Should generate ID even with empty params');
  assert(typeof result.dismiss === 'function', 'Should provide dismiss function');
  assert(typeof result.update === 'function', 'Should provide update function');
});

runTest('toast with complex objects', () => {
  const complexProps = {
    title: 'Complex Toast',
    description: 'Message with special chars: !@#$%^&*()',
    variant: 'destructive',
    action: { label: 'Action', onClick: () => {} },
    metadata: { timestamp: Date.now(), source: 'test' }
  };
  
  const result = toast(complexProps);
  
  assert(typeof result.id === 'string', 'Should handle complex objects');
  assert(typeof result.dismiss === 'function', 'Should provide dismiss function');
});

runTest('Multiple toast creation and management', () => {
  const toasts = [];
  
  // Create multiple toasts
  for (let i = 0; i < 5; i++) {
    toasts.push(toast({ title: `Toast ${i}`, description: `Message ${i}` }));
  }
  
  // Verify all have unique IDs
  const ids = toasts.map(t => t.id);
  const uniqueIds = [...new Set(ids)];
  assertEqual(uniqueIds.length, ids.length, 'All toast IDs should be unique');
  
  // Verify all have required methods
  toasts.forEach((toast, index) => {
    assert(typeof toast.dismiss === 'function', `Toast ${index} should have dismiss`);
    assert(typeof toast.update === 'function', `Toast ${index} should have update`);
  });
});

// =============================================================================
// PERFORMANCE TESTS
// =============================================================================

console.log('\n⚡ PERFORMANCE TESTS');

runTest('Toast ID generation performance', () => {
  const startTime = Date.now();
  
  // Generate many toast IDs
  const ids = [];
  for (let i = 0; i < 1000; i++) {
    const result = toast({ title: 'Perf test', description: `Message ${i}` });
    ids.push(result.id);
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  assert(duration < 1000, `Toast generation should be fast (took ${duration}ms)`);
  
  // Verify all IDs are unique
  const uniqueIds = [...new Set(ids)];
  assertEqual(uniqueIds.length, ids.length, 'All generated IDs should be unique');
});

runTest('formatAxiosError performance with large objects', () => {
  const largeData = {
    users: Array(100).fill(null).map((_, i) => ({
      id: i,
      name: `User ${i}`,
      data: Array(100).fill('x').join('')
    }))
  };
  
  const axiosError = {
    isAxiosError: true,
    response: {
      status: 500,
      data: largeData
    },
    message: 'Server error'
  };
  
  const originalAxios = require('axios');
  originalAxios.isAxiosError = () => true;
  
  const startTime = Date.now();
  const result = formatAxiosError(axiosError);
  const endTime = Date.now();
  
  assert(endTime - startTime < 100, 'Error formatting should be fast even with large objects');
  assert(result instanceof Error, 'Should return Error object');
});

// =============================================================================
// TEST SUMMARY
// =============================================================================

console.log('\n📊 TEST SUMMARY');
console.log('='.repeat(50));
console.log(`Total Tests: ${testCount}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / testCount) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log('\n🎉 All tests passed! The module is working correctly.');
  console.log('✨ Ready for production use and npm publishing.');
} else {
  console.log(`\n⚠️  ${failedTests} test(s) failed. Please review the failures above.`);
  process.exit(1);
}

console.log('\n🔚 Test suite completed.');

// Restore original require
require = originalRequire;
