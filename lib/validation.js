
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
 * This utility standardizes function validation used across multiple modules.
 * 
 * @param {*} value - Value to check
 * @returns {boolean} True if value is a function
 */
function isFunction(value) {
  return typeof value === 'function';
}

/**
 * Check if a value is a non-null object
 * 
 * This utility standardizes object validation, excluding null and arrays.
 * 
 * @param {*} value - Value to check
 * @returns {boolean} True if value is a non-null object
 */
function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Safely convert a value to JSON string with circular reference handling
 * 
 * This utility handles the common pattern of JSON.stringify with error handling
 * for circular references, used across multiple modules.
 * 
 * @param {*} value - Value to stringify
 * @param {string} fallback - Fallback string if JSON.stringify fails
 * @returns {string} JSON string or fallback
 */
function safeStringify(value, fallback = '[Circular Reference]') {
  try {
    const str = JSON.stringify(value); // convert value to string; may return undefined for unsupported types
    return str === undefined ? fallback : str; // use fallback when JSON.stringify yields undefined
  } catch (error) {
    return fallback; // return fallback when JSON.stringify throws
  }
}

/**
 * Check if an error is an axios error with a specific status
 * 
 * This utility standardizes axios error checking patterns used across API functions.
 * 
 * @param {*} error - Error to check
 * @param {number} status - Expected status code
 * @returns {boolean} True if error is axios error with specified status
 */
function isAxiosErrorWithStatus(error, status) {
  const axios = require('axios');
  return axios.isAxiosError(error) && error.response?.status === status;
}

module.exports = {
  isFunction,            // type guard for functions
  isObject,              // type guard for plain objects
  safeStringify,         // JSON stringify with fallback
  isAxiosErrorWithStatus // axios error checker
};
