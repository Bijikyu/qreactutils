# Clipboard Functionality - QReactUtils

## Overview

Your React hooks utility library now includes comprehensive clipboard functionality with both React hooks and standalone utilities. This implementation provides robust copy-to-clipboard capabilities with modern browser support, legacy fallbacks, and seamless integration with your existing toast notification system.

## What's Been Added

### New Files
- **`lib/clipboard.js`** - Core clipboard utilities with browser compatibility
- **`test-clipboard.js`** - Comprehensive test suite (92 tests total)
- **`test-clipboard-simple.js`** - Simplified test verification
- **`examples/clipboard-usage.js`** - Complete usage examples
- **`examples/README.md`** - Documentation and quick start guide

### New Functions

#### React Hooks
```javascript
// Basic hook with automatic toast notifications
const [copyText, isLoading] = useClipboard({
  successMessage: "Copied!",      // optional
  errorMessage: "Copy failed"     // optional
});

// Advanced hook with custom callbacks
const [copyText, isLoading] = useClipboardWithCallbacks({
  onSuccess: (text) => console.log('Copied:', text),
  onError: (error) => console.log('Error:', error)
});
```

#### Standalone Utilities
```javascript
// Simple copy utility
const success = await copyToClipboard("Text to copy");

// Factory for custom copy functions
const copyFn = makeCopyFn(
  (text) => showToast("Copied: " + text),    // success callback
  (error) => showToast("Error: " + error)   // error callback
);
```

## Key Features

### Browser Compatibility
- **Modern Browsers**: Uses `navigator.clipboard.writeText()` for secure, permission-aware copying
- **Legacy Browsers**: Falls back to `document.execCommand('copy')` with temporary textarea
- **Server-Side**: Graceful handling with simulation mode for SSR applications
- **Mobile Browsers**: Optimized selection range handling for touch devices

### Integration Benefits
- **Toast Notifications**: Seamless integration with your existing toast system
- **Loading States**: Built-in loading state management for UI feedback
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Validation**: Input validation for type safety and empty string handling

### Security & Reliability
- **HTTPS Support**: Modern Clipboard API requires secure contexts
- **Permission Handling**: Graceful degradation when clipboard access is denied  
- **Input Sanitization**: Validates input types and handles edge cases
- **Error Recovery**: Multiple fallback strategies ensure functionality across environments

## Usage Examples

### 1. Basic Copy Button
```javascript
function CopyButton({ text }) {
  const [copyText, isLoading] = useClipboard();
  
  return (
    <button 
      onClick={() => copyText(text)} 
      disabled={isLoading}
    >
      {isLoading ? 'Copying...' : 'Copy'}
    </button>
  );
}
```

### 2. Copy with Custom Messages
```javascript
function CodeCopyButton({ code }) {
  const [copyText, isLoading] = useClipboard({
    successMessage: "Code copied to clipboard!",
    errorMessage: "Failed to copy code"
  });
  
  return (
    <button onClick={() => copyText(code)}>
      Copy Code
    </button>
  );
}
```

### 3. Copy with Custom Actions
```javascript
function ShareButton({ url }) {
  const [copyText, isLoading] = useClipboardWithCallbacks({
    onSuccess: (text) => {
      analytics.track('link_copied', { url: text });
      setShareStatus('Link copied!');
    },
    onError: (error) => {
      analytics.track('copy_failed', { error });
      setShareStatus('Copy failed');
    }
  });
  
  return (
    <button onClick={() => copyText(url)}>
      Share Link
    </button>
  );
}
```

### 4. Non-React Usage
```javascript
// In utility functions, API responses, etc.
async function exportData(data) {
  const jsonString = JSON.stringify(data, null, 2);
  const success = await copyToClipboard(jsonString);
  
  if (success) {
    showToast("Data exported to clipboard");
  } else {
    showToast("Export failed");
  }
}
```

## Architecture Integration

The clipboard functionality integrates seamlessly with your existing library architecture:

- **Toast System**: Uses your advanced toast notifications for user feedback
- **Error Handling**: Follows your established error handling patterns
- **Logging**: Integrates with your Winston-based logging system
- **Validation**: Uses your existing validation utilities
- **Loading States**: Follows your `executeWithLoadingState` pattern

## Testing

The implementation includes comprehensive tests:
- ✅ Factory function validation
- ✅ Success/error callback handling  
- ✅ Input validation and edge cases
- ✅ Browser compatibility scenarios
- ✅ Server-side rendering support
- ✅ React hook functionality
- ✅ Toast integration

Run tests with:
```bash
node test-clipboard-simple.js  # Quick verification
node examples/clipboard-usage.js  # Usage examples
```

## Next Steps

The clipboard functionality is now fully integrated and ready to use. You can:

1. **Import and Use**: Start using `useClipboard` in your React components
2. **Customize**: Modify success/error messages to match your app's tone
3. **Extend**: Add additional clipboard utilities as needed
4. **Test**: Verify functionality in your target browsers and environments

The implementation follows your library's patterns and maintains compatibility with your existing codebase while providing powerful, flexible clipboard capabilities.