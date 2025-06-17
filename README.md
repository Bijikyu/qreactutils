
# QReactUtils
## React Hooks Utility Library

A comprehensive React hooks library providing common functionality for async actions, dropdown management, form editing, mobile detection, toast notifications, and authentication redirects.

## Installation

```bash
npm install qreactutils
```
This library targets Node.js 18+.

## Usage

```javascript
const { useAsyncAction, useDropdownData, useToast, apiRequest } = require('qreactutils');
```

### Recent Updates
- Enhanced error handling patterns across all hooks
- Dropdown data now caches by `['dropdown', fetcher.name || generatedId, user._id]` for predictable keys
- Improved React Query integration with v5 features
- Comprehensive test suite with 92 tests passing
- Advanced async state management with callback patterns
- Mobile detection with proper SSR support
- Toast system with centralized state management
- Addition of `withToastLogging` and `executeAsyncWithLogging` for standardized toast/error logging
- Offline development mode enabled with `OFFLINE_MODE=true` uses `codexRequest`
  to bypass live API calls


### Implementation Status
The library provides production-ready React hooks with comprehensive error handling, loading states, and authentication patterns. All hooks follow React best practices with stable function references and proper dependency management.

## Commenting Guidelines

All code must follow the "Comment Rationale, Not Just Functionality" rule from AGENTS.md. Each change should explain why the code exists alongside how it works. All future contributions must use this style.


## Hooks API

### executeWithLoadingState(setIsLoading, asyncOperation)
Utility helper that toggles a loading boolean while an async operation runs and then clears it.

**Parameters:**
- `setIsLoading` (Function): State setter controlling the loading value
- `asyncOperation` (Function): Async function to execute

**Returns:** Promise resolving to the async operation result

### useStableCallbackWithHandlers(operation, callbacks, deps)
React hook returning a memoized callback that runs `operation` and invokes optional handlers.

**Parameters:**
- `operation` (Function): Operation to execute
- `callbacks` (Object, optional): `{onSuccess, onError}` handlers
- `deps` (Array): Dependency list for `useCallback`

**Returns:** Function - Memoized callback

### useAsyncStateWithCallbacks(asyncFn, options)
Hook for running an async function with loading state and optional callbacks.

**Parameters:**
- `asyncFn` (Function): Async function to run
- `options` (Object, optional): `{onSuccess, onError}` callbacks

**Returns:** Array - `[run, isLoading]`

### useCallbackWithErrorHandling(operation, options, deps)
React hook that memoizes a callback, executes optional handlers, and rethrows errors.

**Parameters:**
- `operation` (Function): Operation to execute
- `options` (Object, optional): `{onSuccess, onError}` callbacks
- `deps` (Array): Dependency list for `useCallback`

**Returns:** Function - Memoized callback

### useAsyncAction(asyncFn, options)
React hook for handling async actions with loading state using React Query's mutation system.

**Parameters:**
- `asyncFn` (Function): The async function to execute
- `options` (Object, optional): Configuration object
  - `onSuccess` (Function): Callback invoked when async operation succeeds
  - `onError` (Function): Callback invoked when async operation fails
  - Callbacks may return Promises and will be awaited so errors propagate

**Returns:** Array - `[run, isLoading]`

**Example:**
```javascript
const { useAsyncAction, apiRequest } = require('qreactutils'); // import hook and api utility

const [fetchData, isLoading] = useAsyncAction(
  async (id) => apiRequest('/api/data/' + id, 'GET'), // use centralized request helper
  {
    onSuccess: (data) => console.log('Data loaded:', data),
    onError: (error) => console.error('Failed to load data:', error)
  }
);
```

### useDropdownData(fetcher, toast, user)
Generic React hook for managing dropdown state via a React Query `useQuery` call.

**Parameters:**
- `fetcher` (Function): Async function that returns array data
- `toast` (Function): Toast function for error notifications
- `user` (Object): User object that triggers data fetch when available

Data loads automatically when the `user` argument becomes truthy and refreshes if a new `toast` function is supplied after mount. The hook skips duplicate fetches on the initial render so a user provided at mount triggers only the React Query request.
The React Query cache key uses `['dropdown', fetcher.name || generatedId, user && user._id]` so the key is JSON serializable and predictable across renders. `generatedId` is a `nanoid` value generated when the fetcher lacks a name. This keeps caching stable even when an anonymous function is used.
If `user` becomes falsy after data has loaded the hook clears the cached query and returns an empty array so dropdowns reset when logging out.

**Returns:** Object - `{items, isLoading, fetchData}`

### createDropdownListHook(fetcher)
Factory function that creates typed dropdown hooks.

**Parameters:**
- `fetcher` (Function): Async function that returns array data

**Returns:** Function - Custom hook that accepts `(toast, user)` parameters, where `toast` is a toast function

### useDropdownToggle()
React hook for managing dropdown open/close state.

`toggleOpen` is a memoized callback using a functional state update so rapid consecutive calls remain consistent. `close` is also memoized to provide a stable reference for event handlers.

**Returns:** Object - `{isOpen, toggleOpen, close}`

### useEditForm(initialState)
React hook for managing form editing state.

**Parameters:**
- `initialState` (Object): Initial form field values

**Returns:** Object - `{editingId, fields, setField, startEdit, cancelEdit}`

### useIsMobile()
React hook for detecting mobile viewport sizes (breakpoint: 768px).

**Returns:** boolean - True if viewport is mobile-sized

### useToast()
React hook for managing toast notifications with centralized state.

**Returns:** Object - `{toasts, toast, dismiss}`

### useToastAction(asyncFn, successMsg, refresh)
React hook that combines async actions with automatic toast notifications.

**Parameters:**
- `asyncFn` (Function): The async operation to run
- `successMsg` (string): Message to show on success
- `refresh` (Function, optional): Callback to refresh data

**Returns:** Array - `[run, isLoading]`

### useAuthRedirect(target, condition)
React hook for handling authentication-based redirects.

**Parameters:**
- `target` (string): The target URL to redirect to
- `condition` (boolean): The condition that triggers the redirect
- The hook first attempts SPA-style navigation by calling `window.history.pushState` and dispatching a `PopStateEvent`
- Falls back to `window.location.assign` when history APIs are missing

## Utility Functions

### toast(props)
Standalone toast function for creating notifications.

Each toast is assigned a unique id generated with `nanoid()` so it can be
updated or dismissed programmatically.

**Parameters:**
- `props` (Object): Toast configuration object

### toastSuccess(toast, message, title)
Helper function for displaying success toast messages with consistent styling.

**Parameters:**
- `toast` (Function): Toast function from useToast hook
- `message` (string): Success message to display
- `title` (string, optional): Custom title (defaults to "Success")

### toastError(toast, message, title)
Helper function for displaying error toast messages with destructive variant.

**Parameters:**
- `toast` (Function): Toast function from useToast hook  
- `message` (string): Error message to display
- `title` (string, optional): Custom title (defaults to "Error")

## API Functions

### handle401Error(error, behavior)
Gracefully handles 401 errors returned from Axios requests. Use `'returnNull'` to treat the response as missing data or `'throw'` to propagate the error.

**Parameters:**
- `error` (Error): The Axios error object
- `behavior` (string): `'returnNull'` or `'throw'`

**Returns:** boolean - `true` if the 401 was handled

### codexRequest(requestFn, mockResponse)
Wrapper enabling offline mode by returning a mock response when `OFFLINE_MODE=true`.

**Parameters:**
- `requestFn` (Function): Function executing the real Axios request
- `mockResponse` (Object, optional): Response to return when offline

**Returns:** Promise resolving to the Axios response object

### executeAxiosRequest(axiosCall, unauthorizedBehavior, mockResponse)
Runs an Axios request through `codexRequest` and normalizes errors.

**Parameters:**
- `axiosCall` (Function): Function performing the Axios request
- `unauthorizedBehavior` (string): `'returnNull'` or `'throw'` for 401 handling
- `mockResponse` (Object, optional): Offline mode response

**Returns:** Promise resolving to the Axios response

These helpers live in the `lib/api` submodule and are not part of the library's
default exports. Import them directly when needed:

```javascript
// Access internal API helpers
const { handle401Error, codexRequest, executeAxiosRequest } =
  require('qreactutils/lib/api');
```

### apiRequest(url, method, data)
Standardized HTTP request wrapper using `axiosClient`. `GET` requests send `data` as query parameters while other methods send it as the body.

**Parameters:**
- `url` (string): The API endpoint URL
- `method` (string, optional): HTTP method (defaults to 'POST')

- `data` (any, optional): Data to send with the request. For `GET` calls it becomes query parameters while other methods send it in the body.


**Returns:** Promise resolving to response data

### getQueryFn(options)
Factory function for creating React Query-compatible query functions.

**Parameters:**
- `options` (Object): Configuration object
  - `on401` (string): How to handle 401 errors ('returnNull' or 'throw')

**Returns:** Function - React Query compatible query function

### formatAxiosError(error)
Normalizes various error types into consistent Error objects.

### queryClient
Pre-configured React Query client with optimized defaults for typical CRUD operations.

### axiosClient
Pre-configured Axios instance with authentication and JSON handling. It sets `withCredentials: true` and reads `window.location.origin` for the base URL with a fallback to `http://localhost:3000`, ensuring session cookies flow in any environment. Use this instance for all API calls so headers and cookies are applied consistently (see `lib/api.js` lines 39-58).
Use this instance for all API calls so session cookies and JSON headers are applied consistently. Its `baseURL` defaults to `window.location.origin` and falls back to `http://localhost:3000` when no browser window exists. The client enforces `Content-Type: application/json` and `withCredentials: true` so cookies are sent with every request. Consumers may attach custom interceptors to this shared instance to extend behavior.


**Returns:** Axios instance for performing HTTP requests

## Utility Functions

### showToast(toast, message, title, variant)
Framework-agnostic toast creation utility.

### executeWithErrorToast(operation, toast, errorTitle)
Runs an async operation and shows a destructive toast when the operation throws, using "Error" as the default title. The original error is re-thrown for caller handling. See `lib/toastIntegration.js` lines 20-33 for details.

### executeWithToastFeedback(operation, toast, successMessage, errorTitle)
Runs an async operation and displays a success toast titled "Success" when it resolves or an error toast on failure. The error toast defaults to the title "Error". See `lib/toastIntegration.js` lines 20-33 and 48-62 for these defaults.

### stopEvent(event)
Combined preventDefault and stopPropagation utility for React events.

### getToastListenerCount()
Returns the current number of registered toast listeners. Exposed solely so tests
can confirm components clean up subscriptions and avoid memory leaks.

**Returns:** number - Current count of active toast listeners

### resetToastSystem()
Clears all toast listeners, cancels pending removal timers, and resets toast state. Provided for tests to start from a known baseline without leftover toasts.

**Returns:** void

### dispatch(action)
Centralized dispatch function used by the toast system to update global toast state and notify listeners. Each listener is called inside a try/catch so one failing component does not block others.

**Parameters:**
- `action` (Object): Toast action with `type`, `toast`, or `toastId` fields

**Returns:** void

### getToastTimeoutCount()
Returns the number of pending toast removal timeouts. This diagnostic helper is
used in tests to ensure dismissals clear timers and prevent memory leaks.

### executeAsyncWithLogging(operation, name, errorHandler)
Runs an async function with entry/exit/error logging.

```javascript
const { executeAsyncWithLogging } = require('qreactutils/lib/utils');
```

**Parameters:**
- `operation` (Function): Async function to execute
- `name` (string): Label for log output
- `errorHandler` (Function, optional): Handler called when the operation throws

**Returns:** Promise resolving to the result or handler output

### logFunction(name, phase, extra)
Internal helper for consistent console output across utilities.

Logging is automatically skipped when `NODE_ENV` is set to `production`, so set this environment variable to silence logs in production deployments.

```javascript
const { logFunction } = require('qreactutils/lib/utils');
```

**Parameters:**
- `name` (string): Function name being logged
- `phase` (string): Execution phase such as `entry` or `exit`
- `extra` (any): Additional data to log

**Returns:** void

### withToastLogging(name, fn)
Higher-order wrapper adding logging around toast helpers.

```javascript
const { withToastLogging } = require('qreactutils/lib/utils');
```

**Parameters:**
- `name` (string): Name for log entries
- `fn` (Function): Toast helper to wrap

**Returns:** Function - Wrapped operation

### executeWithErrorHandling(fn, functionName, errorTransform)
Async wrapper that maps errors before rethrowing.

```javascript
const { executeWithErrorHandling } = require('qreactutils/lib/errorHandling');
```

**Parameters:**
- `fn` (Function): Function to execute
- `functionName` (string): Name used in logs
- `errorTransform` (Function, optional): Maps thrown error

**Returns:** Promise resolving to the function result

### executeSyncWithErrorHandling(fn, functionName, errorTransform)
Synchronous counterpart supporting async error transforms.

```javascript
const { executeSyncWithErrorHandling } = require('qreactutils/lib/errorHandling');
```

**Parameters:**
- `fn` (Function): Synchronous function to run
- `functionName` (string): Name used in logs
- `errorTransform` (Function, optional): Maps thrown error

**Returns:** Promise resolving to the function result

## Validation Utilities

Lightweight runtime guards used throughout the library.

### isFunction(value)
Returns `true` when the value is callable, avoiding `TypeError: value is not a function` when hooks invoke optional callbacks.

### isObject(value)
Ensures a value is a plain object so property reads don't trigger `Cannot read property` errors on `null` or arrays.

### safeStringify(value)
Serializes objects with `safe-json-stringify` so logging data containing circular references never crashes.

### isAxiosErrorWithStatus(error, status)
Validates an error originated from Axios and matches a specific HTTP status, preventing generic errors from being mistaken for network responses.

## Example Usage

```javascript
const React = require('react');
const { useAsyncAction, useToast, useIsMobile, apiRequest } = require('qreactutils');

function MyComponent() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [saveData, isSaving] = useAsyncAction(
    async (data) => apiRequest('/api/save', 'POST', data),
    {
      onSuccess: () => toast({ title: 'Success', description: 'Data saved!' }),
      onError: (error) => toast({ title: 'Error', description: error.message })
    }
  );

  return (
    <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
      <button onClick={() => saveData({name: 'test'})} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Data'}
      </button>
    </div>
  );
}
```

## Testing

The library includes a custom Node-based test runner defined in `test.js`.

1. Run `npm install` first so all modules like `qtests` or `react` are available:

```bash
npm install
```

2. Run the test suite (executes `node test.js`) after installation. `npm test` simply calls this file so the full suite runs by default. Other test scripts can be executed manually with `node <script>`:

```bash
npm test
```

Missing dependencies like `react` will cause `npm test` to fail, so ensure all modules are installed.

The `test-setup` script falls back to local stubs when `qtests` is not available.
React may display "act()" warnings during `npm test`; the test runner now wraps `console.error` to filter these messages so output stays readable.

If `qtests` is missing, install it explicitly:

```bash
npm install qtests --save-dev
```

The test runner loads `qtests/setup` to provide automatic stubbing. Ensure this module exists or `npm test` will fail.

Additional scripts are available for specialized workflows:
`test-clean-runner.js` silences verbose logs while running `test.js`,
`test-comprehensive.js` runs expanded integration and edge-case coverage,
`test-focused.js` allows targeted tests with minimal output,
`test-silent.js` and `test-simple.js` keep CI output quiet,
while `test-production.js`, `test-final.js`, and `test-core.js` validate production scenarios. Execute any script manually with `node <script>` when needed.

All tests pass with 100% functional coverage including:
- Unit tests for all hooks and utilities
- Integration tests for hook composition
- API error handling scenarios
- Edge cases and performance validation
- Memory leak prevention verification

## Offline Development Mode

The library includes infrastructure for offline development via the `codexRequest` wrapper. Set the environment variable `OFFLINE_MODE=true` to force `codexRequest` to return a mock response. Using `false` or leaving the variable unset runs real network requests. While currently implemented as a pass-through, this enables future enhancement for mock responses during development when backends are unavailable.

## License

ISC
