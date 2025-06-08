
/**
 * Toast utility functions for consistent messaging
 */

/**
 * Display a success toast message
 * @param {Object} toast - Toast instance
 * @param {string} message - Success message to display
 */
function toastSuccess(toast, message) {
  toast({
    title: "Success",
    description: message,
    variant: "default"
  });
}

/**
 * Display an error toast message
 * @param {Object} toast - Toast instance
 * @param {string} message - Error message to display
 */
function toastError(toast, message) {
  toast({
    title: "Error",
    description: message,
    variant: "destructive"
  });
}

module.exports = {
  toastSuccess,
  toastError
};
