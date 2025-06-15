
/**
 * Data Validation Utilities Module
 * 
 * This module provides common validation patterns used across multiple
 * files, reducing code duplication for type checking, null checking,
 * and data structure validation.
 */

/**
 * Check if a value is a valid function
 *
 * Centralizing this guard lets hooks confirm callbacks are callable before
 * invocation, preventing runtime type errors and keeping logic consistent
 * across the codebase.
 *
 * @param {*} value - Value to check
 * @returns {boolean} True if value is a function
 */
function isFunction(value) { // confirm parameter is callable to avoid runtime errors in hooks

  return typeof value === 'function'; // boolean result indicates callable

}

/**
 * Check if a value is a non-null object
 *
 * This guard helps hooks safely access object properties without additional
 * null checks. Keeping it here ensures all modules share the same validation
 * logic, reducing scattered type checking code.
 *
 * @param {*} value - Value to check
 * @returns {boolean} True if value is a non-null object
 */
function isObject(value) { // confirm parameter is a plain object so hooks don't read props on null

  return typeof value === 'object' && value !== null && !Array.isArray(value); // ensure object without arrays

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
const safeStringify = require('safe-json-stringify'); // third-party serializer avoids circular JSON errors

/**
 * Check if an error is an axios error with a specific status
 *
 * Hooks often need to branch on HTTP status codes when dealing with API
 * failures. Centralizing this logic avoids repeating axios-specific checks and
 * keeps the guards close to other validation utilities.
 *
 * @param {*} error - Error to check
 * @param {number} status - Expected status code
 * @returns {boolean} True if error is axios error with specified status
 */
function isAxiosErrorWithStatus(error, status) { // confirm axios error has matching status so hooks can react correctly
  const axios = require('axios'); // import lazily to avoid circular deps
  return axios.isAxiosError(error) && error.response?.status === status; // return true only for desired status
}

module.exports = { // validation helpers packaged together
  isFunction,            // type guard for functions // exported to validate callbacks in consumer code
  isObject,              // type guard for plain objects // public so apps can reuse simple object check
  safeStringify,         // wrapped safe-json-stringify for circular refs // exported for safe logging outside library
  isAxiosErrorWithStatus // axios error checker // public helper for HTTP error handling
}; // end validation exports
