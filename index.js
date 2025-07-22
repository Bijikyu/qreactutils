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
  useEditForm, useIsMobile, useToastAction, useAuthRedirect, usePageFocus, useSocket, // UI-related helpers // centralizing UI hooks prevents scattered imports
  stopEvent, apiRequest, getQueryFn, queryClient, formatAxiosError, axiosClient, // core API utilities // exposes internal tools in one shot for clarity
  isFunction, isObject, safeStringify, isAxiosErrorWithStatus, executeWithErrorHandling, executeSyncWithErrorHandling, cn, createSubTrigger, createContextMenuSubTrigger, createMenubarSubTrigger, useForm, useFormSubmission, formValidation, FormField, TextInputField, TextareaField, SelectField, CheckboxField, useAdvancedToast, advancedToast, getAdvancedToastCount, clearAllAdvancedToasts, getAdvancedToastTimeoutCount, toastReducer, toastActionTypes, toastDispatch // validation, error handling, styling, component, form and advanced toast utilities // imported for external use
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
  
  // Authentication and navigation
  useAuthRedirect,       // Authentication-based client-side routing // part of API to unify auth-based navigation // ensures unauthorized users are routed consistently
  
  // Accessibility and focus management
  usePageFocus,          // Keyboard focus management for route changes // public for accessibility compliance // automatically focuses main content for screen readers
  
  // Real-time communication
  useSocket,             // WebSocket communication for payment outcomes and usage updates // public for real-time data integration // manages Socket.IO connections with automatic cleanup
  
  // Utility functions
  stopEvent,             // Event handling utility for preventing default behavior // kept public for generic DOM helpers // quick DOM helper for forms
  
  // Validation and type checking utilities
  isFunction,            // Type guard for function validation // public for callback verification across apps // prevents runtime type errors
  isObject,              // Type guard for object validation // exported for safe property access // avoids null reference errors
  safeStringify,         // Safe JSON stringify with circular reference handling // public for consistent logging // prevents JSON.stringify errors
  isAxiosErrorWithStatus,// Axios error status checker // exported for HTTP error handling // simplifies status code branching
  
  // Error handling utilities
  executeWithErrorHandling, // Async error handling wrapper // public for consistent async error patterns // standardizes error logging and transformation
  executeSyncWithErrorHandling, // Sync error handling wrapper // exported for consistent sync error patterns // unifies error handling across sync operations
  
  // Styling utilities
  cn,                    // Class name merger with Tailwind conflict resolution // public for component styling // merges classes while resolving Tailwind conflicts
  
  // Component factories
  createSubTrigger,      // Generic sub-trigger component factory // public for creating reusable UI components // generates components with chevron icons
  createContextMenuSubTrigger, // Context menu sub-trigger factory // exported for context menu components // specialized factory for context menus
  createMenubarSubTrigger, // Menubar sub-trigger factory // exported for menubar components // specialized factory for menubars
  
  // Form utilities and components
  useForm,               // Form state management hook // public for controlled form inputs // handles change events and field updates
  useFormSubmission,     // Form submission hook with loading and error states // exported for async form handling // manages submission lifecycle
  formValidation,        // Form validation utility functions // public for field validation // provides common validation patterns
  FormField,             // Base form field wrapper component // exported for custom field creation // provides consistent label and spacing
  TextInputField,        // Styled text input field component // public for text inputs // includes label and consistent styling
  TextareaField,         // Styled textarea field component // exported for multi-line inputs // maintains design consistency
  SelectField,           // Styled select dropdown field component // public for dropdown inputs // handles options array rendering
  CheckboxField,         // Styled checkbox field component // exported for boolean inputs // provides accessible checkbox patterns
  
  // Advanced toast notification system
  useAdvancedToast,      // Advanced toast notification hook // public for comprehensive toast management // provides state management and lifecycle
  advancedToast,         // Imperative advanced toast creation // exported for programmatic notifications // returns control methods for updates
  getAdvancedToastCount, // Get active advanced toast count // public for testing and debugging // helps verify toast state
  clearAllAdvancedToasts, // Clear all advanced toasts // exported for cleanup and testing // resets toast state completely
  getAdvancedToastTimeoutCount, // Get advanced toast timeout count // public for testing timeout management // monitors pending removals
  toastReducer,          // Toast state reducer function // exported for custom implementations // handles all toast state transitions
  toastActionTypes,      // Toast action type constants // public for custom actions // defines all available action types
  toastDispatch,         // Toast dispatch function // exported for advanced control // allows direct state manipulation
  
  // API and HTTP functionality
  apiRequest,            // Standardized HTTP request wrapper with error handling // public so external code uses shared axios logic // centralizes axios with error conventions
  getQueryFn,            // React Query integration for server state management // exported to build queries with 401 handling // ensures 401s handled the same way
  queryClient,           // Pre-configured React Query client instance // public to reuse a single query client // avoids creating multiple clients per app
  formatAxiosError,      // Error normalization for consistent error handling // exported to keep error objects uniform // simplifies logging and user messages
  axiosClient            // Pre-configured axios instance with sensible defaults // public so consumers share axios configuration // shares same baseURL and credentials
}; // end consolidated export object
