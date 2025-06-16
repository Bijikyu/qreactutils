
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
const { useState, useCallback, useEffect, useMemo } = require('react'); // add useMemo for stable callback objects
const { useMutation, useQuery } = require('@tanstack/react-query'); // use React Query hooks for async operations
const { showToast, toastSuccess, toastError } = require('./utils'); // toast utilities for consistent notifications
const { isFunction } = require('./validation'); // import type guard for parameter validation

const { nanoid } = require('nanoid'); // use nanoid for unique IDs to avoid global counter
const { useMediaQuery } = require('react-responsive'); // simplified responsive hook


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
 * 
 * @param {Function} fetcher - Function that returns a Promise of array data
 * @param {Object} toast - Toast instance for error notifications
 * @param {Object} user - User object to trigger fetch when available
 * @returns {Object} Returns {items, isLoading, fetchData}
 */
function useDropdownData(fetcher, toastFn, user) {
  console.log(`useDropdownData is running with ${fetcher}`); // entry log for debugging
  if (!isFunction(fetcher)) { throw new Error('useDropdownData requires a function for `fetcher` parameter'); } // validate fetcher
  const queryKey = useMemo(() => ['dropdown', fetcher], [fetcher]); // stable key for React Query caching

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

  useEffect(() => { if (user) { fetchData(); } }, [user, fetchData, toastFn]); // run fetch after login; toastFn in deps causes refetch if a new toast is provided so errors show with new handler
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
  function setField(key, value) {
    console.log(`setField is running with ${key}:${value}`); // inner helper log
    setFields((prev) => ({ ...prev, [key]: value })); // merge new value to keep other fields intact
    console.log(`setField has run resulting in a final value of ${JSON.stringify(fields)}`); // final log
  }

  // Start editing an existing item by populating form fields with item data
  function startEdit(item) {
    console.log(`startEdit is running with ${JSON.stringify(item)}`); // log entry
    if (!item || !item._id) { // validate item presence before proceeding
      return; // exit early when item is missing or malformed
    }
    setEditingId(item._id); // track which row is currently editable
    
    // Start with initialState structure to ensure all expected fields are present
    const newFields = { ...initialState }; // start with default shape
    // Only copy properties that exist in both initialState and the item
    // This prevents unexpected fields from being added to the form
    Object.keys(newFields).forEach((key) => {
      if (key in item) { // copy only known keys to avoid accidental extras
        newFields[key] = item[key];
      }
    });
    setFields(newFields); // update state with sanitized item data
    console.log(`startEdit has run resulting in a final value of ${JSON.stringify(newFields)}`); // final log
  }

  // Cancel editing and reset form to initial state
  function cancelEdit() {
    console.log(`cancelEdit is running`); // entry log
    setEditingId(null); // no row in edit mode
    // Reset to initialState provides a clean slate, useful for both canceling edits
    // and preparing the form for creating new items
    setFields(initialState); // revert to default field values
    console.log(`cancelEdit has run resulting in a final value of ${JSON.stringify(initialState)}`); // final log
  }

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
 * React hook for detecting mobile viewport sizes.
 *
 * The react-responsive library simplifies media queries and handles
 * server-side rendering edge cases. We rely on its implementation to
 * manage event listeners and state internally.
 *
 * @returns {boolean} True if the viewport is narrower than the breakpoint
 */
function useIsMobile() {
  console.log(`useIsMobile is running`); // entry log for debugging
  if (typeof window === 'undefined') { // check for server environment so window access doesn't throw
    console.log(`useIsMobile is returning false`); // exit log for tracing when no window
    return false; // default to desktop view when window object is missing
  }
  const result = useMediaQuery({ maxWidth: MOBILE_BREAKPOINT - 1 }); // library returns boolean directly when browser is available
  console.log(`useIsMobile is returning ${result}`); // exit log for tracing
  return result; // boolean indicating viewport size
}

/**
 * Centralized toast notification system with global state management
 * 
 * This implementation provides a Redux-like pattern for managing toast notifications
 * across the entire application. The design addresses several key requirements:
 * 
 * 1. **Global State**: Toasts can be triggered from anywhere and displayed consistently
 * 2. **Memory Management**: Automatic cleanup prevents memory leaks from accumulated toasts
 * 3. **User Experience**: Limits number of toasts to prevent UI overwhelm
 * 4. **Flexibility**: Supports both imperative (toast()) and hook-based (useToast) usage
 */

/**
 * Maximum number of toasts to display simultaneously
 * 
 * Limited to 1 to prevent UI clutter and ensure users focus on the most recent
 * notification. Multiple toasts can be confusing and create visual noise.
 * New toasts replace older ones automatically. Most applications trigger many
 * toasts quickly; the single limit keeps the UI readable on small screens.
*/
const TOAST_LIMIT = 1; // limit toast stack to 1 so users only see most recent notification

/**
 * Delay before removing dismissed toasts from memory (in milliseconds)
 * 
 * Set to 1,000,000ms (16+ minutes) which is effectively permanent for typical
 * user sessions. This long delay ensures:
 * 1. Smooth animations have time to complete
 * 2. Toasts don't disappear unexpectedly during user interaction
 * 3. Memory usage remains minimal (only 1 toast at a time due to TOAST_LIMIT)
 *
 * In a production app, this might be shorter (1-5 seconds). The long default
 * keeps dismissed toasts available during debugging or demos.
*/
const TOAST_REMOVE_DELAY = 1000000; // keep toasts in memory long (ms) so animations finish during tests

/**
 * Action types for toast state management
 * 
 * Using constants prevents typos and makes the state management more predictable.
 * This follows Redux patterns for action type definition.
 */
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",           // Add a new toast to the display queue
  UPDATE_TOAST: "UPDATE_TOAST",     // Modify an existing toast's properties
  DISMISS_TOAST: "DISMISS_TOAST",   // Mark a toast as dismissed (starts removal process)
  REMOVE_TOAST: "REMOVE_TOAST",     // Actually remove toast from memory
};


/**
 * Global storage for toast removal timeouts
 *
 * Maps toast IDs to their timeout handles, allowing for:
 * 1. Canceling removal if toast is updated before timeout
 * 2. Preventing duplicate timeouts for the same toast
 * 3. Clean memory management by removing completed timeouts
 *    when their callbacks fire so the map does not keep growing
 */
const toastTimeouts = new Map(); // track removal timers per toast

const addToRemoveQueue = (toastId) => { // schedule toast removal after delay
  if (toastTimeouts.has(toastId)) {
    return; // duplicate calls are ignored to prevent multiple timers per toast
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId); // cleanup map to avoid memory growth during long sessions
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout); // remember timer so it can be cancelled
};

const reducer = (state, action) => { // state machine controlling toast lifecycle
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }; // new toast becomes first element and array trimmed to limit

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }; // update matching toast by id leaving others untouched

    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }; // mark targeted toast(s) closed so UI hides them
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }; // clear entire toast list when no id provided
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }; // drop toast with given id from list
    default:
      return state; // return current state for unknown actions so dispatch is resilient
  }
}; // pure function so state updates remain predictable

const listeners = new Set(); // components subscribe here to receive toast state updates without duplicates
let memoryState = { toasts: [] }; // simple in-memory store for global toast state

/**
 * Dispatch actions to the toast store and update subscribers
 *
 * The reducer ensures state transitions are predictable and easy to trace.
 * All listeners are called after each action so components using useToast
 * stay in sync with the latest toast list.
 *
 * @param {{type:string, toast?:Object, toastId?:string}} action - Toast action descriptor
 */
function dispatch(action) { // notify subscribers whenever toast state changes
  memoryState = reducer(memoryState, action); // apply update using reducer logic
  listeners.forEach((listener) => {
    listener(memoryState); // publish new state to all listeners
  }); // end loop over listeners
}

/**
 * Create a new toast in the global store
 *

 * Each toast receives a unique id from nanoid() so updates and dismisses

 * can target the specific toast later. The function dispatches an ADD_TOAST
 * action and exposes helpers for modification.
 *
 * @param {Object} props - Initial toast values
 * @returns {{id:string, dismiss:Function, update:Function}} Helpers for the toast
 */
function toast(props) {
  console.log(`toast is running with ${JSON.stringify(props)}`); // entry log for debugging
  const id = nanoid(); // unique identifier for this toast generated without global state

  const update = (props) => // modify toast content while preserving id
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id }); // helper for closing toast

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => { // callback when toast visibility changes
        if (!open) dismiss(); // auto-dismiss when closed by user
      },
    },
  });

  const result = {
    id: id,
    dismiss, // expose manual dismiss capability
    update,  // expose update method for toast content
  };
  console.log(`toast is returning ${JSON.stringify(result)}`); // exit log for tracing
  return result;
}

/**
 * React hook for managing toast notifications
 * @returns {Object} Returns toast state and helper functions
 */
function useToast() {
  console.log(`useToast is running`); // entry log for debugging
  const [state, setState] = useState(memoryState); // local copy of global state so component re-renders

  useEffect(() => { // subscribe component to global toast updates
    listeners.add(setState); // Set ensures unique listener per component
    return () => { // cleanup effect when component unmounts
      listeners.delete(setState); // remove listener on unmount
    };
  }, []);

  const result = {
    ...state,
    toast, // expose imperative toast creator
    dismiss: (toastId) => dispatch({ type: "DISMISS_TOAST", toastId }), // convenience wrapper
  };
  console.log(`useToast is returning ${JSON.stringify(result)}`); // exit log for tracing
  return result;
}

/**
 * Provide the number of active toast listeners for diagnostics
 *
 * Mainly used in tests to confirm components register/unregister
 * correctly. The Set above prevents duplicates so this count mirrors
 * actual subscriptions.
 */
function getToastListenerCount() {
  console.log(`getToastListenerCount is running`); // entry log
  const result = listeners.size; // count of subscribed components
  console.log(`getToastListenerCount is returning ${result}`); // exit log
  return result; // expose listener count for testing purposes
}

/**
 * Reset toast infrastructure between tests
 *
 * Clears listeners, timers, and in-memory state so each test starts
 * from a known baseline. Centralizing this cleanup avoids repetition.
 */
function resetToastSystem() {
  console.log(`resetToastSystem is running`); // entry log
  listeners.clear(); // remove all listeners for isolated tests
  memoryState = { toasts: [] }; // reset toast state
  toastTimeouts.forEach((timeout) => clearTimeout(timeout)); // cancel pending removals so no stray timers fire
  toastTimeouts.clear(); // drop handles to fully reset map
  console.log(`resetToastSystem has run resulting in a final value of ${JSON.stringify(memoryState)}`); // exit log
}

/**
 * React hook that combines async actions with toast notifications
 * @param {Function} asyncFn - The async operation to run
 * @param {string} successMsg - Message to show on success
 * @param {Function} refresh - Optional callback to refresh data
 * @returns {Array} Returns [run, isLoading] tuple
 */
function useToastAction(asyncFn, successMsg, refresh) {
  console.log(`useToastAction is running with ${asyncFn}`); // entry log for tracing
  const { toast } = useToast(); // acquire global toast dispatcher
  const callbacks = useMemo(
    () => ({ // memoize callbacks so reference stays stable
    onSuccess: async (result) => {
      toastSuccess(toast, successMsg); // trigger success toast with provided message
      if (refresh) { // optional refresh after success
        await refresh();
      }
      return result;
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : `Operation failed`;
      toastError(toast, msg); // show error toast with message
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

  useEffect(() => { // watch for condition changes to trigger redirect
    if (condition) {
      setLocation(target);
    }
  }, [condition, target]); // dependencies ensure effect runs when inputs change

  console.log(`useAuthRedirect has run resulting in a final value of undefined`); // exit log
}

const { stopEvent } = require('./utils'); // event helper utilities
const { apiRequest, getQueryFn, queryClient, formatAxiosError, axiosClient } = require('./api'); // API helpers and clients

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
  useIsMobile,         // viewport size detection // public for uniform responsive checks
  useToast,            // centralized toast store // exported so components can subscribe
  toast,               // imperative toast creator // public to trigger toasts outside hooks
  useToastAction,      // async action with toast integration // exported to reduce toast boilerplate
  useAuthRedirect,     // redirect based on auth state // public to standardize auth navigation
  showToast,           // lower-level toast helper // exposed so any code can display toasts
  toastSuccess,        // success toast utility // public for consistent success messages
  toastError,          // error toast utility // exported for uniform error messages
  stopEvent,           // preventDefault + stopPropagation // public utility used across modules
  apiRequest,          // axios wrapper // exported so external modules use shared request logic
  getQueryFn,          // React Query query helper // public to build queries with 401 support
  queryClient,         // shared query client // exported so apps reuse the same client
  formatAxiosError,    // convert axios errors to Error // public to keep error shape consistent
  axiosClient,         // configured axios instance // exported so consumers share defaults
  getToastListenerCount, // test helper exposing listener set size // public for introspection
  resetToastSystem,     // reset listeners and state between tests // exported to clear global state
  dispatch              // expose dispatch for tests to send custom actions // public for advanced usage
};
