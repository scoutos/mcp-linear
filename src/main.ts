import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as tools from "./tools";
import { nodeFetch } from "./effects/http";
import { getConfig } from "./utils/config";

const server = new McpServer({
  name: "Linear",
  version: "0.1.0",
});

// Create context for tools
const config = getConfig();
const toolContext = {
  config,
  effects: {
    http: nodeFetch,
  },
};

// Initialize tools with context
const all_tools = [
  new tools.HelloWorld({}),
  new tools.SearchTickets(toolContext),
];

for (const tool of all_tools) {
  server.tool(
    tool.name,
    tool.description,
    tool.inputSchema.shape,
    (args) => tool.call(args),
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
