/**
 * Main entry point for the React hooks utility library npm module
 * 
 * This file serves as the public API surface for the entire library. The decision to use CommonJS
 * (require/module.exports) rather than ES modules is intentional to ensure compatibility with
 * Node.js environments that may not have ES module support enabled. This is particularly important
 * for a utility library that needs to work across different Node.js versions and configurations.
 * 
 * The structure imports all functionality from the lib/hooks module and re-exports it, creating
 * a single point of entry. This approach allows for:
 * 1. Clean separation of implementation (in lib/) from public API (this file)
 * 2. Easy addition of new functionality without changing the import structure for consumers
 * 3. Potential future refactoring of internal organization without breaking external contracts
 */

// Import all hooks, utilities, and API functions from the consolidated hooks module
// The hooks module acts as an aggregator, pulling together functionality from multiple internal modules
const {
  useAsyncAction, useDropdownData, createDropdownListHook, useDropdownToggle, // aggregate hook utilities // gathered here to ensure stable references across modules
  useEditForm, useIsMobile, useToast, toast, useToastAction, useAuthRedirect, // UI-related helpers // centralizing UI hooks prevents scattered imports
  showToast, toastSuccess, toastError, stopEvent, apiRequest, getQueryFn, queryClient, formatAxiosError, axiosClient, getToastListenerCount, resetToastSystem, dispatch // core API & toast utilities // exposes internal tools in one shot for clarity
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
module.exports = { // CommonJS export consolidating public API
  // Core async functionality hooks
  useAsyncAction,        // Primary hook for async operations with loading states // public so apps share one async pattern
  useToastAction,        // Combines async actions with toast updates // public so apps wire loading and toasts consistently
  
  // Dropdown and form management hooks
  useDropdownData,       // Generic dropdown state management with async data fetching // exported to avoid reimplementing dropdown logic
  createDropdownListHook,// Factory for creating typed dropdown hooks // public so apps can create tailored dropdowns
  useDropdownToggle,     // Simple open/close state management for dropdowns // public for consistent toggle behavior
  useEditForm,           // Form editing state with field management // exported to share standardized form editing
  
  // UI and responsive hooks
  useIsMobile,           // Responsive design hook for mobile detection // public for consistent responsive checks
  useToast,              // Toast notification system with centralized state // exposed so components subscribe to toast updates
  toast,                 // Standalone toast function for imperative usage // public so non-hook code triggers notifications
  
  // Authentication and navigation
  useAuthRedirect,       // Authentication-based client-side routing // part of API to unify auth-based navigation
  
  // Utility functions
  showToast,             // Helper for displaying toast messages // public so notifications can be fired from any module
  toastSuccess,          // Success toast utility // exported for simple success messages
  toastError,            // Error toast utility // public so error toasts share formatting
  stopEvent,             // Event handling utility for preventing default behavior // kept public for generic DOM helpers
  getToastListenerCount, // Allows tests to inspect active toast listeners // exported to help verify toast state
  resetToastSystem,      // Clears toast listeners between tests // public to reset global state in tests
  dispatch,              // Expose dispatch for advanced control and tests // exported so consumers can trigger custom actions
  
  // API and HTTP functionality
  apiRequest,            // Standardized HTTP request wrapper with error handling // public so external code uses shared axios logic
  getQueryFn,            // React Query integration for server state management // exported to build queries with 401 handling
  queryClient,           // Pre-configured React Query client instance // public to reuse a single query client
  formatAxiosError,      // Error normalization for consistent error handling // exported to keep error objects uniform
  axiosClient            // Pre-configured axios instance with sensible defaults // public so consumers share axios configuration
}; // end consolidated export object
