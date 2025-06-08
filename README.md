
# My NPM Module

A simple npm module template with basic utility functions.

## Installation

```bash
npm install your-module-name
```

## Usage

```javascript
const { greet, capitalize } = require('your-module-name');

// Use the greet function
console.log(greet('World')); // Output: Hello, World!

// Use the capitalize function
console.log(capitalize('hello world')); // Output: Hello world
```

## API

### greet(name)
Returns a greeting message for the given name.

**Parameters:**
- `name` (string): The name to greet

**Returns:** String - A greeting message

### capitalize(text)
Capitalizes the first letter of the given text.

**Parameters:**
- `text` (string): The text to capitalize

**Returns:** String - Capitalized text

### useAsyncAction(asyncFn, options)
React hook for handling async actions with loading state and error handling.

**Parameters:**
- `asyncFn` (Function): The async function to execute
- `options` (Object, optional): Configuration object
  - `onSuccess` (Function): Callback invoked when async operation succeeds
  - `onError` (Function): Callback invoked when async operation fails

**Returns:** Array - `[run, isLoading]` where:
- `run` (Function): Function to execute the async action
- `isLoading` (boolean): Loading state indicator

**Example:**
```javascript
const { useAsyncAction } = require('your-module-name');

function MyComponent() {
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

  return (
    <button onClick={() => fetchData(123)} disabled={isLoading}>
      {isLoading ? 'Loading...' : 'Fetch Data'}
    </button>
  );
}
```

### useDropdownData(fetcher, toast, user)
Generic React hook for managing dropdown state with loading and error handling.

**Parameters:**
- `fetcher` (Function): Async function that returns array data
- `toast` (Object): Toast instance with error method for notifications
- `user` (Object): User object that triggers data fetch when available

**Returns:** Object - `{items, isLoading, fetchData}` where:
- `items` (Array): The fetched dropdown data
- `isLoading` (boolean): Loading state indicator
- `fetchData` (Function): Function to manually trigger data fetch

### createDropdownListHook(fetcher)
Factory function that creates typed dropdown hooks.

**Parameters:**
- `fetcher` (Function): Async function that returns array data

**Returns:** Function - Custom hook that accepts `(toast, user)` parameters

**Example:**
```javascript
const { useDropdownData, createDropdownListHook } = require('your-module-name');

// Direct usage
function MyDropdown() {
  const { items, isLoading, fetchData } = useDropdownData(
    async () => fetch('/api/items').then(r => r.json()),
    toast,
    user
  );
  
  return isLoading ? 'Loading...' : items.map(item => <div key={item.id}>{item.name}</div>);
}

// Factory usage
const useProductList = createDropdownListHook(
  async () => fetch('/api/products').then(r => r.json())
);

function ProductDropdown() {
  const { items, isLoading } = useProductList(toast, user);
  return /* render dropdown */;
}
```

## License

ISC
