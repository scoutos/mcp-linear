/**
 * MCP protocol types
 */

/**
 * MCP request structure
 */
export type MCPRequest = {
  id: string;
  path?: string;
  params: Record<string, unknown>;
};

/**
 * MCP response structure
 */
export type MCPResponse = {
  id: string;
  result?: unknown;
  error?: {
    message: string;
    code?: string;
  };
};

export type MCPResponsePromise = MCPResponse | Promise<MCPResponse>;

/**
 * MCP tool definition
 */
export type MCPTool = {
  name: string;
  description: string;
  endpoints?: MCPEndpoint[];
};

/**
 * MCP endpoint definition (used mainly in HTTP transport)
 */
export type MCPEndpoint = {
  path: string;
  method: string;
  description?: string;
};

/**
 * MCP tools list response
 */
export type MCPToolsResponse = {
  tools: MCPTool[];
};
