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
  executeWithLoadingState, // loading helper // imported for explicit export // toggles loading state around promises to unify async flows
  useStableCallbackWithHandlers, // callback helper with handlers // imported for direct access
  useAsyncStateWithCallbacks, // async state hook // imported to expose low level helper
  useCallbackWithErrorHandling, // callback wrapper with errors // imported for completeness
  useAsyncAction, useDropdownData, createDropdownListHook, useDropdownToggle, // aggregate hook utilities // gathered here to ensure stable references across modules
  useEditForm, useIsMobile, useToast, toast, useToastAction, useAuthRedirect, usePageFocus, useSocket, // UI-related helpers // centralizing UI hooks prevents scattered imports
  showToast, toastSuccess, toastError, executeWithErrorToast, executeWithToastFeedback, stopEvent, apiRequest, getQueryFn, queryClient, formatAxiosError, axiosClient, getToastListenerCount, resetToastSystem, dispatch, getToastTimeoutCount // core API & toast utilities // exposes internal tools in one shot for clarity
} = require('./lib/hooks'); // CommonJS import keeps broad Node compatibility // require chosen so Node apps of any version can consume this module

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
module.exports = { // CommonJS export consolidating public API
  // Core async functionality hooks
  executeWithLoadingState, // helper for toggling loading around promises // exposed for external composition // ensures consistent async flows
  useStableCallbackWithHandlers, // callback with success/error handlers // exported for direct usage // keeps re-render count low across apps
  useAsyncStateWithCallbacks, // async hook with callbacks // public to share low level pattern // unifies resolve/reject handling across hooks
  useCallbackWithErrorHandling, // callback wrapper with error propagation // exported for consistency // ensures errors bubble similarly across hooks
  useAsyncAction,        // Primary hook for async operations with loading states // public so apps share one async pattern // consolidates error handling logic
  useToastAction,        // Combines async actions with toast updates // public so apps wire loading and toasts consistently // reduces toast boilerplate
  
  // Dropdown and form management hooks
  useDropdownData,       // Generic dropdown state management with async data fetching // exported to avoid reimplementing dropdown logic // keeps data fetch pattern consistent
  createDropdownListHook,// Factory for creating typed dropdown hooks // public so apps can create tailored dropdowns // fosters uniform dropdown implementations
  useDropdownToggle,     // Simple open/close state management for dropdowns // public for consistent toggle behavior // ensures toggling UI behaves identically
  useEditForm,           // Form editing state with field management // exported to share standardized form editing // centralizes form field logic
  
  // UI and responsive hooks
  useIsMobile,           // Responsive design hook for mobile detection // public for consistent responsive checks // shares single breakpoint across library
  useToast,              // Toast notification system with centralized state // exposed so components subscribe to toast updates // central hub for toast state
  toast,                 // Standalone toast function for imperative usage // public so non-hook code triggers notifications // lets non-hook code trigger toasts
  
  // Authentication and navigation
  useAuthRedirect,       // Authentication-based client-side routing // part of API to unify auth-based navigation // ensures unauthorized users are routed consistently
  
  // Accessibility and focus management
  usePageFocus,          // Keyboard focus management for route changes // public for accessibility compliance // automatically focuses main content for screen readers
  
  // Real-time communication
  useSocket,             // WebSocket communication for payment outcomes and usage updates // public for real-time data integration // manages Socket.IO connections with automatic cleanup
  
  // Utility functions
  showToast,             // Helper for displaying toast messages // public so notifications can be fired from any module // universal entry point for toast system
  toastSuccess,          // Success toast utility // exported for simple success messages // keeps success formatting consistent
  toastError,            // Error toast utility // public so error toasts share formatting // ensures error messages look the same
  executeWithErrorToast, // Operation wrapper that shows error toast // public for consistency // surfaces failures to users automatically
  executeWithToastFeedback, // Operation wrapper with success/error toasts // exposed to unify feedback // standardizes success and failure UX
  stopEvent,             // Event handling utility for preventing default behavior // kept public for generic DOM helpers // quick DOM helper for forms
  getToastListenerCount, // Allows tests to inspect active toast listeners // exported to help verify toast state // ensures toasts clean up between tests
  resetToastSystem,      // Clears toast listeners between tests // public to reset global state in tests // necessary for isolated test runs
  dispatch,              // Expose dispatch for advanced control and tests // exported so consumers can trigger custom actions // allows custom toast actions externally
  getToastTimeoutCount,  // Count pending toast timeouts // helps verify timers cleaned up // confirms timers clear properly
  
  // API and HTTP functionality
  apiRequest,            // Standardized HTTP request wrapper with error handling // public so external code uses shared axios logic // centralizes axios with error conventions
  getQueryFn,            // React Query integration for server state management // exported to build queries with 401 handling // ensures 401s handled the same way
  queryClient,           // Pre-configured React Query client instance // public to reuse a single query client // avoids creating multiple clients per app
  formatAxiosError,      // Error normalization for consistent error handling // exported to keep error objects uniform // simplifies logging and user messages
  axiosClient            // Pre-configured axios instance with sensible defaults // public so consumers share axios configuration // shares same baseURL and credentials
}; // end consolidated export object
