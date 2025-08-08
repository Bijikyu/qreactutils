/**
 * Advanced Toast Notification System Module
 * 
 * This module provides a comprehensive toast notification system with
 * state management, action dispatching, and proper lifecycle handling.
 * Features include toast queuing, automatic removal, update capabilities,
 * and listener management for real-time UI updates.
 */

const React = require('react'); // React hooks for state management
const { useState, useEffect } = React;
const { nanoid } = require('nanoid'); // unique ID generation

// Toast configuration constants
const TOAST_LIMIT = 5; // maximum number of toasts to display
const TOAST_REMOVE_DELAY = 1000; // delay before removing dismissed toast (ms)

/**
 * Action types for toast state management
 * Defines all possible actions that can be dispatched to modify toast state
 */
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST", 
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
};

/**
 * Generate unique toast ID
 * @returns {string} Unique identifier for toast
 */
function genId() {
  return nanoid();
}

// Map to track toast removal timeouts
const toastTimeouts = new Map();

/**
 * Add toast to removal queue with delayed removal
 * Manages the lifecycle of dismissed toasts by scheduling their removal
 * after a delay to allow for exit animations.
 * 
 * @param {string} toastId - ID of toast to queue for removal
 */
const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    return; // already queued
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

/**
 * Clear toast timeout and remove from queue
 * Allows manual cancellation of scheduled toast removal.
 * Useful for immediate toast dismissal without waiting for timeout.
 * 
 * @param {string} toastId - ID of toast to clear timeout for
 */
function clearToastTimeout(toastId) {
  const timeout = toastTimeouts.get(toastId);
  if (timeout) {
    clearTimeout(timeout);
    toastTimeouts.delete(toastId);
  }
};

/**
 * Toast state reducer
 * Handles all toast state transitions based on dispatched actions.
 * Manages toast addition, updates, dismissal, and removal while
 * maintaining proper state immutability.
 * 
 * @param {Object} state - Current toast state
 * @param {Object} action - Action object with type and payload
 * @returns {Object} New toast state
 */
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

      // Side effect: Queue dismissed toasts for removal
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        // Dismiss all toasts
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
      
    default:
      return state;
  }
};

// Global state management
const listeners = []; // listeners for state changes
let memoryState = { toasts: [] }; // in-memory state

/**
 * Dispatch action to update toast state
 * Central dispatch function that applies actions to state and
 * notifies all listeners of state changes.
 * 
 * @param {Object} action - Action to dispatch
 */
function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

/**
 * Create and display a toast notification
 * 
 * Primary function for creating toast notifications with automatic
 * ID generation and state management. Returns control methods for
 * updating or dismissing the specific toast.
 * 
 * @param {Object} props - Toast properties
 * @param {React.ReactNode} props.title - Toast title
 * @param {React.ReactNode} props.description - Toast description
 * @param {string} props.variant - Toast variant (success, error, warning, info)
 * @param {React.ReactNode} props.action - Action element/button
 * @returns {Object} Toast control methods
 * 
 * @example
 * // Basic toast
 * const myToast = advancedToast({
 *   title: "Success",
 *   description: "Your changes have been saved.",
 *   variant: "success"
 * });
 * 
 * @example
 * // Toast with action
 * const actionToast = advancedToast({
 *   title: "Update Available",
 *   description: "A new version is available.",
 *   action: <Button onClick={() => update()}>Update</Button>
 * });
 * 
 * @example
 * // Update or dismiss toast
 * myToast.update({ description: "Updated message" });
 * myToast.dismiss();
 */
function advancedToast({ ...props }) {
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
 * Hook for managing toast notifications
 * 
 * React hook that provides access to the current toast state and
 * methods for creating and dismissing toasts. Automatically subscribes
 * to state changes and updates the component when toasts change.
 * 
 * @returns {Object} Toast state and control methods
 * @returns {Array} returns.toasts - Array of current toast objects
 * @returns {Function} returns.toast - Function to create new toast
 * @returns {Function} returns.dismiss - Function to dismiss toast(s)
 * 
 * @example
 * // In a React component
 * const { toasts, toast, dismiss } = useAdvancedToast();
 * 
 * const showSuccess = () => {
 *   toast({
 *     title: "Success!",
 *     description: "Operation completed successfully.",
 *     variant: "success"
 *   });
 * };
 * 
 * const dismissAll = () => dismiss(); // dismiss all toasts
 */
function useAdvancedToast() {
  const [state, setState] = useState(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast: advancedToast,
    dismiss: (toastId) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

/**
 * Get current toast count for testing/debugging
 * @returns {number} Number of active toasts
 */
function getAdvancedToastCount() {
  return memoryState.toasts.length;
}

/**
 * Clear all toasts (for testing/cleanup)
 */
function clearAllAdvancedToasts() {
  dispatch({ type: "REMOVE_TOAST" });
}

/**
 * Get timeout count for testing
 * @returns {number} Number of pending timeouts
 */
function getAdvancedToastTimeoutCount() {
  return toastTimeouts.size;
}

module.exports = {
  useAdvancedToast,      // main hook for toast management // exported for component integration
  advancedToast,         // imperative toast creation function // exported for programmatic toasts
  getAdvancedToastCount, // get active toast count // exported for testing and debugging
  clearAllAdvancedToasts, // clear all toasts // exported for cleanup and testing
  getAdvancedToastTimeoutCount, // get timeout count // exported for testing timeout management
  clearToastTimeout,     // clear specific toast timeout // exported for manual timeout cancellation
  reducer,               // toast state reducer // exported for custom implementations
  actionTypes,           // action type constants // exported for custom actions
  dispatch               // dispatch function // exported for advanced control
};