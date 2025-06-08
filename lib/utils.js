
/**
 * Toast utility functions for consistent messaging
 */

/**
 * Centralized toast function with variant support
 * @param {Function} toast - Toast function from useToast hook
 * @param {string} message - Message to display
 * @param {string} title - Title for the toast
 * @param {string} variant - Toast variant ('default', 'destructive', or null)
 * @returns {Object} Toast result object
 */
function showToast(toast, message, title, variant) {
  console.log(`showToast is running with ${message}`);
  try {
    const result = toast({ title: title, description: message, variant: variant });
    console.log(`showToast is returning ${JSON.stringify(result)}`);
    return result;
  } catch (err) {
    console.log(`showToast has run resulting in a final value of failure`);
    throw err;
  }
}

/**
 * Display an error toast message
 * @param {Function} toast - Toast function from useToast hook
 * @param {string} message - Error message to display
 * @param {string} title - Title for the toast (defaults to "Error")
 * @returns {Object} Toast result object
 */
function toastError(toast, message, title = `Error`) {
  console.log(`toastError is running with ${message}`);
  try {
    const result = showToast(toast, message, title, `destructive`);
    console.log(`toastError is returning ${JSON.stringify(result)}`);
    return result;
  } catch (err) {
    console.log(`toastError has run resulting in a final value of failure`);
    throw err;
  }
}

/**
 * Display a success toast message
 * @param {Function} toast - Toast function from useToast hook
 * @param {string} message - Success message to display
 * @param {string} title - Title for the toast (defaults to "Success")
 * @returns {Object} Toast result object
 */
function toastSuccess(toast, message, title = `Success`) {
  console.log(`toastSuccess is running with ${message}`);
  try {
    const result = showToast(toast, message, title);
    console.log(`toastSuccess is returning ${JSON.stringify(result)}`);
    return result;
  } catch (err) {
    console.log(`toastSuccess has run resulting in a final value of failure`);
    throw err;
  }
}

/**
 * Centralized preventDefault + stopPropagation helper for React events
 * @param {Object} e - React SyntheticEvent object
 */
function stopEvent(e) {
  console.log(`stopEvent is running with ${e.type}`);
  try {
    e.preventDefault();
    e.stopPropagation();
    console.log(`stopEvent has run resulting in a final value of undefined`);
  } catch (err) {
    console.log(`stopEvent has run resulting in a final value of failure`);
    throw err;
  }
}

module.exports = {
  showToast,
  toastSuccess,
  toastError,
  stopEvent
};
