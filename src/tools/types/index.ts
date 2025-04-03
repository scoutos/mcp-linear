import { z } from "zod";

type ContentItem = {
  type: "text";
  text: string;
};

export type McpToolResponse = {
  content: ContentItem[];
  isError?: boolean;
};

export type ToolResponse = Promise<McpToolResponse>;

export type BaseToolInput<InputSchema extends z.ZodTypeAny> = {
  name: string;
  description: string;
  inputSchema: InputSchema;
};

export type ToolHandler<Context, InputSchema extends z.ZodTypeAny> = (
  ctx: Context,
  args: z.infer<InputSchema>,
) => ToolResponse;

export type ToolDefinition<Context, InputSchema extends z.ZodTypeAny> = {
  name: string;
  description: string;
  inputSchema: InputSchema;
  handler: ToolHandler<Context, InputSchema>;
};
