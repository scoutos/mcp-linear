#!/usr/bin/env -S deno run --allow-env --allow-stdio

// Main entry point for the Linear MCP server
import { createStdioServer } from "./mcp/server-stdio.ts";
import { denoFetch } from "./effects/http/deno-fetch.ts";
import { SearchIssuesAction } from "./actions/search-issues.ts";
import { createMCPHandlers } from "./mcp/handlers.ts";
import { getConfig } from "./utils/config.ts";

/**
 * Main application function.
 */
export async function main() {
  console.error("Linear MCP Server starting...");

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

    // Start stdio server
    await createStdioServer(handlers);
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

export { createStdioServer };
