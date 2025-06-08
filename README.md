
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

## License

ISC
