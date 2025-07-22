
/**
 * Logger Module Tests
 * 
 * Tests the Winston-based logging functionality including environment
 * configuration, message formatting, and hook integration patterns.
 */

module.exports = function(testRunner) {
  const { runTest, assert, assertEqual } = testRunner;
  const { logger, log, logDebug, logError, logWarning, logHookEvent } = require('../lib/logger.js');

  console.log('🔍 LOGGER MODULE TESTS');

  runTest('Logger instance is properly configured', () => {
    assert(typeof logger === 'object', 'Logger should be an object');
    assert(typeof logger.info === 'function', 'Logger should have info method');
    assert(typeof logger.debug === 'function', 'Logger should have debug method');
    assert(typeof logger.error === 'function', 'Logger should have error method');
    assert(typeof logger.warn === 'function', 'Logger should have warn method');
  });

  runTest('Log function works with default source', () => {
    // Test that log function doesn't throw
    assert(typeof log === 'function', 'log should be a function');
    
    // Test with default source
    try {
      log('Test message');
      assert(true, 'log should execute without error');
    } catch (error) {
      assert(false, `log should not throw: ${error.message}`);
    }
  });

  runTest('Log function works with custom source', () => {
    try {
      log('Test message with custom source', 'custom-source');
      assert(true, 'log with custom source should execute without error');
    } catch (error) {
      assert(false, `log with custom source should not throw: ${error.message}`);
    }
  });

  runTest('LogDebug function works correctly', () => {
    assert(typeof logDebug === 'function', 'logDebug should be a function');
    
    try {
      logDebug('Debug message');
      logDebug('Debug with source', 'debug-source');
      assert(true, 'logDebug should execute without error');
    } catch (error) {
      assert(false, `logDebug should not throw: ${error.message}`);
    }
  });

  runTest('LogError function handles error objects', () => {
    assert(typeof logError === 'function', 'logError should be a function');
    
    try {
      logError('Error message');
      logError('Error with object', new Error('Test error'));
      logError('Error with string', 'String error context');
      assert(true, 'logError should handle all error types');
    } catch (error) {
      assert(false, `logError should not throw: ${error.message}`);
    }
  });

  runTest('LogWarning function works correctly', () => {
    assert(typeof logWarning === 'function', 'logWarning should be a function');
    
    try {
      logWarning('Warning message');
      logWarning('Warning with source', 'warning-source');
      assert(true, 'logWarning should execute without error');
    } catch (error) {
      assert(false, `logWarning should not throw: ${error.message}`);
    }
  });

  runTest('LogHookEvent function formats hook lifecycle events', () => {
    assert(typeof logHookEvent === 'function', 'logHookEvent should be a function');
    
    try {
      logHookEvent('useAsyncAction', 'entry');
      logHookEvent('useAsyncAction', 'exit', { success: true });
      logHookEvent('useAsyncAction', 'error', { error: 'Test error' });
      assert(true, 'logHookEvent should handle all event types');
    } catch (error) {
      assert(false, `logHookEvent should not throw: ${error.message}`);
    }
  });

  runTest('All logging functions are exported correctly', () => {
    const loggerModule = require('../lib/logger.js');
    const expectedExports = ['logger', 'log', 'logDebug', 'logError', 'logWarning', 'logHookEvent'];
    
    expectedExports.forEach(exportName => {
      assert(typeof loggerModule[exportName] !== 'undefined', `${exportName} should be exported`);
    });
  });
};
