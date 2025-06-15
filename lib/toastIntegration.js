
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

    return await operation(); // run user operation and pass back result

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Operation failed'; // prefer message from Error object for clarity
    if (toast && typeof toast === 'function') { // confirm toast is callable to avoid breaking callers
      showToast(toast, message, errorTitle, 'destructive'); // destructive variant ensures consistent error styling
    }

    throw error; // propagate error so higher-level handlers can react

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

    const result = await operation(); // run user async and store result for returning
    if (toast && typeof toast === 'function') { // only attempt to toast when valid function is injected
      showToast(toast, successMessage, 'Success'); // success variant informs user of completion
    }
    return result; // expose result so calling code gets operation output

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Operation failed'; // derive message string from error object or fallback
    if (toast && typeof toast === 'function') { // guard to ensure optional toast won't break process
      showToast(toast, message, errorTitle, 'destructive'); // destructive variant visually differentiates failures
    }

    throw error; // rethrow so caller retains original rejection semantics

  }
}

module.exports = { // expose toast helpers for reuse
  executeWithErrorToast,   // utility for operations that may fail
  executeWithToastFeedback // success/error toast helper

}; // end toast integration exports

