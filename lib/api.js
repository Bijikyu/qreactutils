
const { QueryClient } = require("@tanstack/react-query"); // React Query core client
const axios = require("axios"); // HTTP client used for API requests
const { safeStringify } = require('./validation'); // import stringify helper for log safety

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
 * baseURL points to `window.location.origin` so every relative URL
 * automatically hits the current host. This allows one codebase to run
 * on development, staging, or production domains without rewriting
 * URLs. When no browser window exists we default to `http://localhost:3000`
 * so tests and server-side calls still resolve correctly.
 *
 * `withCredentials: true` is mandatory because the authentication flow
 * relies on session cookies. Axios must include those cookies on every
 * request or the server will not recognize the user as logged in.
 *
 * We set `Content-Type: application/json` once here because JSON payloads
 * are the standard across the library.
 *
 * This instance should be used for all API requests to ensure consistency.
 */
const axiosClient = axios.create({
  baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000', // switch host automatically so envs share config
  withCredentials: true, // ensures cookies go with every request for session auth
  headers: { "Content-Type": "application/json" } // standardize JSON payloads across requests
}); // single axios instance so all requests share identical defaults

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
  if (axios.isAxiosError(error) && error.response?.status === 401) { // ensure axios error with 401 status before custom logic
    if (behavior === 'returnNull') { // treat 401 as valid absence
      return true; // indicates 401 was handled
    }
  }
  return false; // indicates error should be thrown
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
    const response = await codexRequest(axiosCall, mockResponse); //use codex wrapper so offline mode mimics network
    return response; //return full axios response so caller can inspect status
  } catch (err) { //(catch request errors)
    // Handle 401 errors based on specified behavior
    if (handle401Error(err, unauthorizedBehavior)) {
      return { data: null }; // return null to allow optional queries without error
    }
    throw formatAxiosError(err); //rethrow normalized error so calling code gets consistent Error
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
  console.log(`codexRequest is running with ${process.env.OFFLINE_MODE}`); // log current offline mode for clarity
  try {
    if (process.env.OFFLINE_MODE === `true`) { // branch for offline development mode to serve mocks
      const offlineRes = mockResponse ?? { status: 200, data: null }; // ensure object when mock missing
      console.log(`codexRequest is returning ${safeStringify(offlineRes)}`); // show offline result for debugging
      return offlineRes; //(provide mock or default network result)
    }

    const res = await requestFn(); // perform real network call

    console.log(`codexRequest is returning ${safeStringify(res)}`); // log real return
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
  try {

    if (axios.isAxiosError(err)) { //(normalize axios error)
      const status = err.response?.status ?? 500; // default to 500 when status missing
      const data = err.response?.data ?? err.message; // fallback to message if no data
      const dataString = typeof data === 'string' ? data : safeStringify(data); // use module for circular refs
      const error = new Error(`${status}: ${dataString}`); // preserve status and payload
      return error; // standardized Error object

    }
    const wrapped = new Error(String(err)); //(wrap non-Axios error to ensure Error instance for non-axios cases)
    return wrapped; //(return standardized Error object)
  } catch (error) {

    return new Error(`Error formatting axios error: ${error.message}`); // last resort error wrapper

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
  try {
    const response = await codexRequest(
      () => axiosClient.request({ url, method, data }), //perform request via shared axios instance
      { data: { message: 'Mocked in Codex' } } //mocked response returned in offline mode
    );

    const result = response.data; //extract just the payload for caller
    return result; // send back only the data to caller

  } catch (err) { //(handle axios errors)
    throw formatAxiosError(err); //rethrow normalized error so error logs stay consistent
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
    try {
      const res = await codexRequest(
        () => axiosClient.get(queryKey[0]), //perform GET using query key for endpoint
        { status: 200, data: null } //return this when offline
      );
      if (unauthorizedBehavior === 'returnNull' && res.status === 401) {
        return null; // caller chose to swallow 401 errors
      }
      const result = res.data; //(extract payload)
      return result; // forward data to query client
    } catch (err) { //(handle query errors)
      if (
        unauthorizedBehavior === 'returnNull' &&
        axios.isAxiosError(err) &&
        err.response?.status === 401
      ) {

        return null; // return null when optional query hits 401

        return null; // return null rather than throwing when configured

      }
      throw formatAxiosError(err); // rethrow normalized error so calling code can handle consistently
    }
  }; //(end returned QueryFunction)
} //(end getQueryFn)

const queryClient = new QueryClient({ // shared React Query client for the app
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }), // default query function handles unauthorized errors surface immediately
      refetchInterval: false, // disable polling to prevent background traffic
      refetchOnWindowFocus: false, // keep data stable when user refocuses tab
      staleTime: Infinity, // data never becomes stale by default
      retry: false, // let caller control retry logic
    },
    mutations: {
      retry: false, // avoid automatic retries on mutations
    },
  },
}); // single client reused across hooks for cache consistency

module.exports = { //(expose API helpers via CommonJS for broad Node support)
  handle401Error,      // unify 401 status handling // exported so apps can control optional vs required auth
  codexRequest,        // offline development wrapper // public to enable mock responses during development
  executeAxiosRequest, // axios wrapper with error handling // exported for advanced request customization
  apiRequest,          // Primary HTTP wrapper used across hooks // public entry for all HTTP calls
  getQueryFn,          // Factory for React Query query functions // exported so consumers build consistent queries
  queryClient,         // Shared QueryClient instance // public so entire app uses same cache
  formatAxiosError,    // Normalizes axios errors for consumers // exported to keep error processing consistent
  axiosClient          // Pre-configured axios instance // public so external code can share HTTP config
}; //(end module exports)
