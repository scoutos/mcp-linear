/**
 * Entry point for the Linear MCP server
 */
import { createStdioServer } from "./mcp/server-stdio";
import { nodeFetch } from "./effects/http";
import { SearchIssuesAction } from "./actions/search-issues";
import { createMCPHandlers } from "./mcp/handlers";
import { getConfig } from "./utils/config";

/**
 * Main application function.
 */
export async function main(): Promise<void> {
  console.error("Linear MCP Server starting...");

  try {
    // Get configuration
    const config = getConfig();

    // Create effects
    const http = nodeFetch;

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
    process.exit(1);
  }
}

export { createStdioServer };
