#!/usr/bin/env node
/**
 * CLI entry point for the Linear MCP server
 */
import { main } from "./index";

// Run the application
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
