
/**
 * Toast Utility Functions Module
 * 
 * This module provides standardized functions for displaying toast notifications
 * across the application. The design addresses several architectural concerns:
 * 
 * 1. **Consistency**: All toast messages follow the same format and behavior
 * 2. **Abstraction**: Components don't need to know toast implementation details
 * 3. **Flexibility**: Supports different message types (success, error, info)
 * 4. **Maintainability**: Changes to toast behavior only need to happen here
 * 
 * The functions are designed to work with any toast system that accepts
 * title/description/variant parameters, making the module adaptable to
 * different UI libraries (shadcn/ui, Chakra UI, Material-UI, etc.).
 */

/**
 * Execute an async operation with standardized error handling and logging
 * 
 * This utility centralizes the common pattern of try-catch with logging
 * used across multiple modules, reducing code duplication while maintaining
 * consistent error handling behavior.
 * 
 * @param {Function} operation - Async operation to execute
 * @param {string} operationName - Name for logging purposes
 * @param {Function} errorHandler - Optional custom error handler
 * @returns {Promise} Result of the operation or re-throws error
 */
/**
 * Conditionally log to the console in non-production environments
 *
 * This helper preserves debugging output during development while keeping
 * production logs clean.
 *
 * @param {string} message - Message to log
 */
function debugLog(message) {
  if (process.env.NODE_ENV !== 'production') { console.log(message); } // avoid noisy logs in production
}

async function executeAsyncWithLogging(operation, operationName, errorHandler) {
  debugLog(`${operationName} is running`); // indicate async action start only when not production
  try {
    const result = await operation();
    debugLog(`${operationName} completed successfully`); // show success only in dev
    return result;
  } catch (error) {
    console.error(`${operationName} error:`, error);
    if (errorHandler) {
      return errorHandler(error);
    }
    throw error;
  }
}

/**
 * Primary toast display function with comprehensive variant support
 * 
 * This function serves as the foundation for all other toast utilities in the module.
 * It centralizes the core toast creation logic to ensure consistency across different
 * message types. The design decisions include:
 * 
 * - **Parameter Order**: toast function first (dependency injection pattern) followed
 *   by content parameters in order of importance (message, title, variant)
 * - **Variant System**: Uses string variants to support different toast styling
 *   ('default', 'destructive', 'success') which maps to most popular toast libraries
 * - **Return Value**: Returns the toast object to allow for programmatic dismissal
 *   or chaining of operations if needed
 * - **Error Handling**: Wraps in try-catch to gracefully handle malformed toast
 *   functions or missing dependencies
 * - **Logging**: Comprehensive logging for debugging toast display issues in
 *   development and production environments
 * 
 * Alternative approaches considered:
 * - Could have made variant an enum, but strings provide more flexibility
 * - Could have used positional parameters, but named object would be more verbose
 * - Could have silently failed on errors, but throwing preserves error information
 * 
 * @param {Function} toast - Toast function from useToast hook (dependency injection)
 * @param {string} message - Primary message content to display to user
 * @param {string} title - Toast title (appears above message in most implementations)
 * @param {string|null} variant - Visual variant ('default', 'destructive', null for default)
 * @returns {Object} Toast result object with dismiss/update methods
 * @throws {Error} Re-throws any errors from the toast function for proper error handling
 */
const showToast = withToastLogging('showToast', function(toast, message, title, variant) { // create and log toast
  // Call the injected toast function with standardized parameter structure
  // This object structure is compatible with most popular toast libraries
  return toast({ title: title, description: message, variant: variant });
});

/**
 * Specialized error toast function for consistent error messaging
 * 
 * This function provides a standardized way to display error messages throughout
 * the application. The design enforces consistency in error communication while
 * reducing boilerplate in consuming components. Key design decisions:
 * 
 * - **Default Title**: Uses "Error" as the default title to ensure consistent
 *   error message formatting across the application without requiring developers
 *   to remember to set appropriate titles
 * - **Destructive Variant**: Hard-codes the 'destructive' variant to ensure error
 *   messages always appear with appropriate visual styling (typically red/warning colors)
 * - **Delegation Pattern**: Delegates to showToast rather than duplicating logic,
 *   ensuring any changes to core toast behavior automatically apply to error messages
 * - **Flexible Title Override**: Allows custom titles for cases where "Error" might
 *   not be appropriate (e.g., "Validation Failed", "Network Error", etc.)
 * 
 * This approach ensures that error handling is consistent across the application
 * while maintaining flexibility for edge cases. The function serves as a convenience
 * wrapper that encodes organizational standards for error messaging.
 * 
 * @param {Function} toast - Toast function from useToast hook
 * @param {string} message - Error message to display to the user
 * @param {string} title - Custom title (defaults to "Error" for consistency)
 * @returns {Object} Toast result object for programmatic control if needed
 * @throws {Error} Re-throws any underlying toast errors to preserve error chain
 */
function toastError(toast, message, title = `Error`) {
  debugLog(`toastError is running with ${message}`); // hide logs in production
  try {
    // Use destructive variant to ensure error messages have appropriate visual treatment
    const result = showToast(toast, message, title, `destructive`);
    debugLog(`toastError is returning ${JSON.stringify(result)}`); // confirm toast result
    return result;
  } catch (err) {
    debugLog(`toastError has run resulting in a final value of failure`); // log failure for debugging
    // Preserve error chain for debugging while allowing graceful degradation
    throw err;
  }
}

/**
 * Specialized success toast function for positive user feedback
 * 
 * This function standardizes the display of success messages, which are crucial
 * for user experience in applications where users perform actions that might
 * not have obvious visual feedback (saves, updates, deletions, etc.). Design rationale:
 * 
 * - **Default Title**: Uses "Success" as the standard title to create consistent
 *   positive feedback patterns throughout the application
 * - **Default Variant**: Uses the default variant (typically green styling) to
 *   provide positive visual feedback without being overly aggressive
 * - **Delegation Pattern**: Like toastError, delegates to showToast to maintain
 *   a single source of truth for toast behavior
 * - **Title Flexibility**: Allows customization for specific success scenarios
 *   (e.g., "Saved!", "Updated!", "Deleted!") while maintaining consistency
 * 
 * Success messages are often overlooked but are essential for user confidence,
 * especially in single-page applications where actions might not have obvious
 * visual effects. This function ensures they're easy to implement consistently.
 * 
 * @param {Function} toast - Toast function from useToast hook
 * @param {string} message - Success message to display to the user
 * @param {string} title - Custom title (defaults to "Success" for consistency)
 * @returns {Object} Toast result object for programmatic control if needed
 * @throws {Error} Re-throws any underlying toast errors to preserve error chain
 */
function toastSuccess(toast, message, title = `Success`) {
  debugLog(`toastSuccess is running with ${message}`); // hide success logs in production
  try {
    // Use default variant for positive but not overwhelming visual feedback
    const result = showToast(toast, message, title);
    debugLog(`toastSuccess is returning ${JSON.stringify(result)}`); // confirm toast output in dev
    return result;
  } catch (err) {
    debugLog(`toastSuccess has run resulting in a final value of failure`); // log failure path for dev
    // Maintain error chain integrity for debugging
    throw err;
  }
}

/**
 * Comprehensive event stopping utility for React applications
 * 
 * This utility function addresses one of the most common patterns in React
 * applications: the need to prevent both default browser behavior and event
 * bubbling simultaneously. While these could be called separately, combining
 * them provides several advantages:
 * 
 * 1. **Consistency**: Ensures developers don't forget one or the other
 * 2. **Readability**: Single function call is clearer than two separate calls
 * 3. **Error Handling**: Centralized error handling for malformed events
 * 4. **Debugging**: Unified logging for event handling issues
 * 
 * This pattern is especially important in modern React applications where:
 * - Event delegation is common (events bubble up through component trees)
 * - Custom controls need to override browser defaults (custom dropdowns, modals)
 * - Multiple event handlers might be attached to the same element hierarchy
 * 
 * Alternative approaches considered:
 * - Separate functions for preventDefault and stopPropagation (more verbose)
 * - Higher-order component for event handling (would couple with React lifecycle)
 * - Custom hook for event handling (overkill for this simple operation)
 * 
 * The current implementation was chosen for its simplicity, reusability, and
 * compatibility with both React synthetic events and native DOM events.
 * 
 * @param {Event|SyntheticEvent} e - DOM or React synthetic event object to stop
 * @throws {Error} Re-throws any errors to preserve debugging information
 */
function stopEvent(e) {
  debugLog(`stopEvent is running with ${e.type}`); // event info only during dev
  try {
    // Prevent the browser's default action for this event
    // This stops form submissions, link navigation, right-click menus, etc.
    e.preventDefault();
    
    // Stop the event from bubbling up to parent elements
    // This prevents parent click handlers from firing unexpectedly
    e.stopPropagation();
    
    debugLog(`stopEvent has run resulting in a final value of undefined`); // confirm success
  } catch (err) {
    debugLog(`stopEvent has run resulting in a final value of failure`); // log failure path
    // Re-throw to allow calling code to handle the error appropriately
    // This preserves the error chain for debugging while allowing graceful degradation
    throw err;
  }
}

/**
 * Standardized logging utility for consistent function tracing
 * 
 * This utility provides consistent logging patterns across all functions,
 * reducing code duplication and ensuring uniform debugging output.
 * 
 * @param {string} functionName - Name of the function being logged
 * @param {string} phase - Phase of execution ('entry', 'exit', 'error')
 * @param {*} data - Data to log (parameters, return values, errors)
 */
function logFunction(functionName, phase, data) {
  switch (phase) {
    case 'entry':
      debugLog(`${functionName} is running with ${data}`); // track entry only when not production
      break;
    case 'exit':
      debugLog(`${functionName} is returning ${JSON.stringify(data)}`); // show return values in dev
      break;
    case 'completion':
      debugLog(`${functionName} has run resulting in a final value of ${data}`); // completion log
      break;
    case 'error':
      debugLog(`${functionName} has run resulting in a final value of failure`); // error path log
      break;
    default:
      debugLog(`${functionName}: ${data}`); // generic log fallback
  }
}

/**
 * Higher-order function wrapper for consistent logging across toast functions
 * 
 * This reduces the repetitive try-catch-log pattern while maintaining individual
 * function clarity. Each toast function keeps its specific logic but gains
 * consistent error handling and logging.
 * 
 * @param {string} functionName - Name of the function being wrapped
 * @param {Function} operation - The core operation to execute
 * @returns {Function} Wrapped function with logging and error handling
 */
function withToastLogging(functionName, operation) {
  return function(...args) {
    logFunction(functionName, 'entry', args[1] || 'params'); // Log message parameter
    try {
      const result = operation.apply(this, args);
      logFunction(functionName, 'exit', result);
      return result;
    } catch (err) {
      logFunction(functionName, 'error', null);
      throw err;
    }
  };
}

/**
 * Module Exports: Utility Functions for Application-Wide Use
 * 
 * This export structure provides a clean, documented interface for the utility
 * functions. The decision to use CommonJS (module.exports) rather than ES modules
 * ensures compatibility with Node.js environments and build tools that may not
 * have full ES module support.
 * 
 * Export Design Principles:
 * 1. **Explicit Exports**: Each function is explicitly listed to make the public
 *    API clear and prevent accidental exports of internal functions
 * 2. **Consistent Naming**: All exports use camelCase following JavaScript conventions
 * 3. **Functional Grouping**: Related functions (toast utilities, event handling)
 *    are grouped together conceptually
 * 4. **Future Extensibility**: The object structure allows for easy addition of
 *    new utilities without changing the import patterns for consumers
 * 
 * These utilities are designed to be framework-agnostic where possible, making
 * them reusable across different React applications and potentially other
 * JavaScript environments.
 */
module.exports = {
  // Async execution utilities for consistent error handling
  executeAsyncWithLogging,  // Standardized async operation wrapper

  // Logging utilities for consistent debugging
  debugLog,          // Conditional console.log wrapper to silence production logs
  logFunction,        // Standardized function logging utility
  withToastLogging,   // expose wrapper so tests can verify logging wrapper behaviour
  
  // Toast notification utilities for consistent user feedback
  showToast,      // Primary toast function with full customization options
  toastSuccess,   // Specialized success message display
  toastError,     // Specialized error message display
  
  // Event handling utilities for common DOM interactions
  stopEvent       // Combined preventDefault + stopPropagation for cleaner code
};
