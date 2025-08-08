/**
 * Main entry point for the React hooks utility library npm module
 * 
 * This file serves as the public API surface for the entire library. The decision to use CommonJS
 * (require/module.exports) rather than ES modules is intentional to ensure compatibility with
 * Node.js environments that may not have ES module support enabled. This is particularly important
 * for a utility library that needs to work across different Node.js versions and configurations.
 *
 * The structure imports all functionality from the lib/hooks module and re-exports it through a single object.
 * Consolidating exports helps consumers discover all hooks and utilities in one place and keeps existing import paths stable as new functions are added. This approach allows for:
 * 1. Clean separation of implementation (in lib/) from public API (this file)
 * 2. Easy addition of new functionality without changing the import structure for consumers
 * 3. Potential future refactoring of internal organization without breaking external contracts
 */

// Import all hooks, utilities, and API functions from the consolidated hooks module
// The hooks module acts as an aggregator, pulling together functionality from multiple internal modules
const {
  useAsyncAction, useDropdownData, useDropdownToggle, useEditForm,
  useIsMobile, useToast, useToastAction, useAdvancedToast, useAuthRedirect,
  usePageFocus, useSocket, createDropdownListHook, LazyImagePreview,
  showToast, toastSuccess, toastError, advancedToast, showSuccessToast, showErrorToast, showInfoToast, showWarningToast,
  executeWithErrorToast, executeWithToastFeedback, stopEvent, 
  formatAxiosError, safeStringify, apiRequest, getQueryFn,
  handleApiError, handle401Error, cn,
  formValidation, executeWithErrorHandling, executeWithLoadingState,
  isFunction, isObject, isAxiosErrorWithStatus,
  axiosClient, queryClient, createSubTrigger, createContextMenuSubTrigger, createMenubarSubTrigger,
  useForm, useFormSubmission, FormField, TextInputField, TextareaField, SelectField, CheckboxField,
  getAdvancedToastCount, clearAllAdvancedToasts, getAdvancedToastTimeoutCount, clearToastTimeout, toastSubscribe, toastGetState, toastReducer, toastActionTypes,
  toastDispatch, showSuccess, showError, showInfo, showWarning,
  logger, log, logDebug, logError, logWarning, logHookEvent,
  parseVitestResults
} = require('./lib/hooks.js');

/**
 * Export all functions for use as a module
 * 
 * The explicit object structure (rather than just re-exporting the imported object) serves
 * multiple purposes:
 * 1. Makes the public API explicit and visible in this file
 * 2. Allows for potential future selective exports or API modifications
 * 3. Provides better tooling support for IDEs and documentation generators
 * 4. Makes it clear to maintainers what the intended public surface is
 */
/**
 * Keeping a single export block makes the API easy to scan by new consumers; ensures discoverability.
 * Internal modules can move or reorganize without changing these exports, so existing imports keep working; ensures backward compatibility.
 */
// Exports are grouped by hook type: async actions, UI helpers, utilities, API // clarifies structure for maintainers
module.exports = {
  // Hooks
  useAsyncAction, useDropdownData, useDropdownToggle, useEditForm,
  useIsMobile, useToast, useToastAction, useAdvancedToast, useAuthRedirect,
  usePageFocus, useSocket, createDropdownListHook,

  // Components
  LazyImagePreview, createSubTrigger, createContextMenuSubTrigger, createMenubarSubTrigger,

  // Form Components and Utilities
  useForm, useFormSubmission, FormField, TextInputField, TextareaField, SelectField, CheckboxField,
  formValidation,

  // Toast Utilities
  showToast, toastSuccess, toastError, advancedToast, showSuccessToast, showErrorToast, showInfoToast, showWarningToast,
  executeWithErrorToast, executeWithToastFeedback, 
  getAdvancedToastCount, clearAllAdvancedToasts, getAdvancedToastTimeoutCount, clearToastTimeout, toastSubscribe, toastGetState, toastReducer, toastActionTypes,
  toastDispatch, showSuccess, showError, showInfo, showWarning,

  // API and Network Utilities
  apiRequest, getQueryFn, formatAxiosError, axiosClient, queryClient,
  handleApiError, handle401Error,

  // General Utilities
  executeWithErrorHandling, executeWithLoadingState, stopEvent, 
  safeStringify, cn, isFunction, isObject, isAxiosErrorWithStatus,

  // Logging
  logger, log, logDebug, logError, logWarning, logHookEvent,

  // Test Utilities
  parseVitestResults
};