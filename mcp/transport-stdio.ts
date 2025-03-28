/**
 * MCP stdio transport implementation
 */
import { MCPRequest, MCPResponse } from "../types/mcp.ts";

/**
 * Transport interface for server communication
 */
export interface Transport {
  listen: (
    handler: (request: MCPRequest) => Promise<MCPResponse>,
  ) => Promise<void>;
}

/**
 * StdioTransport implements the Transport interface using stdio
 * This is what MCP clients like Claude Desktop expect to use
 */
export class StdioTransport implements Transport {
  /**
   * Listen for incoming messages on stdin and write responses to stdout
   */
  async listen(
    handler: (request: MCPRequest) => Promise<MCPResponse>,
  ): Promise<void> {
    console.error("Linear MCP Server running on stdio");

    // Create a TextDecoder for stdin
    const decoder = new TextDecoder();

    // Listen for incoming data on stdin
    for await (const chunk of Deno.stdin.readable) {
      try {
        // Decode and parse the incoming message
        const message = decoder.decode(chunk);
        const request = JSON.parse(message) as MCPRequest;

        // Log the request to stderr (not stdout, which is reserved for responses)
        console.error(`Received request: ${request.id}`);

        // Process the request
        const response = await handler(request);

        // Send the response
        await this.sendResponse(response);
      } catch (error) {
        console.error("Error processing request:", error);

        // Send an error response
        const errorResponse: MCPResponse = {
          id: crypto.randomUUID(),
          error: {
            message: error instanceof Error ? error.message : String(error),
          },
        };

        await this.sendResponse(errorResponse);
      }
    }
  }

  /**
   * Send a response to stdout
   */
  private async sendResponse(response: MCPResponse): Promise<void> {
    try {
      // Convert response to JSON string and encode
      const responseText = JSON.stringify(response);
      const encoder = new TextEncoder();
      const data = encoder.encode(responseText + "\n");

      // Write to stdout
      await Deno.stdout.write(data);
    } catch (error) {
      console.error("Error sending response:", error);
    }
  }
}
