
# QRECTUTILS
# React Hooks Utility Library

A comprehensive React hooks library providing common functionality for async actions, dropdown management, form editing, mobile detection, toast notifications, and authentication redirects.

## Installation

```bash
npm install your-module-name
```

## Usage

```javascript
const { useAsyncAction, useDropdownData, useToast } = require('your-module-name');
```

## Hooks API

### useAsyncAction(asyncFn, options)
React hook for handling async actions with loading state and error handling.

**Parameters:**
- `asyncFn` (Function): The async function to execute
- `options` (Object, optional): Configuration object
  - `onSuccess` (Function): Callback invoked when async operation succeeds
  - `onError` (Function): Callback invoked when async operation fails

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
Generic React hook for managing dropdown state with loading and error handling.

**Parameters:**
- `fetcher` (Function): Async function that returns array data
- `toast` (Object): Toast instance for error notifications
- `user` (Object): User object that triggers data fetch when available

**Returns:** Object - `{items, isLoading, fetchData}`

### createDropdownListHook(fetcher)
Factory function that creates typed dropdown hooks.

**Parameters:**
- `fetcher` (Function): Async function that returns array data

**Returns:** Function - Custom hook that accepts `(toast, user)` parameters

### useDropdownToggle()
React hook for managing dropdown open/close state.

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

## Utility Functions

### toast(props)
Standalone toast function for creating notifications.

**Parameters:**
- `props` (Object): Toast configuration object

### toastSuccess(toast, message)
Helper function for displaying success toast messages.

### toastError(toast, message)
Helper function for displaying error toast messages.

## Example Usage

```javascript
import React from 'react';
const { useAsyncAction, useToast, useIsMobile } = require('your-module-name');

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

## License

ISC
