
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
 * @param {Function} errorTransform - Optional error transformation function
 * @returns {*} Function result or throws transformed error
 */
async function executeWithErrorHandling(fn, functionName, errorTransform) {
  try {
    console.log(`${functionName} executing...`);
    const result = await fn();
    console.log(`${functionName} completed successfully`);
    return result;
  } catch (error) {
    console.error(`${functionName} error:`, error);
    
    if (errorTransform && typeof errorTransform === 'function') {
      throw errorTransform(error);
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
  try {
    console.log(`${functionName} executing...`);
    const result = fn();
    console.log(`${functionName} completed successfully`);
    return result;
  } catch (error) {
    console.error(`${functionName} error:`, error);
    
    if (errorTransform && typeof errorTransform === 'function') {
      throw errorTransform(error);
    }
    
    throw error;
  }
}

module.exports = {
  executeWithErrorHandling,
  executeSyncWithErrorHandling
};
