/**
 * Test script for parseVitestResults function
 * 
 * This test validates that the parseVitestResults function correctly
 * parses various Vitest output formats and extracts test statistics.
 */

const { parseVitestResults } = require('../../index.js');

// Test cases with different Vitest output formats
const testCases = [
  {
    name: 'Standard passing tests',
    output: `
 ✓ src/utils.test.js (3)
 ✓ src/components.test.js (5)

Test Files  2 passed (2)
Tests  8 passed (8)
Start at 10:30:45
Duration  1.2s
`,
    expected: { total: 8, passed: 8, failed: 0, failures: [] }
  },
  {
    name: 'Mixed passing and failing tests',
    output: `
 ✓ src/utils.test.js (3)
 ✗ src/components.test.js (2)
   ✗ Component renders correctly
   ✗ Component handles clicks

Test Files  1 passed, 1 failed (2)
Tests  3 passed, 2 failed (5)
`,
    expected: { 
      total: 5, 
      passed: 3, 
      failed: 2, 
      failures: [
        { test: 'Component renders correctly', error: 'See vitest output above for details' },
        { test: 'Component handles clicks', error: 'See vitest output above for details' }
      ]
    }
  },
  {
    name: 'Configuration error',
    output: '',
    errorOutput: 'Error: Failed to load config from vite.config.js',
    expected: { 
      total: 1, 
      passed: 0, 
      failed: 1, 
      failures: [
        { test: 'Vitest configuration', error: 'Error: Failed to load config from vite.config.js' }
      ]
    }
  },
  {
    name: 'Simple passed format',
    output: '5 passed',
    expected: { total: 5, passed: 5, failed: 0, failures: [] }
  },
  {
    name: 'Simple failed format',
    output: '3 failed',
    expected: { total: 3, passed: 0, failed: 3, failures: [] }
  }
];

console.log('Testing parseVitestResults function\n');

let allPassed = true;

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.name}`);
  
  const result = parseVitestResults(testCase.output, testCase.errorOutput);
  
  // Check if result matches expected
  const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);
  
  if (passed) {
    console.log('✓ PASSED');
  } else {
    console.log('✗ FAILED');
    console.log('Expected:', testCase.expected);
    console.log('Actual:', result);
    allPassed = false;
  }
  
  console.log('');
});

if (allPassed) {
  console.log('🎉 All tests passed! parseVitestResults function is working correctly.');
} else {
  console.log('❌ Some tests failed. Please check the implementation.');
}