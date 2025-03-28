// Main entry point for the Linear MCP server
import { createServer, DEFAULT_PORT } from "./mcp/server.ts";
import { denoFetch } from "./effects/http/deno-fetch.ts";
import { SearchIssuesAction } from "./actions/search-issues.ts";
import { createMCPHandlers } from "./mcp/handlers.ts";
import { getConfig } from "./utils/config.ts";

/**
 * Main application function.
 */
export function main() {
  console.log("Linear MCP Server starting...");

  try {
    // Get configuration
    const config = getConfig();

    // Create effects
    const http = denoFetch;

    // Create actions
    const searchIssues = SearchIssuesAction({ http });

    // Create handlers with real actions
    const handlers = createMCPHandlers({
      actions: { searchIssues },
      config,
    });

    // Create server handler
    const handler = createServer(handlers);

    // Start server
    const port = Number(Deno.env.get("PORT") || DEFAULT_PORT);
    console.log(`Server listening on http://localhost:${port}`);

    // Serve HTTP requests using Deno's built-in server
    return Deno.serve({ port }, handler);
  } catch (error) {
    console.error(
      "Failed to start server:",
      error instanceof Error ? error.message : String(error),
    );
    console.error("Make sure the LINEAR_API_KEY environment variable is set");
    Deno.exit(1);
  }
}

// Run the application
if (import.meta.main) {
  main();
}

export { createServer };
