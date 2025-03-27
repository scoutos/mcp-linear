// Main entry point for the Linear MCP server
import { createServer, DEFAULT_PORT } from "./mcp/server.ts";

/**
 * Main application function.
 */
export function main() {
  console.log("Linear MCP Server starting...");

  // Create server handler
  const handler = createServer();

  // Start server
  const port = Number(Deno.env.get("PORT") || DEFAULT_PORT);
  console.log(`Server listening on http://localhost:${port}`);

  // Serve HTTP requests using Deno's built-in server
  return Deno.serve({ port }, handler);
}

// Run the application
if (import.meta.main) {
  main();
}

export { createServer };
