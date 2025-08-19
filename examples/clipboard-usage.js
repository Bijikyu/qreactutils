/**
 * Clipboard Usage Examples
 * 
 * This file demonstrates various ways to use the clipboard functionality
 * provided by the QReactUtils library.
 */

const React = require('react');
const { useClipboard, useClipboardWithCallbacks, makeCopyFn, copyToClipboard } = require('../index.js');

/**
 * Example 1: Basic useClipboard hook with toast notifications
 * 
 * This is the simplest way to add copy-to-clipboard functionality
 * with automatic success/error toast notifications.
 */
function BasicCopyExample() {
  const [copyText, isLoading] = useClipboard();
  
  const handleCopy = async () => {
    await copyText("Hello from QReactUtils clipboard!");
  };

  return React.createElement('div', {},
    React.createElement('button', { 
      onClick: handleCopy, 
      disabled: isLoading 
    }, 
    isLoading ? 'Copying...' : 'Copy Text'
    )
  );
}

/**
 * Example 2: useClipboard with custom messages
 * 
 * Customize the success and error messages shown in toast notifications.
 */
function CustomMessageExample() {
  const [copyText, isLoading] = useClipboard({
    successMessage: "Code snippet copied to clipboard!",
    errorMessage: "Failed to copy code"
  });
  
  const codeSnippet = `
import { useClipboard } from 'qreactutils';

function MyComponent() {
  const [copy] = useClipboard();
  return <button onClick={() => copy('Hello!')}>Copy</button>;
}`;

  const handleCopyCode = async () => {
    await copyText(codeSnippet);
  };

  return React.createElement('div', {},
    React.createElement('pre', { style: { backgroundColor: '#f5f5f5', padding: '10px' } }, codeSnippet),
    React.createElement('button', { 
      onClick: handleCopyCode, 
      disabled: isLoading 
    }, 
    isLoading ? 'Copying...' : 'Copy Code'
    )
  );
}

/**
 * Example 3: useClipboardWithCallbacks for custom behavior
 * 
 * Use custom success and error handlers instead of automatic toast notifications.
 */
function CustomCallbackExample() {
  const [status, setStatus] = React.useState('');
  
  const [copyText, isLoading] = useClipboardWithCallbacks({
    onSuccess: (copiedText) => {
      setStatus(`Copied: "${copiedText.substring(0, 20)}${copiedText.length > 20 ? '...' : ''}"`);
      setTimeout(() => setStatus(''), 3000);
    },
    onError: (error) => {
      setStatus(`Error: ${error}`);
      setTimeout(() => setStatus(''), 3000);
    }
  });

  const handleCopy = async () => {
    const userEmail = "user@example.com";
    await copyText(userEmail);
  };

  return React.createElement('div', {},
    React.createElement('button', { 
      onClick: handleCopy, 
      disabled: isLoading 
    }, 
    isLoading ? 'Copying...' : 'Copy Email'
    ),
    status && React.createElement('p', { style: { marginTop: '10px', color: status.includes('Error') ? 'red' : 'green' } }, status)
  );
}

/**
 * Example 4: Direct utility usage (non-React)
 * 
 * Use the clipboard utilities outside of React components.
 */
async function utilityExamples() {
  console.log('--- Clipboard Utility Examples ---\n');

  // Simple copyToClipboard utility
  console.log('1. Simple copy utility:');
  const result1 = await copyToClipboard('Simple text to copy');
  console.log(`Copy result: ${result1}\n`);

  // makeCopyFn factory with custom callbacks  
  console.log('2. Custom factory function:');
  const customCopy = makeCopyFn(
    (text) => console.log(`✅ Successfully copied: "${text}"`),
    (error) => console.log(`❌ Copy failed: ${error}`)
  );
  
  await customCopy('Text with custom callbacks');
  await customCopy(''); // This will trigger error callback
  console.log('');

  // Advanced usage with validation
  console.log('3. Advanced usage with validation:');
  const validatedCopy = makeCopyFn(
    (text) => {
      console.log(`✅ Copied ${text.length} characters`);
      if (text.includes('@')) {
        console.log('📧 Detected email address');
      }
    },
    (error) => console.log(`❌ Validation failed: ${error}`)
  );

  await validatedCopy('admin@example.com');
  await validatedCopy(123); // Invalid type
}

/**
 * Example 5: Dynamic content copying
 * 
 * Copy dynamically generated content like API responses or form data.
 */
function DynamicContentExample() {
  const [data, setData] = React.useState({ id: 1, name: 'John Doe', email: 'john@example.com' });
  const [copyText, isLoading] = useClipboard({
    successMessage: "Data copied as JSON!",
    errorMessage: "Failed to copy data"
  });

  const copyAsJSON = async () => {
    const jsonString = JSON.stringify(data, null, 2);
    await copyText(jsonString);
  };

  const copyAsCSV = async () => {
    const csvString = Object.entries(data)
      .map(([key, value]) => `${key},${value}`)
      .join('\n');
    await copyText(csvString);
  };

  return React.createElement('div', {},
    React.createElement('h3', {}, 'Current Data:'),
    React.createElement('pre', { style: { backgroundColor: '#f5f5f5', padding: '10px' } }, 
      JSON.stringify(data, null, 2)
    ),
    React.createElement('button', { 
      onClick: copyAsJSON, 
      disabled: isLoading,
      style: { marginRight: '10px' }
    }, 
    'Copy as JSON'
    ),
    React.createElement('button', { 
      onClick: copyAsCSV, 
      disabled: isLoading 
    }, 
    'Copy as CSV'
    )
  );
}

/**
 * Example 6: Share functionality
 * 
 * Create shareable content with clipboard integration.
 */
function ShareExample() {
  const [copyText, isLoading] = useClipboard({
    successMessage: "Share link copied!",
    errorMessage: "Failed to copy share link"
  });

  const createShareUrl = (content) => {
    const encoded = encodeURIComponent(content);
    return `https://example.com/share?content=${encoded}`;
  };

  const shareContent = async (content) => {
    const shareUrl = createShareUrl(content);
    await copyText(shareUrl);
  };

  return React.createElement('div', {},
    React.createElement('h3', {}, 'Share Content:'),
    React.createElement('button', { 
      onClick: () => shareContent('Check out this amazing React library!'), 
      disabled: isLoading,
      style: { marginRight: '10px' }
    }, 
    'Share Text'
    ),
    React.createElement('button', { 
      onClick: () => shareContent(`{
  "library": "QReactUtils",
  "feature": "clipboard",
  "awesome": true
}`), 
      disabled: isLoading 
    }, 
    'Share JSON'
    )
  );
}

// Export examples for use in other files
module.exports = {
  BasicCopyExample,
  CustomMessageExample,
  CustomCallbackExample,
  DynamicContentExample,
  ShareExample,
  utilityExamples
};

// Run utility examples if this file is executed directly
if (require.main === module) {
  utilityExamples().catch(console.error);
}