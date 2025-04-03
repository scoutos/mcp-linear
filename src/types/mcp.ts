/**
 * MCP protocol types
 *
 * NOTE: Many of these types are now provided by @modelcontextprotocol/sdk.
 * Consider using the SDK types when possible.
 */

/**
 * @deprecated Consider using types from @modelcontextprotocol/sdk
 * MCP request structure (internal format)
 */
export type MCPRequest = {
  id: string;
  path?: string;
  params: Record<string, unknown>;
  jsonrpc?: string;
  method?: string;
};

/**
 * @deprecated Consider using types from @modelcontextprotocol/sdk
 * MCP response structure (internal format)
 */
export type MCPResponse = {
  id: string;
  result?: unknown;
  error?: {
    message: string;
    code?: string;
  };
  jsonrpc?: string;
};

export type MCPResponsePromise = MCPResponse | Promise<MCPResponse>;

/**
 * @deprecated Consider using types from @modelcontextprotocol/sdk
 * MCP tool definition
 */
export type MCPTool = {
  name: string;
  description: string;
  inputSchema?: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
    additionalProperties?: boolean;
  };
  endpoints?: MCPEndpoint[];
};

/**
 * @deprecated Consider using types from @modelcontextprotocol/sdk
 * MCP endpoint definition (used mainly in HTTP transport)
 */
export type MCPEndpoint = {
  path: string;
  method: string;
  description?: string;
};

/**
 * @deprecated Consider using types from @modelcontextprotocol/sdk
 * MCP tools list response
 */
export type MCPToolsResponse = {
  tools: MCPTool[];
};

/**
 * @deprecated Consider using types from @modelcontextprotocol/sdk
 * JSON-RPC request format (MCP 2024-11-05)
 */
export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
};

/**
 * @deprecated Consider using types from @modelcontextprotocol/sdk
 * JSON-RPC response format (MCP 2024-11-05)
 */
export type JsonRpcResponse = {
  jsonrpc: "2.0";
  id: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
};
