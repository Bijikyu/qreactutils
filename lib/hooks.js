
/**
 * React hooks for common functionality
 */
const { useState, useCallback, useEffect } = require('react');

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

module.exports = {
  useAsyncAction,
  useDropdownData,
  createDropdownListHook,
  useDropdownToggle,
  useEditForm
};
