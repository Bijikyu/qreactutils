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
  useAsyncAction,        // Primary hook for async operations with loading states // exported separately so consumers can tree-shake unused hooks
  useToastAction,        // Combination of async action with automatic toast notifications // keeps toast logic consistent across apps
  
  // Dropdown and form management hooks
  useDropdownData,       // Generic dropdown state management with async data fetching // provides standardised dropdown pattern
  createDropdownListHook,// Factory for creating typed dropdown hooks // export factory to customize dropdowns while reusing internals
  useDropdownToggle,     // Simple open/close state management for dropdowns // keeps local state isolated
  useEditForm,           // Form editing state with field management // unifies form logic across projects
  
  // UI and responsive hooks
  useIsMobile,           // Responsive design hook for mobile detection // avoids repeated media query logic in apps
  useToast,              // Toast notification system with centralized state // hook variant for React usage
  toast,                 // Standalone toast function for imperative usage // allows non-hook code to trigger notifications
  
  // Authentication and navigation
  useAuthRedirect,       // Authentication-based client-side routing // exported to standardize auth flows
  
  // Utility functions
  showToast,             // Helper for displaying toast messages // consistent entry point for notifications
  toastSuccess,          // Success toast utility // separate exports keep success/error semantics explicit
  toastError,            // Error toast utility // enables uniform error toasts across modules
  stopEvent,             // Event handling utility for preventing default behavior // small helper kept public for testing
  getToastListenerCount, // Allows tests to inspect active toast listeners // exported for monitoring toast system usage
  resetToastSystem,      // Clears toast listeners between tests // ensures clean slate in test environments
  dispatch,              // Expose dispatch for advanced control and tests // advanced consumers may replace dispatch implementation
  
  // API and HTTP functionality
  apiRequest,            // Standardized HTTP request wrapper with error handling // centralizing HTTP logic simplifies future swaps
  getQueryFn,            // React Query integration for server state management // exported so apps can use shared query function
  queryClient,           // Pre-configured React Query client instance // shared client ensures consistent caching behaviour
  formatAxiosError,      // Error normalization for consistent error handling // keeps error objects uniform across the library
  axiosClient            // Pre-configured axios instance with sensible defaults // leaving axios setup inside library reduces boilerplate
}; // end consolidated export object
