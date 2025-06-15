
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
async function executeWithErrorToast(operation, toast, errorTitle = 'Error') { // display error toast on failure
  try {
    return await operation(); // run the operation and forward result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Operation failed';
    if (toast && typeof toast === 'function') {
      showToast(toast, message, errorTitle, 'destructive'); // surface failure to user
    }
    throw error; // rethrow so caller can handle
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
    const result = await operation(); // perform the requested action
    if (toast && typeof toast === 'function') {
      showToast(toast, successMessage, 'Success'); // acknowledge operation success
    }
    return result; // propagate result after success
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Operation failed';
    if (toast && typeof toast === 'function') {
      showToast(toast, message, errorTitle, 'destructive');
    }
    throw error; // bubble failure back to caller
  }
}

module.exports = { // expose toast helpers for reuse
  executeWithErrorToast,   // utility for operations that may fail
  executeWithToastFeedback // success/error toast helper
}; // end module exports
