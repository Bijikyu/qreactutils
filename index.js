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
  useAsyncAction, useDropdownData, createDropdownListHook, useDropdownToggle, //(grab hook utilities)
  useEditForm, useIsMobile, useToast, toast, useToastAction, useAuthRedirect, //(grab UI helpers)
  showToast, stopEvent, apiRequest, getQueryFn, queryClient, formatAxiosError, axiosClient //(grab API utilities)
} = require('./lib/hooks'); // aggregated exports from internal modules

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
module.exports = { // expose library functions
  // Core async functionality hooks
  useAsyncAction,        // Primary hook for async operations with loading states
  useToastAction,        // Combination of async action with automatic toast notifications
  
  // Dropdown and form management hooks
  useDropdownData,       // Generic dropdown state management with async data fetching
  createDropdownListHook,// Factory for creating typed dropdown hooks
  useDropdownToggle,     // Simple open/close state management for dropdowns
  useEditForm,           // Form editing state with field management
  
  // UI and responsive hooks
  useIsMobile,           // Responsive design hook for mobile detection
  useToast,              // Toast notification system with centralized state
  toast,                 // Standalone toast function for imperative usage
  
  // Authentication and navigation
  useAuthRedirect,       // Authentication-based client-side routing
  
  // Utility functions
  showToast,             // Helper for displaying toast messages
  stopEvent,             // Event handling utility for preventing default behavior
  
  // API and HTTP functionality
  apiRequest,            // Standardized HTTP request wrapper with error handling
  getQueryFn,            // React Query integration for server state management
  queryClient,           // Pre-configured React Query client instance
  formatAxiosError,      // Error normalization for consistent error handling
  axiosClient            // Pre-configured axios instance with sensible defaults
}; // export object
