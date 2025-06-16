/**
 * Clean Test Runner - Suppresses verbose output, shows clear pass/fail results
 */

// Completely silence library logging during tests
const originalConsole = console.log; // save so we can restore after loading test file
console.log = () => {}; // disable log output while the suite runs

// Import the test file which will execute with silenced output
require('./test.js'); // test.js will restore console when finished
console.log = originalConsole; // re-enable logging for anything after the suite

// Note: The test.js file has its own pass/fail reporting built in
// This wrapper just suppresses the verbose function logging that clutters the output