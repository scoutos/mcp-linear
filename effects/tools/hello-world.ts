/**
 * Hello World tool for testing
 */
import { z } from "zod";
import { create_tool } from "./utils/mod.ts";
import type { ToolHandler } from "./types/mod.ts";

/**
 * Context for HelloWorld tool
 */
type HelloWorldContext = Record<string, never>;

/**
 * Input schema for HelloWorld tool
 */
const HelloWorldInputSchema = z.object({
  name: z.string().default("World"),
});

/**
 * Handler for HelloWorld tool
 */
const handler: ToolHandler<
  HelloWorldContext,
  typeof HelloWorldInputSchema
> = async (_ctx, { name }) => {
  return {
    content: [{ type: "text", text: `Hello, ${name}!` }],
  };
};

/**
 * HelloWorld tool factory
 */
export const HelloWorld = create_tool({
  name: "hello_world",
  description: "This is a hello world to test MCP server.",
  inputSchema: HelloWorldInputSchema,
  handler,
});
