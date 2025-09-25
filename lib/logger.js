
/**
 * Application Logger Module
 * 
 * Provides centralized logging functionality using Winston with environment-aware
 * log levels and consistent formatting patterns. Integrates with the existing
 * utility patterns in the hooks library.
 */

const winston = require('winston');

// Environment variable configuration with fallbacks
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info');

/**
 * Create console transport with compatibility handling
 * Handles different winston versions and configurations
 */
function createConsoleTransport() {
  try {
    // Try the standard approach first
    return new winston.transports.Console();
  } catch (error) {
    // Fallback for version compatibility issues
    try {
      return new winston.transports.Console({});
    } catch (fallbackError) {
      // If winston is completely broken, create a minimal console logger
      return {
        log: (info) => console.log(`${info.level}: ${info.message}`)
      };
    }
  }
}

/**
 * Main Winston logger instance with time-formatted console output.
 * 
 * Uses 12-hour time format for human-readable timestamps and provides
 * environment-aware log levels (debug in development, info in production).
 */
let logger;
try {
  logger = winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.printf(({ level, message }) => {
      const time = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true 
      });
      return `${time} [${level}] ${message}`;
    }),
    transports: [createConsoleTransport()],
  });
} catch (error) {
  // Fallback to console if winston fails completely
  logger = {
    info: (msg) => console.log(`INFO: ${msg}`),
    debug: (msg) => console.log(`DEBUG: ${msg}`),
    error: (msg) => console.error(`ERROR: ${msg}`),
    warn: (msg) => console.warn(`WARN: ${msg}`)
  };
}

/**
 * Convenience logging function with source identification.
 * 
 * @param {string} message - The message to log
 * @param {string} source - Source identifier (defaults to 'hooks')
 * 
 * Example usage:
 *   log('User authentication completed', 'auth');
 *   log('Dropdown data fetched successfully');
 */
function log(message, source = 'hooks') {
  logger.info(`[${source}] ${message}`);
}

/**
 * Debug-level logging for development troubleshooting.
 * 
 * @param {string} message - Debug message
 * @param {string} source - Source identifier
 */
function logDebug(message, source = 'hooks') {
  logger.debug(`[${source}] ${message}`);
}

/**
 * Error-level logging with optional error object.
 * 
 * @param {string} message - Error message
 * @param {Error|string} error - Error object or additional context
 * @param {string} source - Source identifier
 */
function logError(message, error = null, source = 'hooks') {
  const errorInfo = error ? ` - ${error.message || error}` : '';
  logger.error(`[${source}] ${message}${errorInfo}`);
}

/**
 * Warning-level logging for non-critical issues.
 * 
 * @param {string} message - Warning message
 * @param {string} source - Source identifier
 */
function logWarning(message, source = 'hooks') {
  logger.warn(`[${source}] ${message}`);
}

/**
 * Hook-specific logging wrapper that integrates with existing patterns.
 * 
 * Provides consistent logging for hook lifecycle events with proper
 * source identification for easier debugging.
 * 
 * @param {string} hookName - Name of the hook being logged
 * @param {string} event - Event type (entry, exit, error)
 * @param {any} data - Additional context data
 */
function logHookEvent(hookName, event, data = null) {
  const dataStr = data ? ` - ${JSON.stringify(data)}` : '';
  log(`${hookName} [${event}]${dataStr}`, 'hook-lifecycle');
}

module.exports = {
  logger,
  log,
  logDebug,
  logError,
  logWarning,
  logHookEvent
};
