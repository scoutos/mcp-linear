import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as tools from "./effects/tools/mod.ts";
import { getConfig } from "./effects/config/mod.ts";
import { denoFetch } from "./effects/http/deno-fetch.ts";

/**
 * Main entry point for the Deno MCP server
 */
const server = new McpServer({
  name: "Linear",
  version: "0.1.0",
  description: "Linear issue tracking integration",
});

// Create context for tools
const config = getConfig();
const toolContext = {
  config,
  effects: {
    http: denoFetch,
  },
};

// Initialize tools with context
const all_tools = [
  new tools.HelloWorld({}),
  new tools.SearchTickets(toolContext),
];

// Register tools with the MCP server
for (const tool of all_tools) {
  server.tool(
    tool.name,
    tool.description,
    tool.inputSchema.shape,
    (args) => tool.call(args),
  );
}

/**
 * Start the MCP server
 */
async function main() {
  console.log("Starting Linear MCP server...");
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Run the server
if (import.meta.main) {
  main();
}
