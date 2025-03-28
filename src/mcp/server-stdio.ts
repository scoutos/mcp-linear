/**
 * MCP server implementation for stdio transport
 */
import { MCPHandlers } from "./handlers";
import { MCPRequest, MCPResponse, MCPToolsResponse } from "../types/mcp";
import { StdioTransport } from "./transport-stdio";

/**
 * Create and initialize an MCP server using stdio transport
 */
export async function createStdioServer(handlers: MCPHandlers): Promise<void> {
  const transport = new StdioTransport();

  // Start listening for requests
  await transport.listen(async (request: MCPRequest) => {
    // Process requests based on the path
    switch (request.path) {
      case undefined:
      case "/":
        // Server info request
        return {
          id: request.id,
          result: {
            name: "Linear MCP Server",
            version: "0.1.0",
            description: "MCP server for Linear issue tracking",
          },
        };

      case "/tools":
        // List available tools
        const toolsResponse: MCPToolsResponse = {
          tools: [
            {
              name: "linear-search",
              description: "Search Linear issues",
            },
            {
              name: "linear-issue",
              description: "Get, update, or add comments to Linear issues",
            },
          ],
        };

        return {
          id: request.id,
          result: toolsResponse,
        };

      case "/tools/linear-search":
        // Search issues
        return await handlers.searchIssues(request);

      case "/tools/linear-issue":
        // Check the operation type from request params
        if (request.params?.operation === "get") {
          return await handlers.getIssue(request);
        } else if (request.params?.operation === "update") {
          return await handlers.updateIssue(request);
        } else if (request.params?.operation === "comment") {
          return await handlers.addComment(request);
        }

        // Invalid operation
        return {
          id: request.id,
          error: {
            message:
              "Invalid operation. Must specify 'get', 'update', or 'comment'.",
          },
        };

      default:
        // Unknown path
        return {
          id: request.id,
          error: {
            message: `Unknown path: ${request.path}`,
          },
        };
    }
  });
}
