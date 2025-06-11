
/**
 * Error Handling Utilities Module
 * 
 * This module provides standardized error handling patterns used across
 * the application, reducing code duplication and ensuring consistent
 * error processing, logging, and propagation.
 */
const { debugLog } = require('./utils'); // import logging helper for conditional output

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
  try { // attempt to execute the provided function
    debugLog(`${functionName} executing...`); // dev-time log
    const result = await fn();
    debugLog(`${functionName} completed successfully`); // indicate success in dev
    return result;
  } catch (error) { // standard error path
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
  try { // run the synchronous function
    debugLog(`${functionName} executing...`); // log sync execution start
    const result = fn();
    debugLog(`${functionName} completed successfully`); // log sync completion
    return result;
  } catch (error) { // handle any thrown errors
    console.error(`${functionName} error:`, error);
    
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
