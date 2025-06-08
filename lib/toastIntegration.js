
/**
 * Toast Integration Utilities Module
 * 
 * This module provides common patterns for integrating toast notifications
 * with various operations, reducing duplication across hooks and utility functions.
 */

const { showToast } = require('./utils'); // core toast utilities

/**
 * Execute an async operation with automatic error toast display
 * 
 * This utility combines async operation execution with automatic error
 * toast display, used across multiple hooks and functions.
 * 
 * @param {Function} operation - Async operation to execute
 * @param {Object} toast - Toast instance
 * @param {string} errorTitle - Title for error toast
 * @returns {*} Operation result or throws error
 */
async function executeWithErrorToast(operation, toast, errorTitle = 'Error') { // wrap op with error toast
  try {
    return await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Operation failed';
    if (toast && typeof toast === 'function') {
      showToast(toast, message, errorTitle, 'destructive');
    }
    throw error;
  }
}

/**
 * Execute an async operation with both success and error toast display
 * 
 * This utility provides complete toast integration for operations that
 * need both success and error feedback.
 * 
 * @param {Function} operation - Async operation to execute
 * @param {Object} toast - Toast instance
 * @param {string} successMessage - Success message
 * @param {string} errorTitle - Title for error toast
 * @returns {*} Operation result or throws error
 */
async function executeWithToastFeedback(operation, toast, successMessage, errorTitle = 'Error') { // show success or error toast
  try {
    const result = await operation();
    if (toast && typeof toast === 'function') {
      showToast(toast, successMessage, 'Success');
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Operation failed';
    if (toast && typeof toast === 'function') {
      showToast(toast, message, errorTitle, 'destructive');
    }
    throw error;
  }
}

module.exports = {
  executeWithErrorToast,   // utility for operations that may fail
  executeWithToastFeedback // success/error toast helper
};
