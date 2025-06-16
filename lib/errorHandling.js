
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
  console.log(`executeWithErrorHandling is running with ${functionName}`); // trace start of wrapped call
  try { // execute provided async function
    const result = await fn(); // run operation and await its promise
    console.log(`executeWithErrorHandling is returning ${result}`); // expose successful result
    return result; // return value back to caller
  } catch (error) { // handle any thrown error
    if (errorTransform && typeof errorTransform === 'function') { // caller supplied mapper
      const transformed = errorTransform(error); // map original error to new one
      // errorTransform may yield a Promise so async logging or reporting can run before rethrowing
      if (transformed && typeof transformed.then === 'function') { // mapper returned promise
        throw await transformed; // await promise to keep stack then rethrow
      }
      throw transformed; // rethrow mapped error immediately
    }
    throw error; // no mapper -> rethrow original error
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
  console.log(`executeSyncWithErrorHandling is running with ${functionName}`); // trace synchronous wrapper start
  try { // immediately run provided function
    const result = fn(); // execute operation
    console.log(`executeSyncWithErrorHandling is returning ${result}`); // log success value
    return result; // deliver result to caller
  } catch (error) { // catch thrown error
    if (errorTransform && typeof errorTransform === 'function') { // custom mapper exists
      throw errorTransform(error); // apply mapper then rethrow
    }
    throw error; // otherwise rethrow original
  }
}

module.exports = { // export helpers via CommonJS
  executeWithErrorHandling,     // Async wrapper with standardized logging // public so hooks share consistent error pattern
  executeSyncWithErrorHandling  // Synchronous counterpart for non-async code // exported for utilities outside hooks

}; // end error handling exports

