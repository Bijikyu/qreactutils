
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
  try { // attempt to execute the provided function
    const result = await fn(); // run provided function
    return result; // bubble result back to caller
  } catch (error) { // catch and process function errors

    if (errorTransform && typeof errorTransform === 'function') { // caller wants custom error
      const transformed = errorTransform(error); // let caller map error to custom type
      if (transformed && typeof transformed.then === 'function') { // promise means async mapping
        throw await transformed; // wait so stack shows transformed cause
      }
      throw transformed; // throw mapped error so calling code handles specific type
    }


    throw error; // rethrow unchanged to keep original stack when no transform

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
  try { // run the synchronous function
    const result = fn(); // run synchronous function
    return result; // return directly
  } catch (error) { // catch sync errors for uniform handling

    if (errorTransform && typeof errorTransform === 'function') { // transformation allows caller context
      throw errorTransform(error); // return caller's transformed error type
    }


    throw error; // rethrow original to preserve stack if no transform

  }
}

module.exports = { // export helpers via CommonJS
  executeWithErrorHandling,     // Async wrapper with standardized logging // public so hooks share consistent error pattern
  executeSyncWithErrorHandling  // Synchronous counterpart for non-async code // exported for utilities outside hooks

}; // end error handling exports

