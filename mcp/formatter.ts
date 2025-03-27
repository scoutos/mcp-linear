/**
 * MCP response formatters
 */
import { MCPResponse } from "../types/mcp.ts";

/**
 * Format an MCP response into a standard HTTP response
 */
export function formatMCPResponse(response: MCPResponse): Response {
  const status = response.error ? 400 : 200;
  
  return new Response(
    JSON.stringify(response.data),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Create an error response
 */
export function createErrorResponse(message: string, code = "INTERNAL_ERROR", status = 500): Response {
  return new Response(
    JSON.stringify({
      error: {
        message,
        code,
      },
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}