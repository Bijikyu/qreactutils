
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
 * propagate. When a transform returns a Promise we await it so callers can
 * perform async side effects like reporting or localization before the error
 * continues. This async wrapper exists alongside the synchronous version so
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
      let transformed = errorTransform(error); // map original error to new one
      if (transformed && typeof transformed.then === 'function') { // mapper returned promise
        transformed = await transformed; // wait so async logging or decoration completes before rethrow
      }
      if (!transformed || !(transformed instanceof Error)) { // wrap non Error values
        transformed = new Error(String(transformed)); // ensure consistent Error type
      }
      throw transformed; // rethrow mapped error so caller still handles failure
    }
    throw error; // no mapper -> preserve original error for upstream handling
  }
}

/**
 * Execute a synchronous function with error handling
 *
 * This wrapper previously avoided async/await but now supports async transforms
 * while still executing the provided function synchronously. The wrapper remains
 * useful for simple utilities yet can await an async error transform when
 * provided, allowing tasks like logging to complete before the error is sent
 * upward. Typical usage: wrap simple data transformations that could throw
 * synchronously but require standardized error mapping.
 *
 * @param {Function} fn - Synchronous function to execute
 * @param {string} functionName - Name for logging purposes
 * @param {Function} errorTransform - Optional error transformation function
 * @returns {*} Function result or throws transformed error
 */
async function executeSyncWithErrorHandling(fn, functionName, errorTransform) {
  console.log(`executeSyncWithErrorHandling is running with ${functionName}`); // trace synchronous wrapper start
  try { // immediately run provided function
    const result = fn(); // execute operation
    console.log(`executeSyncWithErrorHandling is returning ${result}`); // log success value
    return result; // deliver result to caller
  } catch (error) { // catch thrown error
    if (errorTransform && typeof errorTransform === 'function') { // custom mapper exists
      let transformed = errorTransform(error); // run mapper on error
      if (transformed && typeof transformed.then === 'function') { // guard for promises
        transformed = await transformed; // wait so async side effects finish before proceeding
      }
      if (!transformed || !(transformed instanceof Error)) { // ensure Error instance
        transformed = new Error(String(transformed)); // normalize falsy or non Error values
      }
      throw transformed; // propagate transformed error so outer layers can react
    }
    throw error; // otherwise rethrow original to maintain stack trace
  }
}

module.exports = { // export helpers via CommonJS
  executeWithErrorHandling,     // Async wrapper with standardized logging // public so hooks share consistent error pattern
  executeSyncWithErrorHandling  // Synchronous counterpart for non-async code // exported for utilities outside hooks

}; // end error handling exports

