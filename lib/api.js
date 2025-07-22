
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
  baseURL: process.env.CLIENT_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'), // use CLIENT_BASE_URL env var if set, otherwise current host; localhost fallback aids tests
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
  console.log(`codexRequest is running with ${process.env.OFFLINE_MODE}`); // reveal offline flag each call
  try { // attempt network call or return mock
    if (process.env.OFFLINE_MODE === `true`) { // offline mode lets frontend work without a backend
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

/**
 * Normalize axios error into a standard Error object
 * @param {unknown} err - The error to format
 * @returns {Error} Formatted error object
 *
 * The function avoids exposing the original axios error object to consumers
 * so that logging and UI code deal with a consistent `Error` type. It also
 * strips potentially sensitive server error structures, providing a concise
 * message for debugging while keeping the stack trace short.
 */
function formatAxiosError(err) { // ensure all thrown errors are plain Error instances
  try { // handle axios-specific formatting

    if (axios.isAxiosError(err)) { //(normalize axios error)
      const status = err.response?.status ?? 500; // default to 500 when status missing
      const data = err.response?.data ?? err.message; // fallback to message if no data
      const dataString = typeof data === 'string' ? data : safeStringify(data); // use module for circular refs
      const error = new Error(`${status}: ${dataString}`); // include HTTP status and server message for debugging
      return error; // standardized Error object

    }
    const wrapped = new Error(String(err)); // wrap non-Axios error so callers always get Error
    return wrapped; // return consistent Error object
  } catch (error) { // formatting itself failed

    return new Error(`Error formatting axios error: ${error.message}`); // last resort error wrapper

  }
}

/**
 * apiRequest wraps axios so all calls share cookies & JSON handling.
 *
 * It defaults the method to POST because most mutations send bodies
 * and ensures the axios instance always includes credentials and headers.
 * The function also goes through codexRequest so offline mocks can be
 * supplied during frontend development.
 * Choosing POST as the default method is opinionated but matches most CRUD
 * operations. Callers can override it when needed, trading a tiny bit of
 * verbosity for having a predictable baseline throughout the codebase.
 * Example: const user = await apiRequest('/api/user', 'GET');
 * @param {string} url - The URL to request
 * @param {string} method - HTTP method (defaults to POST)
 * @param {unknown} data - Request body data
 * @returns {Promise} Response data
*/
async function apiRequest(url, method = 'POST', data) { //(public axios wrapper)
  const normalizedMethod = method.toUpperCase(); // ensure method comparisons are case insensitive // changed
  try { // run request with offline fallback
    const config = { url, method: normalizedMethod }; // base config uses normalized method // changed
    if (normalizedMethod === 'GET') { // treat GET differently so body isn't sent // changed
      if (data !== null && data !== undefined) { // only attach params when data exists // added
        config.params = data; // map data to query params when provided // added
      }
    } else {
      config.data = data; // send body for non-GET requests // added
    }
    const response = await codexRequest(
      () => axiosClient.request(config), //perform request via shared axios instance // updated to use new config
      { status: 200, data: { message: 'Mocked in Codex' } } // include status so mock mirrors axios response and keeps offline response consistent
    );

    const result = response.data; //extract just the payload for caller
    return result; // return only data so callers don't see axios internals

  } catch (err) { //(handle axios errors)
    throw formatAxiosError(err); // normalize then bubble so caller logging remains consistent
  }
} //(end apiRequest)

/**
 * Create a React Query function that handles 401 errors gracefully
 *
 * Enhanced version that supports URL construction from query keys by joining
 * them with "/" to create RESTful paths. This factory ties axios requests into
 * React Query's `useQuery` mechanism and uses `codexRequest` under the hood so
 * offline mode works the same as normal network calls. The 401 behavior is
 * configurable because some queries are optional (missing data is acceptable)
 * while others must surface an error. By allowing `'returnNull'` or `'throw'`
 * the same query wrapper can serve both scenarios.
 *
 * Example: queryKey ['api', 'users', '123'] becomes GET request to 'api/users/123'
 *
 * @param {Object} options - Configuration options
 * @param {string} options.on401 - How to handle 401 errors ('returnNull' or 'throw')
 * @returns {Function} QueryFunction for React Query
 */
function getQueryFn(options = { on401: 'throw' }) { // default rejects on 401 so auth is required
  const { on401: unauthorizedBehavior = 'throw' } = options; // fallback to throw when caller omits behavior

  return async ({ queryKey }) => { //(returned QueryFunction)
    try { // perform GET and manage 401s
      const url = queryKey.join("/"); // join query key parts to construct URL path
      const res = await codexRequest(
        () => axiosClient.get(url), // perform GET using constructed URL from query key
        { status: 200, data: null } // return this when offline
      );
      const result = res.data; // extract payload since 401 throws and never reaches here
      return result; // forward data to query client
    } catch (err) { //(handle query errors)
      if (
        unauthorizedBehavior === 'returnNull' &&
        axios.isAxiosError(err) &&
        err.response?.status === 401
      ) {

        return null; // return null when optional query hits 401 rather than throwing

      }
      throw formatAxiosError(err); // rethrow normalized error so calling code can handle consistently
    }
  }; //(end returned QueryFunction)
} //(end getQueryFn)

/**
 * Shared React Query client with conservative defaults.
 *
 * The library disables automatic retries because failed requests should
 * surface immediately so calling code can decide how to recover.
 * Data never becomes stale and refetching on window focus is disabled to
 * avoid unexpected network traffic. Applications may override these
 * settings if they require different caching behavior. The client uses
 * `getQueryFn` by default so every query benefits from `codexRequest`
 * offline support and configurable 401 handling.
 * Centralizing the QueryClient here ensures all hooks share identical caching
 * rules. Applications can still supply their own client if needed, so this
 * default strikes a balance between convention and flexibility.
 */

const queryClient = new QueryClient({ // single client ensures caching behavior matches across hooks
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }), // default query rejects on 401 so protected queries fail fast
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
