/**
 * Main entry point for the MCP Linear server using the official MCP SDK
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as tools from './tools/mod.js';
import { getConfig } from './utils/config/mod.js';
import { createLogger, LogLevel } from './effects/logging/mod.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.resolve(__dirname, '../logs');

// Make sure log directory exists
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (err) {
  // If we can't create logs directory, we'll fallback to noop logger
}

// Create a logger for stdio transport - logs to file instead of stdout/stderr
const logFile = path.join(logDir, 'mcp-linear.log');

// Get log level from environment variable or use defaults
const logLevelEnv = process.env.LOG_LEVEL?.toUpperCase();
let logLevel = LogLevel.INFO; // Default for production

if (logLevelEnv) {
  // Allow setting log level through environment variable
  if (logLevelEnv === 'DEBUG') logLevel = LogLevel.DEBUG;
  if (logLevelEnv === 'INFO') logLevel = LogLevel.INFO;
  if (logLevelEnv === 'WARN') logLevel = LogLevel.WARN;
  if (logLevelEnv === 'ERROR') logLevel = LogLevel.ERROR;
} else if (process.env.NODE_ENV === 'development') {
  // In development, default to DEBUG
  logLevel = LogLevel.DEBUG;
}

// Use stdio transport, so we need file logging
const logger = createLogger({
  useStdio: true,
  logFile,
  minLevel: logLevel,
});

// Save the original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

// Only output initial messages in development mode to avoid
// polluting Claude desktop interface
if (process.env.NODE_ENV === 'development') {
  originalConsole.log('Starting Linear MCP server...');
  originalConsole.log('Redirecting logs to:', logFile);
}

// Override console methods to use our logger
// This prevents logs from interfering with MCP protocol messages
console.log = message => logger.info(message);
console.info = message => logger.info(message);
console.warn = message => logger.warn(message);
console.error = message => logger.error(message);
console.debug = message => logger.debug(message);

/**
 * Initialize and run the MCP Linear server
 */
async function main() {
  logger.info('Initializing MCP Linear server');

  // Define server info
  const serverInfo = {
    name: 'Linear',
    version: '0.1.0',
    description: 'Linear issue tracking integration',
  };

  // Create MCP server using the SDK
  const server = new McpServer(serverInfo);

  try {
    // Load configuration
    const config = await getConfig(logger);

    // Import Linear effect
    const { createLinearClient } = await import('./effects/linear/index.js');

    // Create context for tools
    const toolContext = {
      config,
      effects: {
        logger,
        linear: {
          createClient: apiKey => createLinearClient(apiKey),
        },
      },
    };

    // Initialize tools with context
    const all_tools = [
      new tools.ListIssues(toolContext),
      new tools.GetIssue(toolContext),
      new tools.ListMembers(toolContext),
      new tools.ListProjects(toolContext),
      new tools.AddComment(toolContext),
      new tools.CreateIssue(toolContext),
    ];

    // Register tools with the MCP server
    for (const tool of all_tools) {
      server.tool(
        tool.name,
        tool.description,
        tool.inputSchema.shape ?? {},
        async args => {
          try {
            // Call our tool
            const result = await tool.call(args);

            // Return format expected by MCP SDK
            return {
              content: result.content,
              error: result.isError
                ? {
                    message: result.content[0]?.text || 'An error occurred',
                  }
                : undefined,
            };
          } catch (error) {
            logger.error(`Error executing tool ${tool.name}: ${error.message}`);
            return {
              content: [{ type: 'text', text: `Error: ${error.message}` }],
              error: { message: error.message },
            };
          }
        }
      );
    }

    // Log server information to the file
    logger.info('=== MCP Server Information ===');
    logger.info(`Name: ${serverInfo.name}`);
    logger.info(`Version: ${serverInfo.version}`);
    logger.info('Tools available:');

    // Log information about the available tools
    // Note: We're using all_tools directly instead of accessing private _registeredTools
    for (const tool of all_tools) {
      logger.info(`  * ${tool.name}: ${tool.description}`);
    }

    // Only show verbose output in development mode
    if (process.env.NODE_ENV === 'development') {
      // Use original console to output visible information to terminal
      // before we start the transport
      originalConsole.log('\n=== MCP Server Information ===');
      originalConsole.log('\nThe MCP server is running in stdio mode.');
      originalConsole.log('To connect with the MCP Inspector, run:');
      originalConsole.log('npx @modelcontextprotocol/inspector');
      originalConsole.log(
        'or visit: https://inspector.modelcontextprotocol.ai'
      );
      originalConsole.log('\nServer info:');
      originalConsole.log(`\n- Name: ${serverInfo.name}`);
      originalConsole.log(`- Version: ${serverInfo.version}`);
      originalConsole.log('- Tools available:');

      // Log all registered tools
      for (const tool of all_tools) {
        originalConsole.log(`  * ${tool.name}: ${tool.description}`);
      }

      originalConsole.log('\n==============================\n');
      originalConsole.log(
        'STDIO transport activated. All further logs redirected to:',
        logFile
      );
    }

    // Create a stdio transport
    const transport = new StdioServerTransport();

    // Connect the server to the transport
    logger.info('Starting STDIO transport');
    await server.connect(transport);
  } catch (error) {
    logger.error(`Failed to start MCP server: ${error.message}`);
    // Use the original console to make sure the error is visible
    originalConsole.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Run the server
main().catch(error => {
  logger.error(`Unhandled error: ${error.message}`);
  // Use the original console to make sure the error is visible
  originalConsole.error('Unhandled error:', error);
  process.exit(1);
});
