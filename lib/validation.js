
/**
 * Data Validation Utilities Module
 * 
 * This module provides common validation patterns used across multiple
 * files, reducing code duplication for type checking, null checking,
 * and data structure validation. Each helper targets recurring mistakes
 * seen while developing hooks: calling non-functions, reading properties
 * off null, and logging circular structures. Centralizing these small
 * guards keeps individual hooks readable and ensures consistent behavior.
 */

/**
 * Check if a value is a valid function
 *

 * Centralizing this guard lets hooks confirm callbacks are callable before
 * invocation, preventing runtime type errors and keeping logic consistent
 * across the codebase.
 * Typical usage: verifying callback parameters passed into custom hooks.
 * This simple typeof check avoids pulling in extra libraries for a one-line validation.

 * Attempting to invoke something that isn't callable throws
 * `TypeError: value is not a function`. This guard provides a
 * simple boolean test so hooks can fail fast with descriptive errors
 * rather than crashing at call time.

 *
 * @param {*} value - Value to check
 * @returns {boolean} True if value is a function
 */
function isFunction(value) { // confirm parameter is callable to avoid runtime errors in hooks
  // typeof is preferred over instanceof because it works across execution realms
  // and doesn't require exposing the global Function constructor.
  return typeof value === 'function'; // prevents calling non-functions which would throw
}

/**
 * Check if a value is a non-null object
 *
 * This guard helps hooks safely access object properties without additional
 * null checks. Keeping it here ensures all modules share the same validation
 * logic, reducing scattered type checking code.
 * Typical usage: validating API responses before accessing nested fields.
 * Keeping the logic simple here avoids dependencies like lodash for an object check.
 *
 * @param {*} value - Value to check
 * @returns {boolean} True if value is a non-null object
 */
function isObject(value) { // confirm parameter is a plain object so hooks don't read props on null
  // typeof null === 'object' so we explicitly check for null. Array.isArray is
  // used to exclude arrays which are technically objects but rarely what we
  // want when validating plain data structures.
  return typeof value === 'object' && value !== null && !Array.isArray(value); // avoid null/array which would cause property access errors
}

/**
 * Safely convert a value to JSON string with circular reference handling
 * 
 * This utility handles the common pattern of JSON.stringify with error handling
 * for circular references, used across multiple modules.
 * 
 * @param {*} value - Value to stringify
 * @returns {string} JSON string with [Circular] markers
 */

const safeStringify = require('safe-json-stringify'); // third-party serializer avoids circular JSON errors so logging complex objects never throws
// We export the module directly rather than wrapping it so consumers can use the
// exact implementation across the codebase without surprises. This keeps log
// output consistent between the library and applications using it.
// Direct export ensures bug fixes in the dependency benefit all modules automatically.


/**
 * Check if an error is an axios error with a specific status
 *
 * Hooks often need to branch on HTTP status codes when dealing with API
 * failures. Centralizing this logic avoids repeating axios-specific checks and
 * keeps the guards close to other validation utilities.
 * Typical usage: determining if a fetch should redirect to login after a 401.
 * Using axios.isAxiosError avoids brittle instanceof checks that fail across axios versions.
 * Lazy require keeps the module safe for test mocks and avoids circular imports.
 *
 * @param {*} error - Error to check
 * @param {number} status - Expected status code
 * @returns {boolean} True if error is axios error with specified status
 */
function isAxiosErrorWithStatus(error, status) { // confirm axios error has matching status so hooks can react correctly
  // require here so libraries using axios mocks in tests can intercept without caching
  const axios = require('axios'); // import lazily to avoid circular deps
  return axios.isAxiosError(error) && error.response?.status === status; // prevents misidentifying generic errors as HTTP errors // optional chaining handles missing response gracefully
}

module.exports = { // validation helpers packaged together
  // Single export object keeps require path short for consumers
  isFunction,            // type guard for functions // exported to validate callbacks in consumer code
  isObject,              // type guard for plain objects // public so apps can reuse simple object check
  safeStringify,         // wrapped safe-json-stringify for circular refs // exported for safe logging outside library
  isAxiosErrorWithStatus // axios error checker // public helper for HTTP error handling
}; // end validation exports
