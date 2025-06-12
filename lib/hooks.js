
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
const { showToast, toastSuccess, toastError } = require('./utils');
const { isFunction } = require('./validation'); // import type guard for parameter validation

/**
 * Helper function for managing loading state with async operations
 * 
 * This helper standardizes the pattern of setting loading to true before
 * an async operation and false afterward, used by multiple hooks.
 * 
 * @param {Function} setIsLoading - State setter for loading boolean
 * @param {Function} asyncOperation - Async function to execute
 * @returns {*} Result of the async operation
 */
async function executeWithLoadingState(setIsLoading, asyncOperation) {
  try {
    setIsLoading(true);
    return await asyncOperation();
  } finally {
    setIsLoading(false);
  }
}

/**
 * Helper function for creating useCallback with consistent error handling pattern
 * 
 * Standardizes the pattern used across multiple hooks that need stable function
 * references with error handling and optional success/error callbacks.
 * 
 * @param {Function} operation - The operation to wrap
 * @param {Object} callbacks - Object with onSuccess and onError callbacks
 * @param {Array} deps - Dependencies for useCallback
 * @returns {Function} Memoized callback with error handling
 */
function useStableCallbackWithHandlers(operation, callbacks, deps) {
  return useCallback(async (...args) => {
    try {
      const result = await operation(...args);
      await callbacks?.onSuccess?.(result); // await async callbacks so errors propagate
      return result;
    } catch (error) {
      await callbacks?.onError?.(error); // await ensures rejection bubbles up
      throw error;
    }
  }, deps);
}

/**
 * Custom hook for managing async state with loading and callbacks
 * 
 * This extracts the common pattern of useState + useCallback + loading state
 * used by multiple hooks, while keeping each hook's specific logic separate.
 * Each hook maintains its own responsibility but shares this foundational pattern.
 * 
 * @param {Function} asyncFn - The async function to wrap
 * @param {Object} options - Options with onSuccess and onError callbacks
 * @returns {Array} Returns [run, isLoading] tuple
 */
function useAsyncStateWithCallbacks(asyncFn, options) {
  const [isLoading, setIsLoading] = useState(false);

  const run = useCallback(async (...args) => {
    return executeWithLoadingState(setIsLoading, async () => {
      try {
        const result = await asyncFn(...args);
        await options?.onSuccess?.(result); // await async callbacks for proper chaining
        return result;
      } catch (error) {
        await options?.onError?.(error); // await ensures promise rejections propagate
        throw error;
      }
    });
  }, [asyncFn, options]);

  return [run, isLoading];
}

/**
 * Helper function for creating callback with error handling
 * 
 * This helper standardizes the pattern of useCallback with error handling,
 * used by multiple hooks that need stable function references.
 * 
 * @param {Function} operation - Operation to wrap
 * @param {Object} options - Options with onSuccess and onError callbacks
 * @param {Array} deps - Dependencies for useCallback
 * @returns {Function} Memoized callback function
 */
function useCallbackWithErrorHandling(operation, options, deps) {
  return useCallback(async (...args) => {
    try {
      const result = await operation(...args);
      await options?.onSuccess?.(result); // await allows async callbacks
      return result;
    } catch (error) {
      await options?.onError?.(error); // await ensures error callbacks can reject
      throw error;
    }
  }, deps);
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
  console.log(`useAsyncAction is running with ${asyncFn}`);
  const [isLoading, setIsLoading] = useState(false);

  // useCallback ensures the returned function has a stable reference across re-renders
  // This prevents child components from re-rendering unnecessarily when they depend on this function
  const run = useCallback(async (...args) => {
    console.log(`run is running with ${JSON.stringify(args)}`);
    try {
      setIsLoading(true);
      const result = await asyncFn(...args);
      console.log(`run is returning ${JSON.stringify(result)}`);
      // Optional chaining used here because callbacks are optional
      // onSuccess is called with the result, allowing for data processing or UI updates
      await options?.onSuccess?.(result); // await to support async callbacks propagating failures
      return result;
    } catch (error) {
      console.error(`run error`, error);
      // onError callback allows for centralized error handling (e.g., showing toasts)
      await options?.onError?.(error); // await async error handling to bubble up
      // Re-throw to allow calling code to handle the error if needed
      throw error;
    } finally {
      // Finally block ensures loading state is always cleared, even if callbacks throw
      setIsLoading(false);
    }
  }, [asyncFn, options]); // Dependencies ensure the callback updates when these change

  console.log(`useAsyncAction is returning ${JSON.stringify(["run", isLoading])}`);
  return [run, isLoading];
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
function useDropdownData(fetcher, toast, user) {
  console.log(`useDropdownData is running with fetcher`);
  if (!isFunction(fetcher)) { throw new Error('useDropdownData requires a function for `fetcher` parameter'); } // early validation prevents runtime errors
  // Initialize with empty array to ensure components can safely map over items immediately
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  async function fetchData() {
    console.log(`fetchData is running with no params`);
    try {
      setIsLoading(true);
      const data = await fetcher();
      console.log(`fetchData is returning ${JSON.stringify(data)}`);
      setItems(data);
    } catch (error) {
      console.error('fetchData error:', error);
      // Optional chaining used because toast integration is optional
      // This allows the hook to work even when toast system isn't available
      if (toast && toast.error) {
        toast.error(`Failed to load data.`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Effect runs when user changes - this implements the pattern where
  // we only fetch data after user authentication is confirmed
  useEffect(() => { // redirect when condition changes
    if (user) {
      fetchData();
    }
  }, [user, fetcher, toast]); // ensure refetch when dependencies change

  console.log(`useDropdownData is returning ${JSON.stringify({ items, isLoading })}`);
  return { items, isLoading, fetchData };
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
  console.log(`createDropdownListHook is running with fetcher`);
  
  // Return a custom hook that closes over the fetcher function
  // This creates a specialized version of useDropdownData for a specific data source
  function useList(toast, user) {
    console.log(`useList is running with no params`);
    // Delegate to the generic useDropdownData hook with the pre-bound fetcher
    const result = useDropdownData(fetcher, toast, user);
    console.log(`useList is returning ${JSON.stringify(result)}`);
    return result;
  }
  
  console.log(`createDropdownListHook is returning ${useList}`);
  return useList;
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
  console.log(`useDropdownToggle is running with no params`)
  // Default to false (closed) as dropdowns should start closed
  const [isOpen, setIsOpen] = useState(false)

  function toggleOpen() {
    console.log(`toggleOpen is running with ${isOpen}`)
    setIsOpen(v => { const next = !v; console.log(`toggleOpen has run resulting in a final value of ${next}`); return next; }) // functional update prevents stale closure when rapidly toggling
  }

  // Explicit close function for cases where we need to close regardless of current state
  // This is common for escape key handlers, outside clicks, or after selection
  function close() {
    console.log(`close is running with no params`)
    setIsOpen(false)
    console.log(`close has run resulting in a final value of false`)
  }

  console.log(`useDropdownToggle is returning ${JSON.stringify({ isOpen })}`)
  return { isOpen, toggleOpen, close }
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
  console.log(`useEditForm is running with ${JSON.stringify(initialState)}`);
  // editingId tracks which item is currently being edited; null means no item is being edited
  const [editingId, setEditingId] = useState(null);
  // fields holds the current form values
  const [fields, setFields] = useState(initialState);

  // Individual field setter using functional update pattern to avoid stale closures
  function setField(key, value) {
    console.log(`setField is running with ${String(key)}, ${value}`);
    setFields((prev) => ({ ...prev, [key]: value }));
    console.log(`setField has run resulting in a final value of ${value}`);
  }

  // Start editing an existing item by populating form fields with item data
  function startEdit(item) {
    console.log(`startEdit is running with ${item._id}`);
    setEditingId(item._id);
    
    // Start with initialState structure to ensure all expected fields are present
    const newFields = { ...initialState };
    // Only copy properties that exist in both initialState and the item
    // This prevents unexpected fields from being added to the form
    Object.keys(newFields).forEach((key) => {
      if (key in item) {
        newFields[key] = item[key];
      }
    });
    setFields(newFields);
    console.log(`startEdit has run resulting in a final value of ${item._id}`);
  }

  // Cancel editing and reset form to initial state
  function cancelEdit() {
    console.log(`cancelEdit is running with no params`);
    setEditingId(null);
    // Reset to initialState provides a clean slate, useful for both canceling edits
    // and preparing the form for creating new items
    setFields(initialState);
    console.log(`cancelEdit has run resulting in a final value of null`);
  }

  console.log(`useEditForm is returning state`);
  return { editingId, fields, setField, startEdit, cancelEdit };
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
const MOBILE_BREAKPOINT = 768;

/**
 * React hook for detecting mobile viewport sizes with responsive behavior
 * 
 * This hook provides a reliable way to detect mobile viewports and respond to
 * viewport changes. It's designed to handle several important considerations:
 * 
 * 1. **Performance**: Uses matchMedia instead of resize listeners for better performance
 * 2. **SSR Safety**: Initializes with undefined to prevent hydration mismatches
 * 3. **Cleanup**: Properly removes event listeners to prevent memory leaks
 * 4. **Immediate Detection**: Sets initial state on mount, not just on changes
 * 
 * Design decisions:
 * - Uses window.matchMedia for efficiency and native browser optimization
 * - Double-checks with window.innerWidth to ensure accuracy
 * - Returns boolean true/false rather than undefined after initial load
 * - Uses max-width media query (768px - 1 = 767px) to avoid overlap
 * 
 * The hook handles the common pattern where mobile layouts need different
 * component behavior, CSS classes, or rendering logic.
 * 
 * @returns {boolean} Returns true if viewport is mobile-sized, false otherwise
 */
function useIsMobile() {
  console.log(`useIsMobile is running with none`); // log invocation for debugging
  // Initialize with undefined to prevent SSR/hydration mismatches
  // This will be set to the correct value immediately after mount
  const [isMobile, setIsMobile] = useState(undefined);

  useEffect(() => {
    if (typeof window === 'undefined') return; // skip effect when window absent
    // Create media query list for mobile breakpoint
    // Using max-width ensures no overlap between mobile and desktop states
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Handler function that updates state based on current window width
    // Uses window.innerWidth rather than mql.matches for more precise control
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Add listener for media query changes (orientation changes, window resizing)
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange); // modern browsers support addEventListener
    } else if (mql.addListener) {
      mql.addListener(onChange); // fallback for older browsers without addEventListener
    }
    
    // Set initial state immediately on mount
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    
    // Cleanup function to prevent memory leaks
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", onChange); // remove modern listener if present
      } else if (mql.removeListener) {
        mql.removeListener(onChange); // fallback removal for addListener
      }
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Convert to boolean to ensure consistent return type
  // !! converts undefined to false, which is appropriate for SSR scenarios
  console.log(`useIsMobile is returning ${!!isMobile}`); // log return value for traceability
  return !!isMobile;
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
 * New toasts replace older ones automatically.
 */
const TOAST_LIMIT = 1;

/**
 * Delay before removing dismissed toasts from memory (in milliseconds)
 * 
 * Set to 1,000,000ms (16+ minutes) which is effectively permanent for typical
 * user sessions. This long delay ensures:
 * 1. Smooth animations have time to complete
 * 2. Toasts don't disappear unexpectedly during user interaction
 * 3. Memory usage remains minimal (only 1 toast at a time due to TOAST_LIMIT)
 * 
 * In a production app, this might be shorter (1-5 seconds).
 */
const TOAST_REMOVE_DELAY = 1000000;

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
 * Global counter for generating unique toast IDs
 * 
 * Simple incrementing counter that wraps at MAX_SAFE_INTEGER to prevent overflow.
 * Using a global counter ensures uniqueness across all toast instances.
 */
let count = 0;

/**
 * Generate unique toast identifiers
 * 
 * Creates sequential IDs for toasts. The modulo operation prevents integer overflow
 * in long-running applications, though it's unlikely to be reached in practice.
 * 
 * @returns {string} Unique identifier for a toast
 */
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

/**
 * Global storage for toast removal timeouts
 * 
 * Maps toast IDs to their timeout handles, allowing for:
 * 1. Canceling removal if toast is updated before timeout
 * 2. Preventing duplicate timeouts for the same toast
 * 3. Clean memory management by removing completed timeouts
 */
const toastTimeouts = new Map();

const addToRemoveQueue = (toastId) => { // schedule toast removal after delay
  if (toastTimeouts.has(toastId)) {
    return; // duplicate calls are ignored to avoid multiple timers
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
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
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

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
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
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
  });
}

/**
 * Create a new toast in the global store
 *
 * Each toast receives a sequential id from genId() so updates and dismisses
 * can target the specific toast later. The function dispatches an ADD_TOAST
 * action and exposes helpers for modification.
 *
 * @param {Object} props - Initial toast values
 * @returns {{id:string, dismiss:Function, update:Function}} Helpers for the toast
 */
function toast(props) {
  const id = genId(); // unique identifier for this toast

  const update = (props) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}

/**
 * React hook for managing toast notifications
 * @returns {Object} Returns toast state and helper functions
 */
function useToast() {
  const [state, setState] = useState(memoryState);

  useEffect(() => {
    listeners.add(setState); // Set ensures unique listener per component
    return () => {
      listeners.delete(setState); // remove listener on unmount
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

function getToastListenerCount() {
  return listeners.size; // expose listener count for testing purposes
}

function resetToastSystem() {
  listeners.clear(); // remove all listeners for isolated tests
  memoryState = { toasts: [] }; // reset toast state
  toastTimeouts.forEach((timeout) => clearTimeout(timeout)); // cancel pending removals so no stray timers fire
  toastTimeouts.clear(); // drop handles to fully reset map
  count = 0; // reset id counter so toast ids restart from 1 after system reset
}

/**
 * React hook that combines async actions with toast notifications
 * @param {Function} asyncFn - The async operation to run
 * @param {string} successMsg - Message to show on success
 * @param {Function} refresh - Optional callback to refresh data
 * @returns {Array} Returns [run, isLoading] tuple
 */
function useToastAction(asyncFn, successMsg, refresh) {
  console.log(`useToastAction is running with ${asyncFn}, ${successMsg}`);
  const { toast } = useToast();
  const callbacks = useMemo(() => ({
    onSuccess: async (result) => {
      toastSuccess(toast, successMsg); // trigger success toast with provided message
      if (refresh) { // optional refresh after success
        await refresh();
      }
      console.log(`useToastAction onSuccess returning ${JSON.stringify(result)}`);
      return result;
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : `Operation failed`;
      toastError(toast, msg); // show error toast with message
    },
  }), [toast, successMsg, refresh]); // memoize callbacks so useAsyncAction gets stable reference
  const [run, isLoading] = useAsyncAction(asyncFn, callbacks); // stable callbacks keep run stable
  console.log(`useToastAction is returning ${JSON.stringify([run, isLoading])}`);
  return [run, isLoading];
}

/**
 * React hook for handling authentication-based redirects
 * @param {string} target - The target URL to redirect to
 * @param {boolean} condition - The condition that triggers the redirect
 */
function useAuthRedirect(target, condition) { // redirect users when condition is met
  console.log(`useAuthRedirect is running with ${target}, ${condition}`);
  
  const setLocation = (path) => { // push location state for SPAs when supported
    if (typeof window !== 'undefined' && window.history && typeof window.history.pushState === 'function') { // verify history API exists before navigation
      window.history.pushState({}, '', path); // update history state when pushState is available
      if (typeof PopStateEvent === 'function') { // ensure event constructor exists before dispatch
        window.dispatchEvent(new PopStateEvent('popstate')); // fire popstate event for SPA routing
      }
    }
  };

  useEffect(() => {
    console.log(`useAuthRedirect effect is running with ${condition}`);
    if (condition) {
      setLocation(target);
      console.log(`useAuthRedirect is returning redirect to ${target}`);
    }
  }, [condition, target]);

  console.log(`useAuthRedirect has run resulting in a final value of no return`);
}

const { stopEvent } = require('./utils'); // event helper utilities
const { apiRequest, getQueryFn, queryClient, formatAxiosError, axiosClient } = require('./api'); // API helpers and clients

module.exports = {
  useAsyncAction,      // hook for async operations
  useDropdownData,     // manage dropdown state
  createDropdownListHook, // factory for typed dropdown hooks
  useDropdownToggle,   // open/close state for dropdowns
  useEditForm,         // inline form editing helper
  useIsMobile,         // viewport size detection
  useToast,            // centralized toast store
  toast,               // imperative toast creator
  useToastAction,      // async action with toast integration
  useAuthRedirect,     // redirect based on auth state
  showToast,           // lower-level toast helper
  stopEvent,           // preventDefault + stopPropagation
  apiRequest,          // axios wrapper
  getQueryFn,          // React Query query helper
  queryClient,         // shared query client
  formatAxiosError,    // convert axios errors to Error
  axiosClient,         // configured axios instance
  getToastListenerCount, // test helper exposing listener set size
  resetToastSystem      // reset listeners and state between tests
}; 
