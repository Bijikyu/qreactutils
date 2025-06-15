
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
 * Use this helper when the provided function performs asynchronous work and
 * returns a Promise. Wrapping the call keeps each module's code short while
 * ensuring every async path logs and rethrows errors the same way.
 * Error transforms allow callers to wrap or augment errors before they
 * propagate. This async wrapper exists alongside the synchronous version so
 * modules can keep their functions simple without always converting to async.
 * Typical usage: wrap API calls or database writes so unexpected errors surface consistently.
 *
 * @param {Function} fn - Function to execute
 * @param {string} functionName - Name for logging purposes
 * @param {Function} errorTransform - Optional error transformation function; can return Error or Promise resolving to Error //(note async transforms allowed)
 * @returns {*} Function result or throws transformed error
 */
async function executeWithErrorHandling(fn, functionName, errorTransform) {
  console.log(`executeWithErrorHandling is running with ${functionName}`); // log entry context for debugging
  try { // run the provided async function and capture its result
    const result = await fn(); // execute caller function
    console.log(`executeWithErrorHandling is returning ${result}`); // show resolved output for tracing
    return result; // bubble result back to caller unchanged
  } catch (error) { // handle errors thrown by the caller function

    if (errorTransform && typeof errorTransform === 'function') { // optional mapping lets caller customize error types
      const transformed = errorTransform(error); // allow caller to wrap or augment the error
      if (transformed && typeof transformed.then === 'function') { // async mapping preserves stack chain
        throw await transformed; // rethrow transformed async error so upstream logic sees final message
      }
      throw transformed; // rethrow transformed sync error for caller awareness
    }


    throw error; // rethrow original error to preserve stack when no transform supplied

  }
}

/**
 * Execute a synchronous function with error handling
 *
 * Use this when the task is strictly synchronous and no Promise is involved.
 * It mirrors `executeWithErrorHandling` so callers can follow the same pattern
 * regardless of async needs. Keeping a dedicated sync wrapper avoids forcing
 * unnecessary async/await overhead in simple utility code.
 * Typical usage: wrap simple data transformations that could throw synchronously.
 *
 * @param {Function} fn - Synchronous function to execute
 * @param {string} functionName - Name for logging purposes
 * @param {Function} errorTransform - Optional error transformation function
 * @returns {*} Function result or throws transformed error
 */
function executeSyncWithErrorHandling(fn, functionName, errorTransform) {
  console.log(`executeSyncWithErrorHandling is running with ${functionName}`); // log entry details for sync path
  try { // run the synchronous function and capture result
    const result = fn(); // execute the caller-provided function
    console.log(`executeSyncWithErrorHandling is returning ${result}`); // expose returned value for tracing
    return result; // return value directly as no async flow required
  } catch (error) { // handle any synchronous error thrown by the function

    if (errorTransform && typeof errorTransform === 'function') { // allow calling code to reshape error before propagation
      throw errorTransform(error); // rethrow transformed error so upstream logic knows specific issue
    }


    throw error; // rethrow original error when no transform is provided

  }
}

module.exports = { // export helpers via CommonJS
  executeWithErrorHandling,     // Async wrapper with standardized logging // public so hooks share consistent error pattern
  executeSyncWithErrorHandling  // Synchronous counterpart for non-async code // exported for utilities outside hooks

}; // end error handling exports

