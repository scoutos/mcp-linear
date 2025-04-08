/**
 * Logging effect test adapter for tests
 */

/**
 * @typedef {Object} LogEntry
 * @property {string} message - The log message
 * @property {Object|undefined} [context] - Optional context object
 * @property {Date} timestamp - When the log was created
 * @property {string} level - Log level (debug, info, warn, error)
 */

/**
 * @typedef {Object} TestLoggerOptions
 * @property {Function|null} [callback] - Optional callback function for each log entry
 * @property {boolean} [captureStackTraces=false] - Whether to capture stack traces for errors
 * @property {boolean} [silent=true] - Whether to suppress console output
 */

/**
 * Creates a test logger that captures logs for assertions in tests
 *
 * @param {TestLoggerOptions} [options={}] - Options for configuring the test logger
 * @returns {import('./mod.js').LoggingEffect & { logs: Record<string, LogEntry[]>, clear: Function }} - Logging effect with captured logs
 */
export function createTestLogger({
  callback = null,
  captureStackTraces = false,
  silent = true,
} = {}) {
  /** @type {Record<string, LogEntry[]>} */
  const logs = {
    debug: [],
    info: [],
    warn: [],
    error: [],
  };

  /**
   * Creates a log entry and stores it
   *
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} [context] - Optional context
   */
  const createLogEntry = (level, message, context) => {
    const entry = {
      message,
      context,
      timestamp: new Date(),
      level,
    };

    // Add stack trace for errors if enabled
    if (level === 'error' && captureStackTraces) {
      entry.stack = new Error().stack;
    }

    // Store the log entry
    logs[level].push(entry);

    // Call the callback if provided
    if (callback) {
      callback(entry);
    }

    // Output to console if not silent
    if (!silent) {
      const consoleMethod = console[level] || console.log;
      if (context) {
        consoleMethod(`[${level.toUpperCase()}] ${message}`, context);
      } else {
        consoleMethod(`[${level.toUpperCase()}] ${message}`);
      }
    }
  };

  return {
    logs,

    /**
     * Clear all captured logs
     */
    clear() {
      logs.debug = [];
      logs.info = [];
      logs.warn = [];
      logs.error = [];
    },

    /**
     * Log a debug message
     *
     * @param {string} message - Debug message
     * @param {Object} [context] - Optional context
     */
    debug(message, context) {
      createLogEntry('debug', message, context);
    },

    /**
     * Log an info message
     *
     * @param {string} message - Info message
     * @param {Object} [context] - Optional context
     */
    info(message, context) {
      createLogEntry('info', message, context);
    },

    /**
     * Log a warning message
     *
     * @param {string} message - Warning message
     * @param {Object} [context] - Optional context
     */
    warn(message, context) {
      createLogEntry('warn', message, context);
    },

    /**
     * Log an error message
     *
     * @param {string} message - Error message
     * @param {Object} [context] - Optional context
     */
    error(message, context) {
      createLogEntry('error', message, context);
    },
  };
}
