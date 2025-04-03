import { z } from "zod";
import { create_tool } from "./utils";
import type { ToolHandler } from "./types";

type HelloWorldContext = {};

const HelloWorldInputSchema = z.object({
  name: z.string().default("World"),
});

const handler: ToolHandler<
  HelloWorldContext,
  typeof HelloWorldInputSchema
> = async (_ctx, { name }) => {
  return {
    content: [{ type: "text", text: `Hello, ${name}!` }],
  };
};

export const HelloWorld = create_tool({
  name: "hello_world",
  description: "This is a hello world to test MCP server.",
  inputSchema: HelloWorldInputSchema,
  handler,
});
