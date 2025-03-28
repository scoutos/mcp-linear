/**
 * MCP stdio transport implementation
 */
import { MCPRequest, MCPResponse } from "../types/mcp";
import { Readable, Writable } from "stream";
import { createInterface } from "readline";

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
  private readonly readable: Readable;
  private readonly writable: Writable;

  /**
   * Create a new StdioTransport
   */
  constructor(
    readable: Readable = process.stdin,
    writable: Writable = process.stdout,
  ) {
    this.readable = readable;
    this.writable = writable;
  }

  /**
   * Listen for incoming messages on stdin and write responses to stdout
   */
  async listen(
    handler: (request: MCPRequest) => Promise<MCPResponse>,
  ): Promise<void> {
    console.error("Linear MCP Server running on stdio");

    // Set up readline interface
    const rl = createInterface({
      input: this.readable,
      crlfDelay: Infinity,
    });

    // Listen for incoming data on stdin
    for await (const line of rl) {
      try {
        // Parse the incoming message
        const request = JSON.parse(line) as MCPRequest;

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
      // Convert response to JSON string
      const responseText = JSON.stringify(response);

      // Write to stdout
      this.writable.write(`${responseText}\n`);
    } catch (error) {
      console.error("Error sending response:", error);
    }
  }
}
