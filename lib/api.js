
const { QueryClient } = require("@tanstack/react-query");
const axios = require("axios");

/**
 * API Module: Centralized HTTP Request Management and React Query Integration
 * 
 * This module solves several critical problems in modern web applications:
 * 
 * 1. **Standardized HTTP Requests**: All API calls use consistent configuration
 *    (credentials, headers, error handling) regardless of where they're called from
 * 
 * 2. **Authentication Handling**: Provides sophisticated 401 error handling that can
 *    either return null (for optional data) or throw (for required data)
 * 
 * 3. **React Query Integration**: Pre-configured QueryClient with sensible defaults
 *    for server state management, reducing boilerplate across the application
 * 
 * 4. **Error Normalization**: Converts various types of HTTP errors into consistent
 *    Error objects that application code can reliably handle
 * 
 * 5. **Offline/Mock Support**: Includes infrastructure for handling offline modes
 *    and mocking responses during development (Codex mode)
 * 
 * Design Philosophy:
 * - Favor explicit configuration over implicit behavior
 * - Provide escape hatches for complex scenarios while maintaining simple defaults
 * - Centralize cross-cutting concerns (auth, credentials, error handling)
 * - Make the most common use cases (authenticated JSON APIs) effortless
 * 
 * Example usage:
 *   const task = await apiRequest('/api/tasks', 'POST', { name: 't' });
 *   queryFn: getQueryFn({ on401: 'returnNull' })
 */

/**
 * Pre-configured Axios instance with application-wide defaults
 * 
 * Configuration rationale:
 * - withCredentials: true - Ensures cookies/session data are sent with requests,
 *   critical for maintaining authentication state in session-based auth systems
 * - Content-Type: application/json - Most modern APIs expect JSON, and this prevents
 *   the need to set this header on every request
 * 
 * This instance should be used for all API requests to ensure consistency.
 */
const axiosClient = axios.create({ 
  withCredentials: true, 
  headers: { "Content-Type": "application/json" } 
});

/**
 * Codex request wrapper for development/offline mode support
 * 
 * This function provides infrastructure for handling offline development scenarios
 * where the backend might not be available. In a full implementation, this would:
 * 
 * 1. Check if the application is running in "Codex mode" (offline development)
 * 2. Return mock responses when offline to allow frontend development to continue
 * 3. Log requests for debugging purposes
 * 4. Potentially record/replay requests for testing
 * 
 * Currently implemented as a pass-through, but the infrastructure exists for
 * future enhancement. The mockResponse parameter allows callers to specify
 * what should be returned in offline mode.
 * 
 * @param {Function} requestFn - The actual request function to execute
 * @param {Object} mockResponse - Mock response to return in offline mode
 * @returns {Promise} Request result or mock response
 */
async function codexRequest(requestFn, mockResponse) {
  // TODO: Implement actual Codex mode detection
  // In a real implementation, this would check if we're in Codex mode
  // For now, we'll just execute the actual request
  try {
    return await requestFn();
  } catch (err) {
    // TODO: In Codex mode, return mockResponse instead of throwing
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
