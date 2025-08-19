# QReactUtils Clipboard Examples

This directory contains comprehensive examples showing how to use the clipboard functionality in QReactUtils.

## Quick Start

### 1. Basic Usage with React Hook

```javascript
import { useClipboard } from 'qreactutils';

function MyComponent() {
  const [copyText, isLoading] = useClipboard();
  
  const handleCopy = () => {
    copyText("Hello, clipboard!");
  };

  return (
    <button onClick={handleCopy} disabled={isLoading}>
      {isLoading ? 'Copying...' : 'Copy Text'}
    </button>
  );
}
```

### 2. Utility Function (Non-React)

```javascript
import { copyToClipboard } from 'qreactutils';

async function copyData() {
  const success = await copyToClipboard("My data to copy");
  console.log(success ? 'Copied!' : 'Failed to copy');
}
```

## Available Functions

### React Hooks

- **`useClipboard(options)`** - Main clipboard hook with toast notifications
- **`useClipboardWithCallbacks(callbacks)`** - Clipboard hook with custom callbacks

### Utilities

- **`copyToClipboard(text)`** - Simple copy utility
- **`makeCopyFn(onSuccess, onError)`** - Factory for creating copy functions

## Features

- ✅ Modern Clipboard API with legacy fallback
- ✅ Server-side rendering (SSR) support
- ✅ Automatic toast notifications
- ✅ Custom success/error callbacks
- ✅ Loading state management
- ✅ Input validation
- ✅ Browser compatibility
- ✅ TypeScript-friendly

## Examples

See `clipboard-usage.js` for detailed examples including:

1. **BasicCopyExample** - Simple copy with default toast messages
2. **CustomMessageExample** - Custom success/error messages
3. **CustomCallbackExample** - Custom success/error handlers
4. **DynamicContentExample** - Copying JSON/CSV data
5. **ShareExample** - Creating shareable URLs
6. **utilityExamples** - Non-React utility usage

## Running Examples

```bash
node examples/clipboard-usage.js
```

This will demonstrate the utility functions in action.