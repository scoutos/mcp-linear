import { z, type ZodSchema } from "zod";

/**
 * Action handler type
 */
export type ActionHandler<
  Context,
  InputSchema extends ZodSchema,
  OutputSchema = unknown,
> = (ctx: Context, args: z.infer<InputSchema>) => Promise<OutputSchema>;

/**
 * Action metadata
 */
export type ActionMeta<InputSchema extends ZodSchema> = {
  name: string;
  description: string;
  inputSchema: InputSchema;
};

/**
 * Action interface
 */
export interface Action<InputSchema extends ZodSchema, OutputSchema = unknown> {
  name: string;
  description: string;
  inputSchema: InputSchema;
  execute: (args: unknown) => Promise<OutputSchema>;
}

/**
 * Create an action with the given context, schema, and handler
 */
export function create_action<
  Context,
  InputSchema extends ZodSchema,
  OutputSchema = unknown,
>(
  meta: ActionMeta<InputSchema>,
  ctx: Context,
  handler: ActionHandler<Context, InputSchema, OutputSchema>,
): Action<InputSchema, OutputSchema> {
  return {
    name: meta.name,
    description: meta.description,
    inputSchema: meta.inputSchema,
    execute: async (args: unknown): Promise<OutputSchema> => {
      const validated = meta.inputSchema.parse(args);
      return await handler(ctx, validated);
    },
  };
}
