/**
 * Test Utilities - Vitest Result Parsing
 * 
 * Utilities for parsing and processing test framework outputs,
 * particularly Vitest test results for integration with CI/CD pipelines
 * and test reporting systems.
 */

/**
 * Parses Vitest test output to extract test results and statistics
 * 
 * @param {string} output - The stdout from vitest execution
 * @param {string} errorOutput - The stderr from vitest execution (optional)
 * @returns {Object} Parsed test results with counts and failure details
 */
function parseVitestResults(output, errorOutput = '') {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    failures: []
  };

  // First, try to parse the main "Tests" line (individual test count)
  const testsMatch = output.match(/Tests\s+(\d+)\s+passed(?:,\s*(\d+)\s+failed)?/);
  
  if (testsMatch) {
    results.passed = parseInt(testsMatch[1]) || 0;
    results.failed = parseInt(testsMatch[2]) || 0;
    results.total = results.passed + results.failed;
  } else {
    // Fallback to "Test Files" if "Tests" line not found
    const testFilesMatch = output.match(/Test Files\s+(\d+)\s+passed(?:,\s*(\d+)\s+failed)?/);
    
    if (testFilesMatch) {
      results.passed = parseInt(testFilesMatch[1]) || 0;
      results.failed = parseInt(testFilesMatch[2]) || 0;
      results.total = results.passed + results.failed;
    } else {
      // Final fallback: parse simple "X passed" or "X failed" format
      const passedMatch = output.match(/(\d+)\s+passed/);
      const failedMatch = output.match(/(\d+)\s+failed/);
      
      if (passedMatch) results.passed = parseInt(passedMatch[1]);
      if (failedMatch) results.failed = parseInt(failedMatch[1]);
      results.total = results.passed + results.failed;
    }
  }

  // If no tests counted but there's error output, count as failures
  if (results.total === 0 && errorOutput) {
    results.failed = 1;
    results.total = 1;
    results.failures.push({
      test: 'Vitest configuration',
      error: errorOutput.substring(0, 200) + (errorOutput.length > 200 ? '...' : '')
    });
  }

  // Extract specific failure details - only individual test failures, not file summaries
  const lines = output.split('\n');
  const failureLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('✗ ') && !trimmed.includes('(') && !trimmed.includes(')');
  });
  
  if (failureLines.length > 0) {
    results.failures.push(...failureLines.map(failure => ({
      test: failure.replace(/^\s*✗\s+/, '').trim(),
      error: 'See vitest output above for details'
    })));
  }

  return results;
}

module.exports = {
  parseVitestResults
};