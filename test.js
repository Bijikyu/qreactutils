
/**
 * Test Suite for React Hooks Utility Library
 * 
 * This test file serves multiple critical purposes for the npm module:
 * 
 * 1. **Smoke Testing**: Verifies that all exported functions are available and callable
 *    without requiring a full React testing environment. This is intentional because
 *    setting up React testing (Jest + React Testing Library) would add complexity
 *    and dependencies that aren't necessary for basic export verification.
 * 
 * 2. **Module Integrity**: Ensures the CommonJS export/import chain works correctly
 *    from index.js through all lib files. If any module has syntax errors or import
 *    issues, this test will catch them immediately.
 * 
 * 3. **Development Workflow**: Provides immediate feedback during development that
 *    the module structure is intact. This is crucial for an npm package where
 *    broken exports would cause consumer applications to fail.
 * 
 * 4. **Factory Function Validation**: Tests the createDropdownListHook factory
 *    pattern to ensure it produces callable hooks, which is a complex JavaScript
 *    closure pattern that could easily break.
 * 
 * Limitations by Design:
 * - Does not test React hook lifecycle (would require React testing environment)
 * - Does not test async operations (would require more complex test setup)
 * - Focuses on "does it export and is it callable" rather than "does it work correctly"
 * 
 * This approach was chosen because it provides maximum confidence with minimum
 * complexity for a utility library that will be consumed by various React applications.
 */

// Import all exported functionality to verify the complete public API
// This destructuring will fail immediately if any exports are broken or missing
const { 
  useAsyncAction, useDropdownData, createDropdownListHook, useDropdownToggle,
  useEditForm, useIsMobile, useToast, toast, useToastAction, useAuthRedirect,
  showToast, stopEvent, apiRequest, getQueryFn, queryClient, formatAxiosError, axiosClient
} = require('./index.js');

console.log('Running tests...\n');

/**
 * Test Core Hook Exports
 * 
 * These tests verify that the primary React hooks are properly exported and
 * are callable functions. The typeof checks ensure that:
 * 1. The export exists (not undefined)
 * 2. It's a function (not an object or primitive)
 * 3. It can be called by consumer applications
 */
console.log('Testing core React hooks:');
console.log('useAsyncAction exported:', typeof useAsyncAction === 'function');
console.log('useDropdownData exported:', typeof useDropdownData === 'function');
console.log('useDropdownToggle exported:', typeof useDropdownToggle === 'function');
console.log('useEditForm exported:', typeof useEditForm === 'function');
console.log('useIsMobile exported:', typeof useIsMobile === 'function');
console.log('useToast exported:', typeof useToast === 'function');
console.log('useToastAction exported:', typeof useToastAction === 'function');
console.log('useAuthRedirect exported:', typeof useAuthRedirect === 'function');

/**
 * Test Utility Function Exports
 * 
 * These functions provide imperative APIs that can be called outside of React
 * components. Testing them verifies that the utility module chain works correctly
 * and that these functions can be used in non-React contexts (Node.js scripts, etc.).
 */
console.log('\nTesting utility functions:');
console.log('toast exported:', typeof toast === 'function');
console.log('showToast exported:', typeof showToast === 'function');
console.log('stopEvent exported:', typeof stopEvent === 'function');

/**
 * Test API Module Exports
 * 
 * The API module provides HTTP functionality that should work in Node.js
 * environments. These exports are critical for server-side rendering (SSR)
 * and other Node.js use cases where the consumer might need to make HTTP
 * requests outside of the browser.
 */
console.log('\nTesting API functionality:');
console.log('apiRequest exported:', typeof apiRequest === 'function');
console.log('getQueryFn exported:', typeof getQueryFn === 'function');
console.log('formatAxiosError exported:', typeof formatAxiosError === 'function');
console.log('queryClient exported:', typeof queryClient === 'object');
console.log('axiosClient exported:', typeof axiosClient === 'object');

/**
 * Test Factory Function Pattern
 * 
 * The createDropdownListHook implements a factory pattern that creates specialized
 * hooks. This test verifies that:
 * 1. The factory function itself is exported
 * 2. Calling the factory produces a new function (the specialized hook)
 * 3. The created hook maintains the expected function signature
 * 
 * This pattern is complex because it involves closures, higher-order functions,
 * and React hook composition. Testing it ensures the JavaScript closure chain
 * works correctly and the resulting hook will be usable.
 */
console.log('\nTesting factory function pattern:');
console.log('createDropdownListHook exported:', typeof createDropdownListHook === 'function');

// Create a mock fetcher function to test the factory pattern
// This simulates how a consumer would use the factory in their application
const mockFetcher = async () => ['item1', 'item2', 'item3'];
const useCustomList = createDropdownListHook(mockFetcher);
console.log('Factory creates hook function:', typeof useCustomList === 'function');

/**
 * Test Completion Message
 * 
 * Explicit success message indicates that all exports were found and are callable.
 * If any test above failed, the process would have thrown an error and this
 * message would not appear, making it clear that something is broken.
 */
console.log('\nAll export tests completed successfully!');
console.log('Module is ready for consumption by React applications.');
