
const { QueryClient } = require("@tanstack/react-query");
const axios = require("axios");

/**
 * This module centralizes API access logic for the front end.
 * apiRequest standardizes axios calls with JSON & credential defaults.
 * getQueryFn creates a react-query QueryFunction that knows how to deal with 401s.
 * Example usage:
 *   const task = await apiRequest('/api/tasks', 'POST', { name: 't' });
 *   queryFn: getQueryFn({ on401: 'returnNull' })
 */

const axiosClient = axios.create({ 
  withCredentials: true, 
  headers: { "Content-Type": "application/json" } 
});

/**
 * Mock codexRequest function for offline mode handling
 * @param {Function} requestFn - The actual request function
 * @param {Object} mockResponse - Mock response for offline mode
 * @returns {Promise} Request result or mock response
 */
async function codexRequest(requestFn, mockResponse) {
  // In a real implementation, this would check if we're in Codex mode
  // For now, we'll just execute the actual request
  try {
    return await requestFn();
  } catch (err) {
    // In Codex mode, we might return the mock response
    // For now, we'll just rethrow the error
    throw err;
  }
}

/**
 * Normalize axios error into a standard Error object
 * @param {unknown} err - The error to format
 * @returns {Error} Formatted error object
 */
function formatAxiosError(err) {
  console.log(`formatAxiosError is running with ${err}`);
  try {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 500;
      const data = err.response?.data ?? err.message;
      const error = new Error(`${status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
      console.log(`formatAxiosError is returning ${error}`);
      return error;
    }
    console.log(`formatAxiosError is returning ${err}`);
    return err;
  } catch (error) {
    console.error('formatAxiosError error:', error);
    return err;
  }
}

/**
 * apiRequest wraps axios so all calls share cookies & json handling.
 * Example: const user = await apiRequest('/api/user', 'GET');
 * @param {string} url - The URL to request
 * @param {string} method - HTTP method (defaults to 'POST')
 * @param {unknown} data - Request body data
 * @returns {Promise} Response data
 */
async function apiRequest(url, method = 'POST', data) {
  console.log(`apiRequest is running with ${method} ${url}`);
  try {
    const response = await codexRequest(
      () => axiosClient.request({ url, method, data }),
      { data: { message: 'Mocked in Codex' } }
    );
    const result = response.data;
    console.log(`apiRequest is returning ${JSON.stringify(result)}`);
    return result;
  } catch (err) {
    console.error('apiRequest error:', err);
    throw formatAxiosError(err);
  }
}

/**
 * Create a React Query function that handles 401 errors gracefully
 * @param {Object} options - Configuration options
 * @param {string} options.on401 - How to handle 401 errors ('returnNull' or 'throw')
 * @returns {Function} QueryFunction for React Query
 */
function getQueryFn(options) {
  const { on401: unauthorizedBehavior } = options;
  
  return async ({ queryKey }) => {
    console.log(`getQueryFn inner is running with ${queryKey[0]}`);
    try {
      const res = await codexRequest(
        () => axiosClient.get(queryKey[0]),
        { status: 200, data: null }
      );
      if (unauthorizedBehavior === 'returnNull' && res.status === 401) {
        console.log(`getQueryFn inner is returning null`);
        return null;
      }
      const result = res.data;
      console.log(`getQueryFn inner is returning ${JSON.stringify(result)}`);
      return result;
    } catch (err) {
      if (
        unauthorizedBehavior === 'returnNull' &&
        axios.isAxiosError(err) &&
        err.response?.status === 401
      ) {
        console.log(`getQueryFn inner is returning null`);
        return null;
      }
      console.error('getQueryFn error:', err);
      throw formatAxiosError(err);
    }
  };
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

module.exports = {
  apiRequest,
  getQueryFn,
  queryClient,
  formatAxiosError,
  axiosClient
};
