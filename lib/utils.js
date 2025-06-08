
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
/**
 * Event handling utility for preventing default browser behavior and event bubbling
 * 
 * This function combines two common event handling operations that are frequently
 * needed together:
 * 
 * 1. preventDefault() - Stops the browser's default action (form submission, link navigation, etc.)
 * 2. stopPropagation() - Prevents the event from bubbling up to parent elements
 * 
 * Common use cases:
 * - Form submission buttons that handle submission via JavaScript
 * - Links that trigger JavaScript actions instead of navigation
 * - Preventing parent click handlers from firing when child elements are clicked
 * - Modal/dropdown interactions where you want to prevent outside clicks from closing
 * 
 * The try-catch wrapper handles edge cases where the event object might be malformed
 * or missing expected methods, which can occur in certain testing environments or
 * with synthetic events.
 * 
 * @param {Event} e - The DOM event object to stop
 * @throws {Error} Re-throws any errors that occur during event handling
 */
function stopEvent(e) {
  console.log(`stopEvent is running with ${e.type}`);
  try {
    // Prevent the browser's default action for this event
    e.preventDefault();
    // Stop the event from bubbling up to parent elements
    e.stopPropagation();
    console.log(`stopEvent has run resulting in a final value of undefined`);
  } catch (err) {
    console.log(`stopEvent has run resulting in a final value of failure`);
    // Re-throw to allow calling code to handle the error appropriately
    throw err;
  }
}

/**
 * Toast utility functions for consistent user notifications
 * 
 * These functions provide a standardized way to show different types of toast
 * notifications throughout the application. They abstract away the specific
 * toast implementation details and provide a consistent API.
 */

/**
 * Generic toast display function
 * 
 * This function provides a simple interface for displaying toast notifications.
 * It accepts a toast instance (from useToast hook) and a message, handling
 * the common case of showing informational messages.
 * 
 * @param {Object} toast - Toast instance from useToast hook
 * @param {string} message - Message to display in the toast
 */
function showToast(toast, message) {
  if (toast && typeof toast === 'function') {
    toast({
      title: 'Notification',
      description: message,
    });
  }
}

/**
 * Success toast utility function
 * 
 * Displays a success message with appropriate styling and semantics.
 * Success toasts typically use green colors and checkmark icons to
 * indicate successful operations.
 * 
 * @param {Object} toast - Toast instance from useToast hook
 * @param {string} message - Success message to display
 */
function toastSuccess(toast, message) {
  if (toast && typeof toast === 'function') {
    toast({
      title: 'Success',
      description: message,
      variant: 'success',
    });
  }
}

/**
 * Error toast utility function
 * 
 * Displays an error message with appropriate styling and semantics.
 * Error toasts typically use red colors and warning icons to
 * indicate failed operations or validation errors.
 * 
 * @param {Object} toast - Toast instance from useToast hook
 * @param {string} message - Error message to display
 */
function toastError(toast, message) {
  if (toast && typeof toast === 'function') {
    toast({
      title: 'Error',
      description: message,
      variant: 'error',
    });
  }
}

/**
 * Module exports for utility functions
 * 
 * These utilities are designed to be used throughout the application
 * to provide consistent user feedback and event handling.
 */
module.exports = {
  showToast,
  toastSuccess,
  toastError,
  stopEvent
};
