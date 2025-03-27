/**
 * MCP server implementation
 */
import { MCPTool, MCPToolsResponse } from "../types/mcp.ts";

// Default port for the server
export const DEFAULT_PORT = 8000;

/**
 * Create an HTTP handler for the MCP server
 */
export function createServer() {
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
        }
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
        }
      );
    }
    
    // Search Linear issues
    if (path === "/mcp/tools/linear-search" && method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return new Response(
          JSON.stringify({ error: "Invalid JSON body" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      
      // Return mock search results for now
      return new Response(
        JSON.stringify({
          results: [
            {
              id: "TEST-123",
              title: "Test Issue",
              description: "This is a test issue",
              status: "In Progress",
            },
          ],
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Get issue details
    if (path.match(/^\/mcp\/tools\/linear-issue\/[\w-]+$/) && method === "GET") {
      const issueId = path.split("/").pop();
      
      // Return mock issue details
      return new Response(
        JSON.stringify({
          issue: {
            id: issueId,
            title: "Test Issue",
            description: "This is a test issue",
            status: "In Progress",
            comments: [
              {
                id: "comment-1",
                body: "This is a test comment",
                createdAt: new Date().toISOString(),
              },
            ],
          },
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Update issue
    if (path.match(/^\/mcp\/tools\/linear-issue\/[\w-]+$/) && method === "PUT") {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return new Response(
          JSON.stringify({ error: "Invalid JSON body" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      
      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          issue: {
            id: path.split("/").pop(),
            ...body,
          },
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Add comment to issue
    if (path.match(/^\/mcp\/tools\/linear-issue\/[\w-]+\/comment$/) && method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return new Response(
          JSON.stringify({ error: "Invalid JSON body" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      
      // Return success response with mock comment
      return new Response(
        JSON.stringify({
          success: true,
          comment: {
            id: `comment-${Date.now()}`,
            body: body.body,
            createdAt: new Date().toISOString(),
          },
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Not found
    return new Response(
      JSON.stringify({ error: "Not found" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  };
}