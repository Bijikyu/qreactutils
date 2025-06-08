
/**
 * React hooks for common functionality
 */
const { useState, useCallback, useEffect } = require('react');
const { showToast, toastSuccess, toastError } = require('./utils');

/**
 * React hook for handling async actions with loading state
 * @param {Function} asyncFn - The async function to execute
 * @param {Object} options - Options object with onSuccess and onError callbacks
 * @returns {Array} Returns [run, isLoading] tuple
 */
function useAsyncAction(asyncFn, options) {
  console.log(`useAsyncAction is running with ${asyncFn}`);
  const [isLoading, setIsLoading] = useState(false);

  const run = useCallback(async (...args) => {
    console.log(`run is running with ${JSON.stringify(args)}`);
    try {
      setIsLoading(true);
      const result = await asyncFn(...args);
      console.log(`run is returning ${JSON.stringify(result)}`);
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      console.error(`run error`, error);
      options?.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFn, options]);

  console.log(`useAsyncAction is returning ${JSON.stringify(["run", isLoading])}`);
  return [run, isLoading];
}

/**
 * Generic dropdown data hook consolidating shared state logic
 * @param {Function} fetcher - Function that returns a Promise of array data
 * @param {Object} toast - Toast instance for error notifications
 * @param {Object} user - User object to trigger fetch when available
 * @returns {Object} Returns {items, isLoading, fetchData}
 */
function useDropdownData(fetcher, toast, user) {
  console.log(`useDropdownData is running with fetcher`);
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
      if (toast && toast.error) {
        toast.error(`Failed to load data.`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  console.log(`useDropdownData is returning ${JSON.stringify({ items, isLoading })}`);
  return { items, isLoading, fetchData };
}

/**
 * Factory producing typed hooks that delegate to useDropdownData
 * @param {Function} fetcher - Function that returns a Promise of array data
 * @returns {Function} Returns a custom hook function
 */
function createDropdownListHook(fetcher) {
  console.log(`createDropdownListHook is running with fetcher`);
  function useList(toast, user) {
    console.log(`useList is running with no params`);
    const result = useDropdownData(fetcher, toast, user);
    console.log(`useList is returning ${JSON.stringify(result)}`);
    return result;
  }
  console.log(`createDropdownListHook is returning ${useList}`);
  return useList;
}

/**
 * React hook for managing dropdown open/close state
 * @returns {Object} Returns {isOpen, toggleOpen, close}
 */
function useDropdownToggle() {
  console.log(`useDropdownToggle is running with no params`)
  const [isOpen, setIsOpen] = useState(false)

  function toggleOpen() {
    const newOpen = !isOpen
    console.log(`toggleOpen is running with ${isOpen}`)
    setIsOpen(newOpen)
    console.log(`toggleOpen has run resulting in a final value of ${newOpen}`)
  }

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
 * @param {Object} initialState - Initial form field values
 * @returns {Object} Returns {editingId, fields, setField, startEdit, cancelEdit}
 */
function useEditForm(initialState) {
  console.log(`useEditForm is running with ${JSON.stringify(initialState)}`);
  const [editingId, setEditingId] = useState(null);
  const [fields, setFields] = useState(initialState);

  function setField(key, value) {
    console.log(`setField is running with ${String(key)}, ${value}`);
    setFields((prev) => ({ ...prev, [key]: value }));
    console.log(`setField has run resulting in a final value of ${value}`);
  }

  function startEdit(item) {
    console.log(`startEdit is running with ${item._id}`);
    setEditingId(item._id);
    const newFields = { ...initialState };
    Object.keys(newFields).forEach((key) => {
      if (key in item) {
        newFields[key] = item[key];
      }
    });
    setFields(newFields);
    console.log(`startEdit has run resulting in a final value of ${item._id}`);
  }

  function cancelEdit() {
    console.log(`cancelEdit is running with no params`);
    setEditingId(null);
    setFields(initialState);
    console.log(`cancelEdit has run resulting in a final value of null`);
  }

  console.log(`useEditForm is returning state`);
  return { editingId, fields, setField, startEdit, cancelEdit };
}

// Detect mobile viewport sizes and provide responsive flag
const MOBILE_BREAKPOINT = 768;

/**
 * React hook for detecting mobile viewport sizes
 * Returns a boolean indicating whether the current window width falls under the MOBILE_BREAKPOINT
 * @returns {boolean} Returns true if viewport is mobile-sized, false otherwise
 */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

// Centralized toast management for consistent user notifications
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const toastTimeouts = new Map();

const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

const reducer = (state, action) => {
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
};

const listeners = [];
let memoryState = { toasts: [] };

function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function toast(props) {
  const id = genId();

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
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
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
  const [run, isLoading] = useAsyncAction(asyncFn, {
    onSuccess: async (result) => {
      toastSuccess(toast, successMsg);
      if (refresh) { 
        await refresh(); 
      }
      console.log(`useToastAction onSuccess returning ${JSON.stringify(result)}`);
      return result;
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : `Operation failed`;
      toastError(toast, msg);
    },
  });
  console.log(`useToastAction is returning ${JSON.stringify([run, isLoading])}`);
  return [run, isLoading];
}

/**
 * React hook for handling authentication-based redirects
 * @param {string} target - The target URL to redirect to
 * @param {boolean} condition - The condition that triggers the redirect
 */
function useAuthRedirect(target, condition) {
  console.log(`useAuthRedirect is running with ${target}, ${condition}`);
  
  const setLocation = (path) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
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

const { stopEvent } = require('./utils');
const { apiRequest, getQueryFn, queryClient, formatAxiosError, axiosClient } = require('./api');

module.exports = {
  useAsyncAction,
  useDropdownData,
  createDropdownListHook,
  useDropdownToggle,
  useEditForm,
  useIsMobile,
  useToast,
  toast,
  useToastAction,
  useAuthRedirect,
  showToast,
  stopEvent,
  apiRequest,
  getQueryFn,
  queryClient,
  formatAxiosError,
  axiosClient
};
