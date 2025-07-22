/**
 * Centralized Toast Notification Utilities Module
 * 
 * This module provides consistent patterns for success, error, and info notifications
 * built on top of the advanced toast notification system. It offers convenient
 * wrapper functions that standardize toast creation across the application.
 * 
 * Features:
 * - Consistent variant mapping for different notification types
 * - Standardized parameter structure for ease of use
 * - Integration with the advanced toast system
 * - Support for both hook-based and imperative usage patterns
 */

/**
 * Show a success toast notification
 * 
 * Creates a success-styled toast notification with the provided title and description.
 * Uses the 'default' variant which should be styled as a success state in most
 * toast implementations.
 * 
 * @param {Function} toast - The toast function from useAdvancedToast hook
 * @param {string} title - Notification title
 * @param {string} description - Notification description
 * @returns {Object} Toast control object with id, dismiss, and update methods
 * 
 * @example
 * const { toast } = useAdvancedToast();
 * showSuccessToast(toast, "Success!", "Your changes have been saved.");
 */
function showSuccessToast(toast, title, description) {
  return toast({
    title,
    description,
    variant: 'success', // using 'success' variant for clear intent
  });
}

/**
 * Show an error toast notification
 * 
 * Creates an error-styled toast notification with the provided title and description.
 * Uses the 'destructive' variant which should be styled as an error state in most
 * toast implementations.
 * 
 * @param {Function} toast - The toast function from useAdvancedToast hook
 * @param {string} title - Notification title
 * @param {string} description - Notification description
 * @returns {Object} Toast control object with id, dismiss, and update methods
 * 
 * @example
 * const { toast } = useAdvancedToast();
 * showErrorToast(toast, "Error", "Failed to save your changes.");
 */
function showErrorToast(toast, title, description) {
  return toast({
    title,
    description,
    variant: 'destructive', // using 'destructive' variant for error styling
  });
}

/**
 * Show an informational toast notification
 * 
 * Creates an info-styled toast notification with the provided title and description.
 * Uses the 'default' variant for general informational messages.
 * 
 * @param {Function} toast - The toast function from useAdvancedToast hook
 * @param {string} title - Notification title
 * @param {string} description - Notification description
 * @returns {Object} Toast control object with id, dismiss, and update methods
 * 
 * @example
 * const { toast } = useAdvancedToast();
 * showInfoToast(toast, "Info", "Your session will expire in 5 minutes.");
 */
function showInfoToast(toast, title, description) {
  return toast({
    title,
    description,
    variant: 'default', // using 'default' variant for informational messages
  });
}

/**
 * Show a warning toast notification
 * 
 * Creates a warning-styled toast notification with the provided title and description.
 * Uses the 'warning' variant for cautionary messages.
 * 
 * @param {Function} toast - The toast function from useAdvancedToast hook
 * @param {string} title - Notification title
 * @param {string} description - Notification description
 * @returns {Object} Toast control object with id, dismiss, and update methods
 * 
 * @example
 * const { toast } = useAdvancedToast();
 * showWarningToast(toast, "Warning", "This action cannot be undone.");
 */
function showWarningToast(toast, title, description) {
  return toast({
    title,
    description,
    variant: 'warning', // using 'warning' variant for cautionary messages
  });
}

/**
 * Convenience function to show success toast with just a message
 * 
 * @param {Function} toast - The toast function from useAdvancedToast hook
 * @param {string} message - Single message for both title and description
 * @returns {Object} Toast control object
 */
function showSuccess(toast, message) {
  return showSuccessToast(toast, "Success", message);
}

/**
 * Convenience function to show error toast with just a message
 * 
 * @param {Function} toast - The toast function from useAdvancedToast hook
 * @param {string} message - Single message for both title and description
 * @returns {Object} Toast control object
 */
function showError(toast, message) {
  return showErrorToast(toast, "Error", message);
}

/**
 * Convenience function to show info toast with just a message
 * 
 * @param {Function} toast - The toast function from useAdvancedToast hook
 * @param {string} message - Single message for both title and description
 * @returns {Object} Toast control object
 */
function showInfo(toast, message) {
  return showInfoToast(toast, "Info", message);
}

/**
 * Convenience function to show warning toast with just a message
 * 
 * @param {Function} toast - The toast function from useAdvancedToast hook
 * @param {string} message - Single message for both title and description
 * @returns {Object} Toast control object
 */
function showWarning(toast, message) {
  return showWarningToast(toast, "Warning", message);
}

module.exports = {
  showSuccessToast,  // explicit success toast with title and description // exported for detailed success notifications
  showErrorToast,    // explicit error toast with title and description // exported for detailed error notifications
  showInfoToast,     // explicit info toast with title and description // exported for detailed informational notifications
  showWarningToast,  // explicit warning toast with title and description // exported for detailed warning notifications
  showSuccess,       // convenience success toast with message only // exported for simple success notifications
  showError,         // convenience error toast with message only // exported for simple error notifications
  showInfo,          // convenience info toast with message only // exported for simple informational notifications
  showWarning,       // convenience warning toast with message only // exported for simple warning notifications
};