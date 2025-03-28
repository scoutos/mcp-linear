/**
 * MCP server implementation
 */
import { formatMCPResponse } from "./formatter.ts";
import { createMCPHandlers } from "./handlers.ts";
import { MCPRequest, MCPTool, MCPToolsResponse } from "../types/mcp.ts";

// Default port for the server
export const DEFAULT_PORT = 8000;

/**
 * Create an HTTP handler for the MCP server
 *
 * @param customHandlers Optional custom handlers to use instead of default mock handlers
 */
export function createServer(customHandlers = createMCPHandlers()) {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Root MCP endpoint
    if (path === "/mcp") {
      return new Response(
        JSON.stringify({
          name: "Linear MCP Server",
          version: "0.1.0",
          description: "MCP server for Linear issue tracking",
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // List available tools
    if (path === "/mcp/tools") {
      const tools: MCPTool[] = [
        {
          name: "linear-search",
          description: "Search Linear issues",
          endpoints: [
            {
              path: "/mcp/tools/linear-search",
              method: "POST",
            },
          ],
        },
        {
          name: "linear-issue",
          description: "Get, update, or add comments to Linear issues",
          endpoints: [
            {
              path: "/mcp/tools/linear-issue/{id}",
              method: "GET",
            },
            {
              path: "/mcp/tools/linear-issue/{id}",
              method: "PUT",
            },
            {
              path: "/mcp/tools/linear-issue/{id}/comment",
              method: "POST",
            },
          ],
        },
      ];

      const response: MCPToolsResponse = { tools };

      return new Response(
        JSON.stringify(response),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Search Linear issues
    if (path === "/mcp/tools/linear-search" && method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch (_e) {
        return new Response(
          JSON.stringify({ error: "Invalid JSON body" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Create MCP request
      const mcpRequest: MCPRequest = {
        id: crypto.randomUUID(),
        params: body,
      };

      // Use search handler
      const response = await customHandlers.searchIssues(mcpRequest);

      // Format response
      return formatMCPResponse(response);
    }

    // Get issue details
    if (
      path.match(/^\/mcp\/tools\/linear-issue\/[\w-]+$/) && method === "GET"
    ) {
      const issueId = path.split("/").pop() || "";

      // Create MCP request
      const mcpRequest: MCPRequest = {
        id: crypto.randomUUID(),
        params: { id: issueId },
      };

      // Use get issue handler
      const response = await customHandlers.getIssue(mcpRequest);

      // Format response
      return formatMCPResponse(response);
    }

    // Update issue
    if (
      path.match(/^\/mcp\/tools\/linear-issue\/[\w-]+$/) && method === "PUT"
    ) {
      let body;
      try {
        body = await request.json();
      } catch (_e) {
        return new Response(
          JSON.stringify({ error: "Invalid JSON body" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const issueId = path.split("/").pop() || "";

      // Create MCP request
      const mcpRequest: MCPRequest = {
        id: crypto.randomUUID(),
        params: {
          id: issueId,
          ...body,
        },
      };

      // Use update issue handler
      const response = await customHandlers.updateIssue(mcpRequest);

      // Format response
      return formatMCPResponse(response);
    }

    // Add comment to issue
    if (
      path.match(/^\/mcp\/tools\/linear-issue\/[\w-]+\/comment$/) &&
      method === "POST"
    ) {
      let body;
      try {
        body = await request.json();
      } catch (_e) {
        return new Response(
          JSON.stringify({ error: "Invalid JSON body" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const issueId = path.split("/").pop()?.replace("/comment", "") || "";

      // Create MCP request
      const mcpRequest: MCPRequest = {
        id: crypto.randomUUID(),
        params: {
          id: issueId,
          ...body,
        },
      };

      // Use add comment handler
      const response = await customHandlers.addComment(mcpRequest);

      // Format response
      return formatMCPResponse(response);
    }

    // Not found
    return new Response(
      JSON.stringify({ error: "Not found" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      },
    );
  };
}
