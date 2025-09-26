#!/usr/bin/env node

/**
 * Unified Test Runner for React Hooks Utility Library
 * 
 * Runs all organized test suites in the proper order:
 * 1. Setup and helper tests
 * 2. Core functionality tests
 * 3. Feature-specific tests (clipboard, components, utils)
 */

const path = require('path');
const { spawn } = require('child_process');

// Test files to run in order
const testFiles = [
  'tests/setup/test-helpers.js',  // Setup first
  'tests/internal-helpers.test.js', // Core helpers
  'tests/logger.test.js',         // Logger tests
  'tests/main.spec.js',           // Main comprehensive test suite
  'tests/clipboard/clipboard.spec.js', // Clipboard functionality
  'tests/components/lazy-image.spec.js', // Component tests
  'tests/utils/vitest-parser.spec.js'    // Utility tests
];

console.log('🧪 React Hooks Library Test Suite');
console.log('=================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function runTest(testFile) {
  console.log(`Running: ${testFile}`);
  
  return new Promise((resolve) => {
    const testProcess = spawn('node', [testFile], {
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    let output = '';
    let errorOutput = '';
    
    testProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    testProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ PASSED\n');
        passedTests++;
      } else {
        console.log('❌ FAILED\n');
        failedTests++;
        if (output) console.log('Output:', output);
        if (errorOutput) console.log('Error:', errorOutput);
      }
      totalTests++;
      resolve(code);
    });
  });
}

async function runAllTests() {
  console.log(`Running ${testFiles.length} test suites...\n`);
  
  for (const testFile of testFiles) {
    await runTest(testFile);
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  console.log(`Total test suites: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All test suites passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some test suites failed');
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };