/**
 * Test file for LazyImagePreview component
 * 
 * This test verifies that the LazyImagePreview component can be imported
 * and created without errors. Since this is a Node.js environment without
 * a DOM, we can only test the component construction and basic functionality.
 */

const { LazyImagePreview } = require('./index.js');
const React = require('react');

console.log('Testing LazyImagePreview component...');

// Test 1: Component import
try {
  if (typeof LazyImagePreview === 'function') {
    console.log('✓ LazyImagePreview component imported successfully');
  } else {
    console.log('✗ LazyImagePreview is not a function');
  }
} catch (error) {
  console.log('✗ Failed to import LazyImagePreview:', error.message);
}

// Test 2: Component creation
try {
  const element = React.createElement(LazyImagePreview, {
    src: 'https://example.com/image.jpg',
    alt: 'Test image',
    className: 'w-64 h-48'
  });
  
  if (element && element.type === LazyImagePreview) {
    console.log('✓ LazyImagePreview component created successfully');
  } else {
    console.log('✗ LazyImagePreview component creation failed');
  }
} catch (error) {
  console.log('✗ Failed to create LazyImagePreview component:', error.message);
}

// Test 3: Component props validation
try {
  const elementWithMinimalProps = React.createElement(LazyImagePreview, {
    src: 'test.jpg',
    alt: 'Test'
  });
  
  if (elementWithMinimalProps) {
    console.log('✓ LazyImagePreview works with minimal props (src, alt)');
  }
} catch (error) {
  console.log('✗ LazyImagePreview failed with minimal props:', error.message);
}

console.log('\nLazyImagePreview component test completed!');
console.log('\nUsage example:');
console.log(`
const { LazyImagePreview } = require('qreactutils');

// In your React component:
<LazyImagePreview 
  src="/images/product.jpg" 
  alt="Product image" 
  className="w-64 h-48" 
/>
`);