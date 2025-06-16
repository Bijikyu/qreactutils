/**
 * Clean Test Runner - Suppresses verbose output, shows clear pass/fail results
 */

// Completely silence library logging during tests
const originalConsole = console.log;
console.log = () => {};

// Import the test file which will execute with silenced output
require('./test.js');

// Note: The test.js file has its own pass/fail reporting built in
// This wrapper just suppresses the verbose function logging that clutters the output