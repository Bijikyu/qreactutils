/**
 * Browser Logger Module (Console-based)
 *
 * Why this exists:
 * - The Node logger uses `winston`, which pulls Node core polyfills when bundled for the web.
 * - Shipping Node-only code to the browser causes bundle bloat and runtime errors in modern bundlers
 *   that no longer polyfill Node APIs by default.
 * - This browser-specific implementation mirrors the same public API using `console.*` so consumers
 *   can use `logger`, `log`, `logDebug`, `logError`, `logWarning`, and `logHookEvent` identically
 *   in both environments without branching in app code.
 *
 * Design tradeoff:
 * - We intentionally keep the API identical to the Node version to preserve backward compatibility.
 * - Logging format is simplified for the browser; we prefer reliability and zero-config over parity
 *   with Winston’s formatting features.
 */

// Simple time formatter similar to Node variant, but lightweight
function formatTime() {
  try {
    return new Date().toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true
    });
  } catch {
    return new Date().toISOString();
  }
}

// Minimal logger that mirrors the expected winston-like interface used by this library
const logger = {
  info: (msg) => console.log(`${formatTime()} [info] ${msg}`),
  debug: (msg) => console.log(`${formatTime()} [debug] ${msg}`),
  error: (msg) => console.error(`${formatTime()} [error] ${msg}`),
  warn: (msg) => console.warn(`${formatTime()} [warn] ${msg}`)
};

function log(message, source = 'hooks') {
  logger.info(`[${source}] ${message}`);
}

function logDebug(message, source = 'hooks') {
  logger.debug(`[${source}] ${message}`);
}

function logError(message, error = null, source = 'hooks') {
  const errorInfo = error ? ` - ${error.message || error}` : '';
  logger.error(`[${source}] ${message}${errorInfo}`);
}

function logWarning(message, source = 'hooks') {
  logger.warn(`[${source}] ${message}`);
}

function logHookEvent(hookName, event, data = null) {
  const dataStr = data ? ` - ${(() => { try { return JSON.stringify(data); } catch { return '[unserializable]'; } })()}` : '';
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

