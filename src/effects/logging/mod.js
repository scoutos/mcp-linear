/**
 * Logging effect interface and implementations
 *
 * This module provides different logging implementations that can be used
 * depending on the environment. When using STDIO transport for MCP, we need
 * to avoid writing to stdout/stderr to prevent corrupting the MCP protocol.
 *
 * It also includes a test adapter for testing components that use logging.
 */
import fs from 'fs';

/**
 * Log levels
 * @enum {string}
 */
export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

/**
 * @typedef {Object} LoggingEffect
 * @property {(message: string, context?: Object) => void} debug - Log a debug message
 * @property {(message: string, context?: Object) => void} info - Log an info message
 * @property {(message: string, context?: Object) => void} warn - Log a warning message
 * @property {(message: string, context?: Object) => void} error - Log an error message
 */

/**
 * No-op logger that doesn't output anything
 * Use this with STDIO transport to avoid corrupting MCP protocol messages
 *
 * @type {LoggingEffect}
 */
export const noopLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

/**
 * File logger that writes logs to a file instead of stdout/stderr
 *
 * @param {string} filePath - Path to the log file
 * @returns {LoggingEffect} A logger that writes to a file
 */
export function createFileLogger(filePath) {
  let logBuffer = [];
  let isWriting = false;

  // Function to flush logs to file
  const flushLogs = async () => {
    if (isWriting || logBuffer.length === 0) return;

    isWriting = true;
    const currentLogs = [...logBuffer];
    logBuffer = [];

    try {
      await fs.promises.appendFile(filePath, currentLogs.join('\n') + '\n');
    } catch (error) {
      // If we can't write to the file, just drop the logs in STDIO mode
      // since writing to console would corrupt the protocol
      isWriting = false;
    } finally {
      isWriting = false;

      // If new logs arrived while we were writing, flush again
      if (logBuffer.length > 0) {
        flushLogs();
      }
    }
  };

  // Create timestamp prefix
  const timestamp = () => new Date().toISOString();

  return {
    debug: message => {
      logBuffer.push(`${timestamp()} [DEBUG] ${message}`);
      flushLogs();
    },
    info: message => {
      logBuffer.push(`${timestamp()} [INFO] ${message}`);
      flushLogs();
    },
    warn: message => {
      logBuffer.push(`${timestamp()} [WARN] ${message}`);
      flushLogs();
    },
    error: message => {
      logBuffer.push(`${timestamp()} [ERROR] ${message}`);
      flushLogs();
    },
  };
}

/**
 * Console logger that writes to stdout/stderr
 * Use this when NOT using STDIO transport for MCP
 *
 * @param {LogLevel} [minLevel=LogLevel.INFO] - Minimum log level to output
 * @returns {LoggingEffect} A logger that writes to the console
 */
export function createConsoleLogger(minLevel = LogLevel.INFO) {
  const levels = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
  };

  const minLevelValue = levels[minLevel] || levels[LogLevel.INFO];

  return {
    debug: message => {
      if (levels[LogLevel.DEBUG] >= minLevelValue) {
        console.debug(`[DEBUG] ${message}`);
      }
    },
    info: message => {
      if (levels[LogLevel.INFO] >= minLevelValue) {
        console.info(`[INFO] ${message}`);
      }
    },
    warn: message => {
      if (levels[LogLevel.WARN] >= minLevelValue) {
        console.warn(`[WARN] ${message}`);
      }
    },
    error: message => {
      if (levels[LogLevel.ERROR] >= minLevelValue) {
        console.error(`[ERROR] ${message}`);
      }
    },
  };
}

/**
 * Create a default logger based on the environment
 *
 * @param {Object} options - Logger options
 * @param {boolean} [options.useStdio=false] - Whether we're using STDIO transport for MCP
 * @param {string} [options.logFile] - Path to log file (if file logging is desired)
 * @param {LogLevel} [options.minLevel=LogLevel.INFO] - Minimum log level
 * @returns {LoggingEffect} An appropriate logger for the environment
 */
export function createLogger({
  useStdio = false,
  logFile,
  minLevel = LogLevel.INFO,
} = {}) {
  // If using STDIO transport, we need to avoid writing to stdout/stderr
  if (useStdio) {
    // If a log file is specified, use file logging
    if (logFile) {
      return createFileLogger(logFile);
    }
    // Otherwise, use no-op logger
    return noopLogger;
  }

  // For non-STDIO transports, use console logger
  return createConsoleLogger(minLevel);
}

// Export test adapter
export * from './test-adapter.js';
