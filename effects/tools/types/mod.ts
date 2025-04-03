/**
 * MCP Tool types
 */
import { z } from "zod";

/**
 * MCP content item type
 */
type ContentItem = {
  type: "text";
  text: string;
};

/**
 * MCP tool response type
 */
export type McpToolResponse = {
  content: ContentItem[];
  isError?: boolean;
};

/**
 * Tool response type alias
 */
export type ToolResponse = Promise<McpToolResponse>;

/**
 * Base tool input type
 */
export type BaseToolInput<InputSchema extends z.ZodTypeAny> = {
  name: string;
  description: string;
  inputSchema: InputSchema;
};

/**
 * Tool handler function type
 */
export type ToolHandler<Context, InputSchema extends z.ZodTypeAny> = (
  ctx: Context,
  args: z.infer<InputSchema>,
) => ToolResponse;

/**
 * Tool definition type
 */
export type ToolDefinition<Context, InputSchema extends z.ZodTypeAny> = {
  name: string;
  description: string;
  inputSchema: InputSchema;
  handler: ToolHandler<Context, InputSchema>;
};
