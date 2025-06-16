/**
 * Toast Integration Utilities Module
 * 
 * This module provides common patterns for integrating toast notifications
 * with various operations, reducing duplication across hooks and utility functions.
 * These wrappers are intentionally thin so callers simply provide a callback and
 * a toast instance. The callback performs the actual work (like submitting a form
 * or saving data) while the wrapper ensures a toast is shown on success or error.
 * This keeps component code concise and centralizes toast styling.
 */

const { showToast } = require('./utils'); // core toast utilities

/**
 * Execute an async operation with automatic error toast display
 *
 * This helper is for operations where only errors require user feedback. It
 * simply awaits the provided callback and shows a destructive toast when the
 * callback throws. On success no toast is shown. Typical usage: form
 * submissions where the UI already updates visibly when successful and a toast
 * is only needed on failure.
 *
 * @param {Function} operation - Async operation to execute
 * @param {Object} toast - Toast instance
 * @param {string} errorTitle - Title for error toast
 * @returns {*} Operation result or throws error
 */
async function executeWithErrorToast(operation, toast, errorTitle = 'Error') { // display error toast on failure
  try {

    return await operation(); // run caller supplied callback

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
 * This utility wraps operations where both success and failure warrant user
 * notifications. A success toast is shown only when the operation resolves
 * without throwing. If the operation throws, an error toast appears instead.
 * Typical usage: saving data where users expect a "Saved" toast on completion
 * or an error toast when something goes wrong.
 *
 * @param {Function} operation - Async operation to execute
 * @param {Object} toast - Toast instance
 * @param {string} successMessage - Success message
 * @param {string} errorTitle - Title for error toast
 * @returns {*} Operation result or throws error
 */
async function executeWithToastFeedback(operation, toast, successMessage, errorTitle = 'Error') { // show success or error toast
  try {


    const result = await operation(); // run caller callback then handle toasts
    if (toast && typeof toast === 'function') { // show success when provided
      showToast(toast, successMessage, 'Success'); // acknowledge operation success

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
  executeWithErrorToast,   // utility for operations that may fail // exported so any async function can show error toasts
  executeWithToastFeedback // success/error toast helper // public to provide consistent toast flow

}; // end toast integration exports

