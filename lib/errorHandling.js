
/**
 * Error Handling Utilities Module
 * 
 * This module provides standardized error handling patterns used across
 * the application, reducing code duplication and ensuring consistent
 * error processing, logging, and propagation.
 */

/**
 * Execute a function with standardized error handling
 * 
 * This utility wraps function execution with consistent try/catch patterns,
 * logging, and error transformation. Used across multiple modules to
 * reduce error handling boilerplate.
 * 
 * @param {Function} fn - Function to execute
 * @param {string} functionName - Name for logging purposes
 * @param {Function} errorTransform - Optional error transformation function; can return Error or Promise resolving to Error //(note async transforms allowed)
 * @returns {*} Function result or throws transformed error
 */
async function executeWithErrorHandling(fn, functionName, errorTransform) {
  try { // attempt to execute the provided function
    const result = await fn();
    return result;
  } catch (error) { // standard error path
    
    if (errorTransform && typeof errorTransform === 'function') {
      const transformed = errorTransform(error); //(capture potential promise)
      if (transformed && typeof transformed.then === 'function') { //(detect promise to support async)
        throw await transformed; //(await promise and rethrow resolved Error)
      }
      throw transformed; //(rethrow sync transformed Error)
    }
    
    throw error;
  }
}

/**
 * Execute a synchronous function with error handling
 * 
 * Synchronous version of executeWithErrorHandling for non-async operations.
 * 
 * @param {Function} fn - Synchronous function to execute
 * @param {string} functionName - Name for logging purposes
 * @param {Function} errorTransform - Optional error transformation function
 * @returns {*} Function result or throws transformed error
 */
function executeSyncWithErrorHandling(fn, functionName, errorTransform) {
  try { // run the synchronous function
    const result = fn();
    return result;
  } catch (error) { // handle any thrown errors
    
    if (errorTransform && typeof errorTransform === 'function') {
      throw errorTransform(error);
    }
    
    throw error;
  }
}

module.exports = {
  executeWithErrorHandling,     // Async wrapper with standardized logging
  executeSyncWithErrorHandling  // Synchronous counterpart for non-async code
};
