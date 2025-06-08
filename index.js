
/**
 * Main entry point for the npm module
 */
const { useState, useCallback } = require('react');

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

// Export functions for use as a module
module.exports = {
  greet,
  capitalize,
  useAsyncAction
};
