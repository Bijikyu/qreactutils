
/**
 * Main entry point for the npm module
 */
const { useState, useCallback, useEffect } = require('react');

/**
 * A simple example function
 * @param {string} name - The name to greet
 * @returns {string} A greeting message
 */
function greet(name) {
  return `Hello, ${name}!`;
}

/**
 * A utility function to capitalize text
 * @param {string} text - The text to capitalize
 * @returns {string} Capitalized text
 */
function capitalize(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

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

// Export functions for use as a module
module.exports = {
  greet,
  capitalize,
  useAsyncAction,
  useDropdownData,
  createDropdownListHook
};
