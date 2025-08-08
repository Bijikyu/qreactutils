/**
 * React hooks for common functionality
 * 
 * This module consolidates all React hooks and related functionality into a single importable unit.
 * The design philosophy emphasizes:
 * 1. Reusability across different React applications
 * 2. Consistent patterns for common UI operations (async actions, forms, dropdowns)
 * 3. Centralized state management for cross-cutting concerns (toasts, mobile detection)
 * 4. Integration with modern libraries (React Query, Axios) while maintaining flexibility
 * 
 * The hooks are designed to be composable and follow React best practices including:
 * - Proper dependency arrays for useEffect and useCallback
 * - Stable function references to prevent unnecessary re-renders
 * - Centralized state management where appropriate (toast system)
 * - Error handling and loading states as first-class concerns
 */
const { useState, useCallback, useEffect, useMemo, useRef } = require('react'); // add useRef for effect tracking
const { useMutation, useQuery } = require('@tanstack/react-query'); // use React Query hooks for async operations
const { showToast, toastSuccess, toastError } = require('./utils'); // toast utilities for consistent notifications
const { executeWithErrorToast, executeWithToastFeedback } = require('./toastIntegration'); // toast wrappers used outside hooks
const { isFunction, isObject, safeStringify, isAxiosErrorWithStatus } = require('./validation'); // import validation utilities
const { executeWithErrorHandling, executeSyncWithErrorHandling } = require('./errorHandling'); // import error handling utilities
const { cn } = require('./classNames'); // import class name merging utility
const { createSubTrigger, createContextMenuSubTrigger, createMenubarSubTrigger, LazyImagePreview } = require('./components'); // import component factories and lazy image component
const { useForm, useFormSubmission, formValidation, FormField, TextInputField, TextareaField, SelectField, CheckboxField } = require('./forms'); // import form utilities and components
const { useAdvancedToast, advancedToast, getAdvancedToastCount, clearAllAdvancedToasts, getAdvancedToastTimeoutCount, clearToastTimeout, subscribe: advancedToastSubscribe, getState: advancedToastGetState, reducer: advancedToastReducer, actionTypes: advancedToastActionTypes, dispatch: advancedToastDispatch } = require('./advancedToast'); // import advanced toast system
const { showSuccessToast, showErrorToast, showInfoToast, showWarningToast, showSuccess, showError, showInfo, showWarning } = require('./toastUtils'); // import toast utility functions

const { nanoid } = require('nanoid'); // use nanoid for unique IDs to avoid global counter
const { useMediaQuery: useMediaQueryTS } = require('usehooks-ts'); // media query hook from usehooks-ts
const { useMediaQuery } = require('react-responsive'); // responsive design hook
const { logger, log, logDebug, logError, logWarning, logHookEvent } = require('./logger.js');


/**
 * Helper function for managing loading state with async operations
 *
 * This helper standardizes the pattern of setting loading to true before
 * an async operation and false afterward, used by multiple hooks.
 *
 * Stability rationale: keeping this logic in a helper avoids re-defining
 * it in each hook which could lead to inconsistent state management. Using
 * a simple function means no external dependencies or additional hooks are
 * required, preserving stable references for calling hooks.
 *
 * Error-handling goal: wrapping the async operation ensures the loading
 * state is cleared in a finally block so consumers never get stuck in a
 * loading state if an error occurs. This approach keeps error propagation
 * intact without extra libraries.
 *
 * @param {Function} setIsLoading - State setter for loading boolean
 * @param {Function} asyncOperation - Async function to execute
 * @returns {*} Result of the async operation
 */
async function executeWithLoadingState(setIsLoading, asyncOperation) {
  console.log(`executeWithLoadingState is running with ${asyncOperation}`); // entry log for debugging
  try {
    setIsLoading(true); // indicate async task start for UI feedback
    const result = await asyncOperation(); // run caller provided operation
    console.log(`executeWithLoadingState is returning ${result}`); // exit log for tracing
    return result; // pass result to caller
  } finally {
    setIsLoading(false); // clear loading state even if errors occur
  }
}

/**
 * Helper function for creating useCallback with consistent error handling pattern
 *
 * Standardizes the pattern used across multiple hooks that need stable function
 * references with error handling and optional success/error callbacks.
 *
 * Stability rationale: by returning a memoized callback we guarantee that
 * dependent components only re-render when dependencies actually change. This
 * manual implementation avoids pulling in another library just for promise
 * handling and keeps the surface area small.
 *
 * Error-handling goal: wrapping the operation in a try/catch ensures
 * onError callbacks run when failures occur and that the original error is
 * re-thrown for upstream awareness. Awaiting the callbacks keeps the promise
 * chain predictable without extra dependencies.
 *
 * @param {Function} operation - The operation to wrap
 * @param {Object} callbacks - Object with onSuccess and onError callbacks
 * @param {Array} deps - Dependencies for useCallback
 * @returns {Function} Memoized callback with error handling
 */
function useStableCallbackWithHandlers(operation, callbacks, deps) {
  console.log(`useStableCallbackWithHandlers is running with ${operation}`); // entry log for debugging
  const cb = useCallback(async (...args) => { // memoized wrapper around operation
    try {
      const result = await operation(...args); // execute wrapped operation
      await callbacks?.onSuccess?.(result); // forward success to optional handler
      return result; // propagate result back to caller
    } catch (error) {
      await callbacks?.onError?.(error); // notify failure handler
      throw error; // rethrow so calling code can respond
    }
  }, deps); // dependencies control when callback identity changes
  console.log(`useStableCallbackWithHandlers is returning callback`); // exit log for tracing
  return cb; // return memoized callback to caller
}

/**
 * Custom hook for managing async state with loading and callbacks
 *
 * This extracts the common pattern of useState + useCallback + loading state
 * used by multiple hooks, while keeping each hook's specific logic separate.
 * Each hook maintains its own responsibility but shares this foundational pattern.
 *
 * Stability rationale: the returned 'run' function is memoized so child
 * components won't re-render unless the async function or callbacks change.
 * Using built-in hooks only avoids extra dependencies that might bloat the
 * bundle and introduces fewer points of failure.
 *
 * Error-handling goal: by internally using executeWithLoadingState and a
 * try/catch block we guarantee that loading is cleared and errors propagate
 * to the calling scope after optional callbacks run, matching the library's
 * standardized async pattern.
 *
 * @param {Function} asyncFn - The async function to wrap
 * @param {Object} options - Options with onSuccess and onError callbacks
 * @returns {Array} Returns [run, isLoading] tuple
 */
function useAsyncStateWithCallbacks(asyncFn, options) {
  console.log(`useAsyncStateWithCallbacks is running with ${asyncFn}`); // entry log for debugging
  const [isLoading, setIsLoading] = useState(false); // track async progress for UI

  const run = useCallback(async (...args) => { // memoized runner for asyncFn
    return executeWithLoadingState(setIsLoading, async () => { // ensure loading toggles correctly
      try {
        const result = await asyncFn(...args); // run provided async function
        await options?.onSuccess?.(result); // forward success to optional handler
        return result; // propagate result to caller
      } catch (error) {
        await options?.onError?.(error); // notify failure handler
        throw error; // rethrow so caller can handle
      }
    });
  }, [asyncFn, options]);
  console.log(`useAsyncStateWithCallbacks is returning run function and loading state ${isLoading}`); // exit log for debugging
  return [run, isLoading]; // provide tuple matching React conventions
}

/**
 * Helper function for creating callback with error handling
 *
 * This helper standardizes the pattern of useCallback with error handling,
 * used by multiple hooks that need stable function references.
 *
 * Stability rationale: implementing this logic ourselves keeps dependency
 * count low and ensures callbacks maintain the same identity across renders.
 * React's own hooks provide all the functionality needed without bringing in
 * another package.
 *
 * Error-handling goal: encapsulating the try/catch logic means each hook
 * using this helper automatically propagates errors after optional callbacks
 * run. This prevents silent failures and keeps error flows consistent across
 * the library.
 *
 * @param {Function} operation - Operation to wrap
 * @param {Object} options - Options with onSuccess and onError callbacks
 * @param {Array} deps - Dependencies for useCallback
 * @returns {Function} Memoized callback function
 */
function useCallbackWithErrorHandling(operation, options, deps) {
  console.log(`useCallbackWithErrorHandling is running with ${operation}`); // entry log for debugging
  const cb = useCallback(async (...args) => { // stable function with error handlers
    try {
      const result = await operation(...args); // run provided operation
      await options?.onSuccess?.(result); // notify success handler
      return result; // pass result back to caller
    } catch (error) {
      await options?.onError?.(error); // notify error handler
      throw error; // propagate failure
    }
  }, deps);
  console.log(`useCallbackWithErrorHandling is returning callback`); // exit log for tracing
  return cb; // return memoized callback
}

/**
 * React hook for handling async actions with loading state
 * 
 * This hook solves the extremely common pattern of needing to track loading state
 * while executing async operations (API calls, file uploads, etc.). Rather than
 * manually managing loading state in every component, this hook centralizes that logic.
 * 
 * Design decisions:
 * - Returns a tuple [run, isLoading] following React conventions (like useState)
 * - Uses useCallback to ensure the 'run' function has a stable reference, preventing
 *   unnecessary re-renders in child components that depend on it
 * - Includes both onSuccess and onError callbacks to allow for side effects
 * - Re-throws errors after calling onError, preserving the ability for calling code
 *   to handle errors as needed (e.g., for conditional rendering)
 * - Sets loading state in finally block to ensure it's always cleared, even if
 *   callbacks throw errors
 * 
 * @param {Function} asyncFn - The async function to execute
 * @param {Object} options - Options object with onSuccess and onError callbacks
 * @returns {Array} Returns [run, isLoading] tuple
 */
function useAsyncAction(asyncFn, options) {
  console.log(`useAsyncAction is running with ${asyncFn}`); // entry log for tracing
  const mutation = useMutation({ // React Query mutation manages loading and caching
    mutationFn: async (...args) => asyncFn(...args), // delegate to caller provided function
    onSuccess: async (res) => { await options?.onSuccess?.(res); }, // trigger optional success side effects
    onError: async (err) => { await options?.onError?.(err); } // notify optional error handler
  }, queryClient); // use shared query client for consistent cache

  const run = useCallback(
    (...args) => mutation.mutateAsync(...args), // call React Query mutation
    [mutation]
  ); // stable trigger so components avoid re-render
  console.log(`useAsyncAction is returning run and isPending ${mutation.isPending}`); // exit log for tracing
  return [run, mutation.isPending]; // expose loading state alongside runner
}

/**
 * Generic dropdown data hook consolidating shared state logic
 * 
 * This hook emerged from the pattern of having multiple dropdowns throughout an application
 * that all needed to fetch data from APIs, handle loading states, and show error messages.
 * Rather than duplicating this logic, this hook centralizes it.
 * 
 * Design rationale:
 * - Takes a 'fetcher' function rather than a URL to allow for complex API calls,
 *   authentication headers, data transformation, etc.
 * - Depends on a 'user' object to trigger fetching, implementing the common pattern
 *   where data should only be fetched after authentication is confirmed
 * - Returns both items and a manual fetchData function, allowing for both automatic
 *   loading and manual refresh capabilities
 * - Integrates with toast system for user-friendly error messaging
 * - Uses async/await with proper error handling and loading state management
 * - Cache key includes `fetcher.name` so React Query can serialize the key
 * 
 * @param {Function} fetcher - Function that returns a Promise of array data
 * @param {Object} toast - Toast instance for error notifications
 * @param {Object} user - User object to trigger fetch when available
 * @returns {Object} Returns {items, isLoading, fetchData}
 */
function useDropdownData(fetcher, toastFn, user) {
  console.log(`useDropdownData is running with ${fetcher}`); // entry log for debugging
  if (!isFunction(fetcher)) { throw new Error('useDropdownData requires a function for `fetcher` parameter'); } // validate fetcher
  const fetcherRef = useRef({ fn: null, id: null }); // persist unique id per fetcher across renders
  if (fetcherRef.current.fn !== fetcher) { fetcherRef.current = { fn: fetcher, id: fetcher.name || nanoid() }; } // new id when fetcher changes
  const stableId = fetcherRef.current.id; // cache key component derived from name or generated id
  const queryKey = useMemo(() => ['dropdown', stableId, user && user._id], [stableId, user && user._id]); // include user id so cache resets per user with stable id

  const { data, isPending } = useQuery({ // query remote data via React Query
    queryKey, // unique cache key so data persists across mounts
    queryFn: fetcher, // delegate network call to provided function
    enabled: !!user, // only run query when user is defined
    retry: false, // disable retries so dropdowns fail fast
    onError: () => { if (typeof toastFn === 'function') { toastError(toastFn, `Failed to load data.`); } } // toast on failure
  }, queryClient); // use shared query client for caching

  const fetchData = useCallback(
    () => queryClient.fetchQuery({ queryKey, queryFn: fetcher }), // manual refetch using React Query cache
    [queryKey, fetcher]
  ); // stable refetch function so callers can refresh

  const didMountRef = useRef(false); // track initial render to skip effect
  const prevUserRef = useRef(user); // remember last user to detect auth change
  const prevToastRef = useRef(toastFn); // remember last toast to detect handler change

  useEffect(() => {
    if (!didMountRef.current) { // skip effect on first run to avoid duplicate fetch
      didMountRef.current = true; // mark mount complete
      prevUserRef.current = user; // record initial user
      prevToastRef.current = toastFn; // record initial toast
      return; // exit without fetching
    }

    const userIdChanged = !!user && prevUserRef.current?._id !== user._id; // require user exists before checking id change
    const toastChanged = prevToastRef.current !== toastFn; // detect toast function swap for updates
    if (userIdChanged || toastChanged) { fetchData().catch(() => {}); } // refetch when user id or toast fn changed

    if (!user && prevUserRef.current) { // user logged out so clear cached data
      const prevKey = ['dropdown', fetcherRef.current.id, prevUserRef.current._id]; // use id to match queryKey preventing stale cache with anonymous fetcher
      queryClient.removeQueries({ queryKey: prevKey }); // drop stale cache tied to old user
      queryClient.setQueryData(queryKey, []); // ensure items state resets to empty array
    }

    prevUserRef.current = user; // update last user for next render
    prevToastRef.current = toastFn; // update last toast for next render
  }, [user, toastFn, fetchData, queryKey]); // dependencies ensure effect runs when inputs or key change
  console.log(`useDropdownData is returning items length ${(data ?? []).length}`); // exit log for debugging
  return { items: data ?? [], isLoading: isPending, fetchData }; // normalized return shape for consumers
}

/**
 * Factory producing typed hooks that delegate to useDropdownData
 * 
 * This factory function implements the "specialized hook" pattern, allowing applications
 * to create domain-specific hooks that encapsulate both the data fetching logic and
 * the specific API endpoint. This provides several benefits:
 * 
 * 1. Type safety: Each created hook can have its own TypeScript types
 * 2. Encapsulation: The fetcher function is closed over, hiding implementation details
 * 3. Reusability: The same hook can be used throughout the application
 * 4. Consistency: All dropdowns that use the same data source will behave identically
 * 
 * Example usage:
 *   const useUsersList = createDropdownListHook(() => apiRequest('/api/users', 'GET'));
 *   // Now useUsersList can be used like any other hook
 *
 * We close over the fetcher in the returned hook so consumers never have
 * to include it in dependency arrays, keeping callback references stable
 * and preventing unnecessary re-renders.
 * 
 * This pattern is particularly useful when you have multiple components that need
 * the same data but you want to avoid prop drilling or context complexity.
 * 
 * @param {Function} fetcher - Function that returns a Promise of array data
 * @returns {Function} Returns a custom hook function
 */
function createDropdownListHook(fetcher) {
  console.log(`createDropdownListHook is running with ${fetcher}`); // entry log for debugging

  // Return a custom hook that closes over the fetcher function
  // This creates a specialized version of useDropdownData for a specific data source
  function useList(toastFn, user) { // wrapper around generic hook
    console.log(`useList (from createDropdownListHook) is running with ${toastFn}`); // entry log for inner hook
    const result = useDropdownData(fetcher, toastFn, user); // reuse generic hook with fixed fetcher
    console.log(`useList (from createDropdownListHook) is returning ${JSON.stringify(result)}`); // exit log for inner hook
    return result; // forward result to caller
  }

  console.log(`createDropdownListHook is returning specialized hook`); // exit log for debugging
  return useList; // expose specialized hook
}

/**
 * React hook for managing dropdown open/close state
 * 
 * This simple hook encapsulates the extremely common pattern of toggling UI elements
 * open and closed. While it could be implemented inline with useState, extracting it
 * provides several benefits:
 * 
 * 1. Consistent naming across the application (isOpen, toggleOpen, close)
 * 2. Reduces boilerplate in components that need this functionality
 * 3. Provides a place to add common dropdown behaviors (e.g., close on outside click)
 * 4. Makes component logic more readable by abstracting the state management
 * 
 * The separate 'close' function (vs just toggleOpen) is provided because many
 * dropdowns need to close in response to specific events (clicking outside,
 * pressing escape, selecting an item) regardless of current state.
 * 
 * @returns {Object} Returns {isOpen, toggleOpen, close}
 */
function useDropdownToggle() {
  console.log(`useDropdownToggle is running`); // entry log for debugging
  // Default to false (closed) as dropdowns should start closed
  const [isOpen, setIsOpen] = useState(false) // track open state

  const toggleOpen = useCallback(
    () => setIsOpen(prev => !prev), // flip open/close state
    []
  ); // stays stable across renders

  // Explicit close function for cases where we need to close regardless of current state
  // This is common for escape key handlers, outside clicks, or after selection
  const close = useCallback(
    () => setIsOpen(false), // force closed state
    []
  ); // stable identity for event handlers

  const result = { isOpen, toggleOpen, close }; // gather return object for logging
  console.log(`useDropdownToggle is returning ${JSON.stringify(result)}`); // exit log for tracing
  return result; // API mirrors common hook patterns
}

/**
 * React hook for managing form editing state
 * 
 * This hook implements the common pattern of inline editing in lists or tables,
 * where users can click an "edit" button to switch a row from display mode to
 * edit mode. The hook manages:
 * 
 * 1. Which item is currently being edited (editingId)
 * 2. The current form field values (fields)
 * 3. Functions to start, cancel, and update the editing process
 * 
 * Design decisions:
 * - Uses an ID-based approach rather than index-based to handle dynamic lists
 * - Assumes items have an '_id' property (common in MongoDB/Mongoose applications)
 * - Starts with a copy of initialState and populates it with item data to ensure
 *   all expected fields are present even if the item is missing some properties
 * - Cancel resets to initialState rather than the original item values, providing
 *   a clean slate for potential new item creation
 * 
 * @param {Object} initialState - Initial form field values
 * @returns {Object} Returns {editingId, fields, setField, startEdit, cancelEdit}
 */
function useEditForm(initialState) {
  console.log(`useEditForm is running with ${JSON.stringify(initialState)}`); // entry log for debugging
  // editingId tracks which item is currently being edited; null means no item is being edited
  const [editingId, setEditingId] = useState(null); // identifier of item in edit mode
  // fields holds the current form values
  const [fields, setFields] = useState(initialState); // working copy of form fields

  // Individual field setter using functional update pattern to avoid stale closures
  const setField = useCallback((key, value) => {
    console.log(`setField is running with ${key}:${value}`); // log parameters for debugging
    setFields(prev => { const updated = { ...prev, [key]: value }; console.log(`setField has run resulting in a final value of ${JSON.stringify(updated)}`); return updated; }); // functional update keeps reference stable
  }, []); // no deps because setFields is stable

  // Start editing an existing item by populating form fields with item data
  const startEdit = useCallback((item) => {
    console.log(`startEdit is running with ${JSON.stringify(item)}`); // log entry
    if (!item || !item._id) { // validate item presence before proceeding
      return; // exit early when item is missing or malformed
    }
    setEditingId(item._id); // track which row is currently editable

    const newFields = { ...initialState }; // default shape ensures all fields
    Object.keys(newFields).forEach((key) => { if (key in item) { newFields[key] = item[key]; } }); // copy only known keys
    setFields(newFields); // update with sanitized data
    console.log(`startEdit has run resulting in a final value of ${JSON.stringify(newFields)}`); // final log
  }, [initialState]); // recreate when initialState changes

  // Cancel editing and reset form to initial state
  const cancelEdit = useCallback(() => {
    console.log(`cancelEdit is running`); // entry log
    setEditingId(null); // no row in edit mode
    setFields(initialState); // revert to default field values
    console.log(`cancelEdit has run resulting in a final value of ${JSON.stringify(initialState)}`); // final log
  }, [initialState]); // recreate when initialState changes

  const result = { editingId, fields, setField, startEdit, cancelEdit }; // gather return values
  console.log(`useEditForm is returning ${JSON.stringify(result)}`); // exit log
  return result; // expose editing controls to caller
}

/**
 * Mobile breakpoint threshold in pixels
 * 
 * 768px is chosen as the breakpoint because it represents the traditional boundary
 * between tablet and desktop layouts. This value aligns with:
 * - Bootstrap's default md breakpoint
 * - Common CSS framework conventions
 * - Typical tablet screen widths (iPad is 768px in portrait)
 * 
 * Having this as a constant ensures consistency across the application and makes
 * it easy to modify if design requirements change.
 */
const MOBILE_BREAKPOINT = 768; // 768px chosen to match common tablet breakpoint for consistent UX

/**
 * React hook for detecting mobile viewport sizes
 *
 * Uses react-responsive for robust media query handling with SSR support.
 * The 768px breakpoint aligns with common design system conventions and
 * represents the traditional boundary between mobile and tablet layouts.
 *
 * @returns {boolean} True if the viewport is narrower than 768px
 */
function useIsMobile() {
  console.log(`useIsMobile is running`); // entry log for debugging
  const queryOpts = { maxWidth: MOBILE_BREAKPOINT - 1 }; // settings for media query detection (767px)
  const deviceOpts = typeof window === 'undefined' ? { deviceWidth: MOBILE_BREAKPOINT } : undefined; // provide deviceWidth for SSR detection
  const result = useMediaQuery(queryOpts, deviceOpts); // react-responsive works in all environments using deviceWidth when window absent
  console.log(`useIsMobile is returning ${result}`); // exit log for tracing
  return result; // boolean indicating viewport size based on viewport or deviceWidth
}

/**
 * Advanced toast notification system integration
 * 
 * This section integrates the advanced toast system for comprehensive
 * notification management with state persistence, action dispatching,
 * and proper lifecycle handling.
 */

/**
 * React hook that combines async actions with advanced toast notifications
 * @param {Function} asyncFn - The async operation to run
 * @param {string} successMsg - Message to show on success
 * @param {Function} refresh - Optional callback to refresh data
 * @returns {Array} Returns [run, isLoading] tuple
 */
function useToastAction(asyncFn, successMsg, refresh) {
  console.log(`useToastAction is running with ${asyncFn}`); // entry log for tracing
  const { toast } = useAdvancedToast(); // acquire advanced toast dispatcher
  const callbacks = useMemo(
    () => ({ // memoize callbacks so reference stays stable
    onSuccess: async (result) => {
      toast({ // trigger success toast with provided message
        title: "Success",
        description: successMsg,
        variant: "success"
      });
      if (isFunction(refresh)) { // ensure refresh is callable to avoid runtime errors
        await refresh(); // run refresh callback after success when provided
      }
      return result;
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : `Operation failed`;
      toast({ // show error toast with message
        title: "Error",
        description: msg,
        variant: "error"
      });
    },
    }),
    [toast, successMsg, refresh]
  ); // recompute only when dependencies change
  const [run, isLoading] = useAsyncAction(asyncFn, callbacks); // wrap operation in library's loading pattern
  console.log(`useToastAction is returning run and loading ${isLoading}`); // exit log for tracing
  return [run, isLoading]; // result tuple for caller convenience
}

/**
 * React hook for handling authentication-based redirects
 * @param {string} target - The target URL to redirect to
 * @param {boolean} condition - The condition that triggers the redirect
 */
function useAuthRedirect(target, condition) { // redirect users when condition is met
  console.log(`useAuthRedirect is running with ${target} and condition ${condition}`); // entry log

  const setLocation = (path) => { // helper to abstract navigation differences
    if (typeof window !== 'undefined' && window.history && typeof window.history.pushState === 'function') { // prefer SPA navigation when available
      window.history.pushState({}, '', path); // update history state when pushState is available
      if (typeof PopStateEvent === 'function') { // ensure event constructor exists before dispatch
        window.dispatchEvent(new PopStateEvent('popstate')); // fire popstate event for SPA routing
      }
    } else if (typeof window !== 'undefined' && typeof window.location.assign === 'function') { // fallback to full page redirect when history API missing
      window.location.assign(path); // navigate using traditional redirect
    }
  };

  // useEffect with dependency array ensures the redirect logic runs only when
  // the condition or target actually changes, keeping the callback stable and
  // preventing redundant navigation attempts.
  useEffect(() => { // watch for condition changes to trigger redirect
    if (condition) {
      setLocation(target);
    }
  }, [condition, target]); // stable dependencies so redirect only fires when inputs change

  console.log(`useAuthRedirect has run resulting in a final value of undefined`); // exit log
}

// Import specialized modules
const { usePageFocus } = require('./accessibility'); // accessibility hooks
const { useSocket } = require('./socket'); // WebSocket communication hooks
const { stopEvent } = require('./dom'); // DOM utilities
const { apiRequest, getQueryFn, queryClient, formatAxiosError, axiosClient } = require('./api'); // API helpers and clients
const { parseVitestResults } = require('./testUtils'); // test result parsing utilities

module.exports = { // consolidated export for entire hooks library
  executeWithLoadingState, // async loading helper // exported for independent reuse
  useStableCallbackWithHandlers, // callback with handlers // exposed for advanced patterns
  useAsyncStateWithCallbacks, // async state hook with callbacks // public to share pattern
  useCallbackWithErrorHandling, // callback wrapper with error propagation // exported for external use
  useAsyncAction,      // hook for async operations // public to share async pattern
  useDropdownData,     // manage dropdown state // exported so dropdown logic is reusable
  createDropdownListHook, // factory for typed dropdown hooks // public to allow custom dropdowns
  useDropdownToggle,   // open/close state for dropdowns // exported for consistent toggle handling
  useEditForm,         // inline form editing helper // public so forms share standard editing
  useIsMobile,         // viewport size detection using react-responsive // public for uniform responsive checks
  useToastAction,      // async action with advanced toast integration // exported to reduce toast boilerplate
  useAuthRedirect,     // redirect based on auth state // public to standardize auth navigation
  usePageFocus,        // accessibility focus management for route changes // exported for keyboard navigation
  useSocket,           // WebSocket communication for payments and usage // exported for real-time updates
  isFunction,          // type guard for function validation // exported for callback verification
  isObject,            // type guard for object validation // exported for safe property access
  safeStringify,       // safe JSON stringify with circular handling // exported for consistent logging
  isAxiosErrorWithStatus, // axios error status checker // exported for HTTP error handling
  executeWithErrorHandling, // async error handling wrapper // exported for consistent async error patterns
  executeSyncWithErrorHandling, // sync error handling wrapper // exported for consistent sync error patterns
  cn,                      // class name merger with Tailwind conflict resolution // exported for component styling
  createSubTrigger,        // generic sub-trigger component factory // exported for UI component creation
  createContextMenuSubTrigger, // context menu sub-trigger factory // exported for context menu components
  createMenubarSubTrigger, // menubar sub-trigger factory // exported for menubar components
  LazyImagePreview,        // lazy loading image component with shimmer animation // exported for optimized image loading
  useForm,             // form state management hook // exported for form handling
  useFormSubmission,   // form submission hook with loading and error handling // exported for async form submissions
  formValidation,      // form validation utility functions // exported for field validation
  FormField,           // base form field wrapper component // exported for custom field creation
  TextInputField,      // styled text input field component // exported for text inputs
  TextareaField,       // styled textarea field component // exported for multi-line inputs
  SelectField,         // styled select dropdown field component // exported for dropdown inputs
  CheckboxField,       // styled checkbox field component // exported for boolean inputs
  useAdvancedToast,    // advanced toast notification system hook // exported for comprehensive toast management
  advancedToast,       // imperative advanced toast creation // exported for programmatic toast notifications
  getAdvancedToastCount, // get active advanced toast count // exported for testing and debugging
  clearAllAdvancedToasts, // clear all advanced toasts // exported for cleanup
  getAdvancedToastTimeoutCount, // get advanced toast timeout count // exported for testing
  clearToastTimeout,     // clear specific toast timeout // exported for manual timeout cancellation
  toastSubscribe: advancedToastSubscribe, // subscribe to toast state changes // exported for custom integrations
  toastGetState: advancedToastGetState, // get current toast state // exported for direct state access
  toastReducer: advancedToastReducer, // toast state reducer // exported as toastReducer from advancedToast module
  toastActionTypes: advancedToastActionTypes, // toast action types // exported as toastActionTypes from advancedToast module
  toastDispatch: advancedToastDispatch, // toast dispatch function // exported as toastDispatch from advancedToast module
  showSuccessToast,    // explicit success toast utility // exported for detailed success notifications
  showErrorToast,      // explicit error toast utility // exported for detailed error notifications
  showInfoToast,       // explicit info toast utility // exported for detailed informational notifications
  showWarningToast,    // explicit warning toast utility // exported for detailed warning notifications
  showSuccess,         // convenience success toast utility // exported for simple success notifications
  showError,           // convenience error toast utility // exported for simple error notifications
  showInfo,            // convenience info toast utility // exported for simple informational notifications
  showWarning,         // convenience warning toast utility // exported for simple warning notifications
  stopEvent,           // preventDefault + stopPropagation // public utility used across modules
  showToast,           // basic toast creator // exported from utils module
  toastSuccess,        // success toast utility // exported from utils module
  toastError,          // error toast utility // exported from utils module
  apiRequest,          // axios wrapper // exported so external modules use shared request logic
  getQueryFn,          // React Query query helper // public to build queries with 401 support
  queryClient,         // shared query client // exported so apps reuse the same client
  formatAxiosError,    // convert axios errors to Error // public to keep error shape consistent
  axiosClient,         // configured axios instance // exported so consumers share defaults
  // Logging utilities
  logger,
  log,
  logDebug,
  logError,
  logWarning,
  logHookEvent,
  
  // Test utilities
  parseVitestResults        // vitest output parsing utility // exported for test result processing
};