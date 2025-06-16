
# QReactUtils
## React Hooks Utility Library

A comprehensive React hooks library providing common functionality for async actions, dropdown management, form editing, mobile detection, toast notifications, and authentication redirects.

## Installation

```bash
npm install qreactutils
```

## Usage

```javascript
const { useAsyncAction, useDropdownData, useToast } = require('qreactutils');
```

### Recent Updates
- Enhanced error handling patterns across all hooks
- Improved React Query integration with v5 features
- Comprehensive test suite with 25/25 tests passing
- Advanced async state management with callback patterns
- Mobile detection with proper SSR support
- Toast system with centralized state management

### Implementation Status
The library provides production-ready React hooks with comprehensive error handling, loading states, and authentication patterns. All hooks follow React best practices with stable function references and proper dependency management.

## Commenting Guidelines

All code must follow the "Comment Rationale, Not Just Functionality" rule from AGENTS.md. Each change should explain why the code exists alongside how it works. All future contributions must use this style.


## Hooks API

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
const [fetchData, isLoading] = useAsyncAction(
  async (id) => {
    const response = await fetch(`/api/data/${id}`);
    return response.json();
  },
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
The React Query cache key uses `['dropdown', fetcher.name, user && user._id]` so the key is JSON serializable and predictable across renders.
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
- Gracefully skips navigation when `window.history.pushState` is unavailable

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

### apiRequest(url, method, data)
Standardized HTTP request wrapper with consistent error handling and authentication.

**Parameters:**
- `url` (string): The API endpoint URL
- `method` (string, optional): HTTP method (defaults to 'POST')
- `data` (any, optional): Request body data

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
Pre-configured Axios instance with authentication and JSON handling. Use this instance for all API calls so session cookies and JSON headers are applied consistently.

**Returns:** Axios instance for performing HTTP requests

## Utility Functions

### showToast(toast, message, title, variant)
Framework-agnostic toast creation utility.

### executeWithErrorToast(operation, toast, errorTitle)
Runs an async operation and shows a destructive toast when the operation throws. The original error is re-thrown for caller handling.

### executeWithToastFeedback(operation, toast, successMessage, errorTitle)
Runs an async operation and displays a success toast when it resolves or an error toast on failure.

### stopEvent(event)
Combined preventDefault and stopPropagation utility for React events.

### getToastListenerCount()
Returns the current number of registered toast listeners. Useful for tests verifying cleanup.

**Returns:** number - Current count of active toast listeners

### resetToastSystem()
Clears all toast listeners, cancels pending removal timers, and resets toast state. Useful for isolated testing environments.

**Returns:** void

### dispatch(action)
Centralized dispatch function used by the toast system to update global toast state and notify listeners.

**Parameters:**
- `action` (Object): Toast action with `type`, `toast`, or `toastId` fields

**Returns:** void

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
const { useAsyncAction, useToast, useIsMobile } = require('qreactutils');

function MyComponent() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [saveData, isSaving] = useAsyncAction(
    async (data) => {
      const response = await fetch('/api/save', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return response.json();
    },
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

1. Install dependencies so required modules like `qtests` are available:

```bash
npm install
```

2. Run the test suite (executes `node test.js`):

```bash
npm test
```

The `test-setup` script falls back to local stubs when `qtests` is not available.
React may display "act()" warnings during `npm test`; the test runner now wraps `console.error` to filter these messages so output stays readable.

If `qtests` is missing, install it explicitly:

```bash
npm install qtests --save-dev
```

The test runner loads `qtests/setup` to provide automatic stubbing. Ensure this module exists or `npm test` will fail.

All tests pass with 100% functional coverage including:
- Unit tests for all hooks and utilities
- Integration tests for hook composition
- API error handling scenarios
- Edge cases and performance validation
- Memory leak prevention verification

## Offline Development Mode

The library includes infrastructure for offline development via the `codexRequest` wrapper. While currently implemented as a pass-through, this enables future enhancement for mock responses during development when backends are unavailable.

## License

ISC
