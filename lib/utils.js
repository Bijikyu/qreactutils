
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

const { safeStringify } = require('./validation.js'); // import safe-json-stringify wrapper for consistent logging

/**
 * Execute an async operation with standardized error handling and logging
 * 
 * This utility centralizes the common pattern of try-catch with logging
 * used across multiple modules, reducing code duplication while maintaining
 * consistent error handling behavior.
 * Typical usage: wrap API requests or file operations so failures log consistently.
 *
 * @param {Function} operation - Async operation to execute
 * @param {string} operationName - Name for logging purposes
 * @param {Function} errorHandler - Optional custom error handler
 * @returns {Promise} Result of the operation or re-throws error
 */
async function executeAsyncWithLogging(operation, operationName, errorHandler) { // wrapper for async ops with unified logs
  console.log(`executeAsyncWithLogging is running with ${operationName}`); // trace parameters for debugging
  logFunction(operationName, 'entry', operationName); // record the call for debugging
  try { // attempt to run provided operation

    const result = await operation(); // execute provided async operation
    console.log(`executeAsyncWithLogging is returning ${safeStringify(result)}`); // expose return for easier tracing
    logFunction(operationName, 'exit', result); // log the successful result
    return result; // forward result back to caller

  } catch (error) { // handle any thrown errors
    logFunction(operationName, 'error', error); // record the error for tracing
    if (errorHandler) { // allow custom error processing
      const handled = await errorHandler(error); // run custom handler so caller can decide next step
      console.log(`executeAsyncWithLogging is returning ${safeStringify(handled)}`); // log handled value before returning
      return handled; // return processed error result
    }

    throw error; // rethrow when no handler provided

  } // end catch block
} // end executeAsyncWithLogging

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
 * Typical usage: call from event handlers or hooks to surface status updates to the user.
 * @param {Function} toast - Toast function from useToast hook (dependency injection)
 * @param {string} message - Primary message content to display to user
 * @param {string} title - Toast title (appears above message in most implementations)
 * @param {string|null} variant - Visual variant ('default', 'destructive', null for default)
 * @returns {Object} Toast result object with dismiss/update methods
 * @throws {Error} Re-throws any errors from the toast function for proper error handling
 */
const showToast = withToastLogging('showToast', function(toast, message, title, variant) { // create and log toast
  console.log(`showToast is running with ${message}`); // log message parameter for tracing
  if (typeof toast !== 'function') { throw new Error('showToast requires a function for `toast` parameter'); } // ensure dependency injection was correct
  // Call the injected toast function with standardized parameter structure
  // This object structure is compatible with most popular toast libraries
  const res = toast({ title: title, description: message, variant: variant }); // invoke UI library with normalized params
  console.log(`showToast is returning ${safeStringify(res)}`); // log toast result for debugging
  return res; // forward toast object back to caller
}); // end showToast

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
 * Typical usage: call inside catch blocks when API requests or validations fail.
 * @param {Function} toast - Toast function from useToast hook
 * @param {string} message - Error message to display to the user
 * @param {string} title - Custom title (defaults to "Error" for consistency)
 * @returns {Object} Toast result object for programmatic control if needed
 * @throws {Error} Re-throws any underlying toast errors to preserve error chain
 */
function toastError(toast, message, title = `Error`) { // wrapper around showToast for errors
  console.log(`toastError is running with ${message}`); // trace parameters for debugging
  try { // show the error toast and capture any issues
    // Use destructive variant to ensure error messages have appropriate visual treatment
    const result = showToast(toast, message, title, `destructive`); // display standardized error toast
    console.log(`toastError is returning ${safeStringify(result)}`); // log toast object for clarity
    return result; // expose toast result to caller
  } catch (err) { // if toast itself throws
    // Preserve error chain for debugging while allowing graceful degradation
    console.log(`toastError encountered error ${err}`); // log failure before rethrowing
    throw err; // rethrow after logging to maintain stack trace
  } // end catch
} // end toastError

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
 * Typical usage: call after saving data or completing a user task to confirm success.
 *
 * @param {Function} toast - Toast function from useToast hook
 * @param {string} message - Success message to display to the user
 * @param {string} title - Custom title (defaults to "Success" for consistency)
 * @returns {Object} Toast result object for programmatic control if needed
 * @throws {Error} Re-throws any underlying toast errors to preserve error chain
 */
function toastSuccess(toast, message, title = `Success`) { // wrapper for success messages
  console.log(`toastSuccess is running with ${message}`); // trace parameters for debugging
  try { // attempt toast creation
    // Use default variant for positive but not overwhelming visual feedback

    const result = showToast(toast, message, title); // display standardized success toast
    console.log(`toastSuccess is returning ${safeStringify(result)}`); // log toast object for clarity
    return result; // provide toast object for optional chaining

  } catch (err) { // toast invocation failed
    // Maintain error chain integrity for debugging
    console.log(`toastSuccess encountered error ${err}`); // log failure before rethrowing
    throw err; // propagate failure to caller
  } // end catch
} // end toastSuccess

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
 * Typical usage: call within custom button handlers to prevent default navigation and bubbling.
 *
 * @param {Event|SyntheticEvent} e - DOM or React synthetic event object to stop
 * @throws {Error} Re-throws any errors to preserve debugging information
 */
function stopEvent(e) { // cancel browser event reliably
  console.log(`stopEvent is running with ${e.type}`); // trace event type to debug unexpected interactions
  try { // attempt to cancel event
    // Prevent the browser's default action for this event, like submitting a form or navigating away
    e.preventDefault(); // stop browser default behaviour before custom handling
    // Stop the event from bubbling up to parent elements so only the intended handler runs
    e.stopPropagation(); // block parent handlers so component fully controls event
    console.log(`stopEvent has run resulting in a final value of undefined`); // log completion since no return
  } catch (err) {
    console.log(`stopEvent encountered error ${err}`); // show failure context for debugging
    // Re-throw to allow calling code to handle the error appropriately
    // This preserves the error chain for debugging while allowing graceful degradation
    throw err;
  }
} // end stopEvent

/**
 * Standardized logging utility for consistent function tracing
 * 
 * This utility provides consistent logging patterns across all functions,
 * reducing code duplication and ensuring uniform debugging output.
 * Typical usage: called by other utilities to trace execution during development and testing.
 *
 * @param {string} functionName - Name of the function being logged
 * @param {string} phase - Phase of execution ('entry', 'exit', 'error')
 * @param {*} data - Data to log (parameters, return values, errors)
 */
function logFunction(functionName, phase, data) { // unified logging helper
  console.log(`logFunction is running with ${functionName},${phase}`); // trace parameters for debugging
  switch (phase) { // branch on execution phase for clarity
    case 'entry': // starting function
      console.log(`${functionName} is running with ${data}`); // log parameters
      break; // continue after logging
    case 'exit': // successful completion
      console.log(`${functionName} is returning ${safeStringify(data)}`); // use safe stringify so logging never throws
      break; // exit switch
    case 'completion': // final value with no return
      console.log(`${functionName} has run resulting in a final value of ${data}`); // log final state
      break; // done logging
    case 'error': // error path
      console.log(`${functionName} encountered error ${data}`); // include error detail for easier debugging
      break; // fall through after error
    default: // unexpected phase
      console.log(`${functionName} ${phase}: ${data}`); // fallback log for unexpected phases
  } // end switch
  console.log(`logFunction has run resulting in a final value of undefined`); // no return value so log completion
} // end logFunction

/**
 * Higher-order function wrapper for consistent logging across toast functions
 *
 * This reduces the repetitive try-catch-log pattern while maintaining individual
 * function clarity. Each toast function keeps its specific logic but gains
 * consistent error handling and logging.
 *
 * **Trade-offs**: The approach keeps logging logic DRY and guarantees error
 * propagation, at the cost of another function layer.  The small indirection was
 * considered preferable to repeating try/catch blocks in every toast util.
 *
 * **Alternatives considered**: We explored integrating logging directly into
 * each toast utility or using a decorator library.  Both options added repeated
 * code or new dependencies, so the simple wrapper was chosen for minimal
 * overhead and maintainability.
 * Typical usage: wrap custom toast helpers so they log like the built-in utilities.
 *
 * @param {string} functionName - Name of the function being wrapped
 * @param {Function} operation - The core operation to execute
 * @returns {Function} Wrapped function with logging and error handling
 */
function withToastLogging(functionName, operation) { // wraps toast functions with logs
  console.log(`withToastLogging is running with ${functionName}`); // trace wrapper creation
  const wrapped = function(...args) { // return a new function preserving API
    logFunction(functionName, 'entry', args[1] || 'params'); // start log for easier tracing
    try { // attempt to run the original operation

      const result = operation.apply(this, args); // invoke underlying toast logic
      logFunction(functionName, 'exit', result); // log final toast object
      return result; // ensure wrapped function mirrors original API
    } catch (err) { // capture any errors
      logFunction(functionName, 'error', err); // pass error object for detailed logging
      throw err; // rethrow so calling code can handle failure

    } // end catch
  }; // end wrapper
  console.log(`withToastLogging is returning wrapped function`); // log returned wrapper
  return wrapped; // expose new function for callers
} // end withToastLogging

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
module.exports = { // expose utilities via CommonJS for compatibility
  // Async execution utilities for consistent error handling
  executeAsyncWithLogging,  // Standardized async operation wrapper // public to share one async logging pattern

  // Logging utilities for consistent debugging
  logFunction,        // Standardized function logging utility // exported so external code can match library logs
  withToastLogging,   // expose wrapper so tests can verify logging wrapper behaviour // public for advanced debugging
  
  // Toast notification utilities for consistent user feedback
  showToast,      // Primary toast function with full customization options // exported so any module can show a toast
  toastSuccess,   // Specialized success message display // public convenience for success cases
  toastError,     // Specialized error message display // exported for uniform error toasts
  
  // Event handling utilities for common DOM interactions
  stopEvent       // Combined preventDefault + stopPropagation for cleaner code // public DOM helper shared across components

}; // end of utility exports

