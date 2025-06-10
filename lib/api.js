
const { QueryClient } = require("@tanstack/react-query"); // React Query core client
const axios = require("axios"); // HTTP client used for API requests

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
 * - baseURL: Sets a base URL for all requests, allowing relative URLs to work properly
 * - withCredentials: true - Ensures cookies/session data are sent with requests,
 *   critical for maintaining authentication state in session-based auth systems
 * - Content-Type: application/json - Most modern APIs expect JSON, and this prevents
 *   the need to set this header on every request
 * 
 * This instance should be used for all API requests to ensure consistency.
 */
const axiosClient = axios.create({ 
  baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  withCredentials: true, 
  headers: { "Content-Type": "application/json" } 
});

/**
 * Helper function for building request configuration objects
 * 
 * Standardizes request configuration across different API functions,
 * reducing duplication of URL, method, and data parameter handling.
 * 
 * @param {string} url - Request URL
 * @param {string} method - HTTP method
 * @param {*} data - Request body data
 * @returns {Object} Axios request configuration
 */
function buildRequestConfig(url, method, data) {
  return { url, method, data };
} //(end formatAxiosError)

/**
 * Helper function for creating mock responses based on URL patterns
 * 
 * Centralizes the mock response logic used across different API functions,
 * reducing duplication of mock response creation patterns.
 * 
 * @param {string} url - Request URL to generate mock for
 * @param {string} method - HTTP method
 * @param {*} data - Request data
 * @returns {Object} Mock response object
 */
function createMockResponse(url, method, data) {
  return {
    status: 200,
    data: { success: true, url, method, requestData: data, mocked: true }
  };
}

/**
 * Helper function for handling 401 errors consistently
 * 
 * Standardizes 401 error handling logic used across multiple functions,
 * supporting both returnNull and throw behaviors.
 * 
 * @param {*} error - Error to check
 * @param {string} behavior - How to handle 401 ('returnNull' or 'throw')
 * @returns {boolean} True if 401 was handled, false if error should be thrown
 */
function handle401Error(error, behavior) {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    if (behavior === 'returnNull') {
      return true; // Indicates 401 was handled
    }
  }
  return false; // Indicates error should be thrown
}

/**
 * Wrapper for axios requests with consistent error handling and logging
 * 
 * This reduces duplication between apiRequest and getQueryFn while maintaining
 * their individual responsibilities. Each function handles its specific concerns
 * (data extraction, query keys) but shares common axios patterns.
 * 
 * @param {Function} axiosCall - The axios request function to execute
 * @param {string} unauthorizedBehavior - How to handle 401 errors
 * @param {*} mockResponse - Mock response for offline/Codex mode
 * @returns {Promise} Response data or formatted error
 */
async function executeAxiosRequest(axiosCall, unauthorizedBehavior, mockResponse) { //(standardized axios wrapper)
  try { //(attempt request)
    const response = await codexRequest(axiosCall, mockResponse); //(call axios with codex wrapper)
    return response; //(return full axios response)
  } catch (err) { //(catch request errors)
    // Handle 401 errors based on specified behavior
    if (handle401Error(err, unauthorizedBehavior)) {
      return { data: null }; // Return null data structure for consistency
    }
    throw formatAxiosError(err); //(rethrow normalized error)
  }
} //(end executeAxiosRequest)

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
async function codexRequest(requestFn, mockResponse) { //(handle codex offline logic)
  console.log(`codexRequest is running with ${process.env.OFFLINE_MODE}`); //(log offline mode state)
  try {
    if (process.env.OFFLINE_MODE === `true`) {
      console.log(`codexRequest is returning ${JSON.stringify(mockResponse)}`); //(return mock response when offline)
      return mockResponse; //(provide mock network result)
    }
    const res = await requestFn();
    console.log(`codexRequest is returning ${JSON.stringify(res)}`); //(return actual response)
    return res; //(pass through real network result)
  } catch (err) {
    throw err; //(rethrow request errors for caller handling)
  }
} //(end codexRequest)

/**
 * Normalize axios error into a standard Error object
 * @param {unknown} err - The error to format
 * @returns {Error} Formatted error object
 */
function formatAxiosError(err) { //(normalize axios error)
  console.log(`formatAxiosError is running with ${err}`);
  try {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 500;
      const data = err.response?.data ?? err.message;
      let dataString;
      
      if (typeof data === 'string') {
        dataString = data;
      } else {
        try {
          dataString = JSON.stringify(data);
        } catch (circularError) {
          // Handle circular references by creating a safe representation
          dataString = `[Object with circular reference: ${Object.prototype.toString.call(data)}]`;
        }
      }
      
      const error = new Error(`${status}: ${dataString}`);
      console.log(`formatAxiosError is returning ${error}`);
      return error;
    }
    console.log(`formatAxiosError is returning ${err}`);
    return err;
  } catch (error) {
    console.error('formatAxiosError error:', error);
    return new Error(`Error formatting axios error: ${error.message}`);
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
async function apiRequest(url, method = 'POST', data) { //(public axios wrapper)
  console.log(`apiRequest is running with ${method} ${url}`); //(log request info)
  try {
    const response = await codexRequest(
      () => axiosClient.request({ url, method, data }), //(perform axios call)
      { data: { message: 'Mocked in Codex' } } //(mock offline response)
    );
    const result = response.data; //(extract data payload)
    console.log(`apiRequest is returning ${JSON.stringify(result)}`);
    return result;
  } catch (err) { //(handle axios errors)
    console.error('apiRequest error:', err);
    throw formatAxiosError(err); //(rethrow normalized error)
  }
} //(end apiRequest)

/**
 * Create a React Query function that handles 401 errors gracefully
 * @param {Object} options - Configuration options
 * @param {string} options.on401 - How to handle 401 errors ('returnNull' or 'throw')
 * @returns {Function} QueryFunction for React Query
 */
function getQueryFn(options) { //(factory for query functions)
  const { on401: unauthorizedBehavior } = options; //(extract 401 strategy)
  
  return async ({ queryKey }) => { //(returned QueryFunction)
    console.log(`getQueryFn inner is running with ${queryKey[0]}`); //(log query key)
    try {
      const res = await codexRequest(
        () => axiosClient.get(queryKey[0]), //(perform GET request)
        { status: 200, data: null } //(mock offline result)
      );
      if (unauthorizedBehavior === 'returnNull' && res.status === 401) {
        console.log(`getQueryFn inner is returning null`);
        return null;
      }
      const result = res.data; //(extract payload)
      console.log(`getQueryFn inner is returning ${JSON.stringify(result)}`);
      return result;
    } catch (err) { //(handle query errors)
      if (
        unauthorizedBehavior === 'returnNull' &&
        axios.isAxiosError(err) &&
        err.response?.status === 401
      ) {
        console.log(`getQueryFn inner is returning null`);
        return null;
      }
      console.error('getQueryFn error:', err);
      throw formatAxiosError(err); //(rethrow normalized error)
    }
  }; //(end returned QueryFunction)
} //(end getQueryFn)

const queryClient = new QueryClient({ // shared React Query client for the app
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

module.exports = { //(expose API helpers)
  apiRequest,      // Primary HTTP wrapper used across hooks
  getQueryFn,      // Factory for React Query query functions
  queryClient,     // Shared QueryClient instance
  formatAxiosError, // Normalizes axios errors for consumers
  axiosClient      // Pre-configured axios instance
}; //(end module exports)
