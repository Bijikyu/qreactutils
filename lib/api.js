const { QueryClient } = require("@tanstack/react-query"); // React Query core client
const axios = require("axios"); // HTTP client used for API requests
const { safeStringify } = require('./validation'); // import stringify helper for log safety

/**
 * Safe environment accessor for browser builds
 *
 * Why: Direct `process.env.*` access throws in modern browser bundlers that do not
 * polyfill `process`. Using a guarded helper preserves the offline-first behavior
 * and axios baseURL selection without leaking Node-only globals into the browser.
 */
function getEnv(name) {
  try {
    return (typeof process !== 'undefined' && process && process.env) ? process.env[name] : undefined;
  } catch {
    return undefined; // keep browser runtime stable if `process` is unavailable
  }
}
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
  baseURL: getEnv('CLIENT_BASE_URL') || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'), // use CLIENT_BASE_URL env var if set, otherwise current host; localhost fallback aids tests
  withCredentials: true, // always send cookies so session based auth works without extra config
  headers: { "Content-Type": "application/json" } // force JSON format which is the only payload this lib expects
}); // single axios instance keeps interceptors and defaults identical everywhere

/**
 * Helper function for handling 401 errors consistently
 *
 * When the backend returns a 401 response the caller may decide whether
 * that status should break the flow. Passing 'returnNull' treats the
 * response as missing data so optional requests can continue, while
 * 'throw' rethrows to enforce authentication for protected endpoints.
 * The trade-off is flexibility versus simplicity: a global axios interceptor
 * could auto redirect, but explicit handling per request keeps control in the
 * calling code which eases unit testing.
 *
 * @param {*} error - Error to check
 * @param {string} behavior - How to handle 401 ('returnNull' or 'throw')
 * @returns {boolean} True if 401 was handled, false if error should be thrown
 */
function handle401Error(error, behavior) { // convert 401 into null when allowed
  if (axios.isAxiosError(error) && error.response?.status === 401) { // only handle real HTTP 401 errors so other failures bubble
    if (behavior === 'returnNull') { // treat 401 as valid absence
      return true; // indicates 401 was handled
    }
  }
  return false; // indicates error should be thrown
}

/**
 * Wrapper for axios requests with consistent error handling and logging
 *
 * This helper centralizes the try/catch pattern for axios so apiRequest and
 * getQueryFn do not duplicate the same logic. Every request first passes through
 * `codexRequest`, which means the call can transparently return mock data when
 * `OFFLINE_MODE` is enabled. 401 handling is configurable because some requests
 * are optional while others require authentication. By letting the caller choose
 * `'returnNull'` or `'throw'` we support both flows without duplicating code.
 * This approach avoids global axios interceptors which can hide control flow.
 * Instead, each request explicitly states how to handle 401 responses, trading
 * slight verbosity for clearer intent and testability.
 *
 * @param {Function} axiosCall - The axios request function to execute
 * @param {string} unauthorizedBehavior - How to handle 401 errors
 * @param {*} mockResponse - Mock response for offline/Codex mode
 * @returns {Promise} Response data or formatted error
 */
async function executeAxiosRequest(axiosCall, unauthorizedBehavior, mockResponse) { // run axios request and normalize errors
  try { // attempt network or offline request
    const response = await codexRequest(axiosCall, mockResponse); // call through codex to honor OFFLINE_MODE
    return response; // forward axios response to caller for status access
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
 * This helper lets the library intercept axios calls so that offline or mock
 * data can be provided without changing calling code. When `OFFLINE_MODE` is
 * enabled the given mock response (or a default one) is returned, otherwise the
 * `requestFn` executes normally. The response is always shaped like a real axios
 * result so React Query and other consumers remain unaware that a mock was used.
 * The trade-off here is minimal: one more function call per request allows the
 * frontend to function without a live backend which accelerates development.
 *
 * @param {Function} requestFn - The actual request function to execute
 * @param {Object} mockResponse - Mock response to return in offline mode
 * @returns {Promise} Request result or mock response
 */
async function codexRequest(requestFn, mockResponse) { // wrapper around axios to support mock responses
  const offlineFlag = getEnv('OFFLINE_MODE'); // safely read env without requiring Node polyfills
  console.log(`codexRequest is running with ${offlineFlag}`); // reveal offline flag each call
  try { // attempt network call or return mock
    if (offlineFlag === `true`) { // offline mode lets frontend work without a backend
      const offlineRes = mockResponse ?? { status: 200, data: null }; // default mock keeps types consistent when no mock provided
      console.log(`codexRequest is returning ${safeStringify(offlineRes)}`); // show offline result for debugging
      return offlineRes; //(provide mock or default network result)
    }

    const res = await requestFn(); // perform real network call

    console.log(`codexRequest is returning ${safeStringify(res)}`); // log real return
    return res; //(pass through real network result)
  } catch (err) { // bubble up any request errors
    throw err; //(rethrow request errors for caller handling)
  }
} //(end codexRequest)
