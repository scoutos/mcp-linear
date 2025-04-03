import { ZodError, type ZodSchema } from "zod";

/**
 * Create a BaseAction that wraps custom actions and abstracts away common
 * functionality.
 */
export class BaseAction<Context> {
  private readonly ctx: Context;
  private readonly inputSchema: ZodSchema;
  private readonly handler: (args: unknown) => Promise<unknown>;

  constructor(
    ctx: Context,
    inputSchema: ZodSchema,
    handler: (args: unknown) => Promise<unknown>,
  ) {
    this.ctx = ctx;
    this.inputSchema = inputSchema;
    this.handler = handler;
  }

  async execute(args: unknown): Promise<unknown> {
    try {
      const validated_args = this.inputSchema.parse(args);
      return await this.handler(validated_args);
    } catch (error) {
      this.handle_error(error);
    }
  }

  private handle_error(error_maybe: unknown) {
    /**
     * If this is a validation error, let's format it up a bit.
     */
    if (error_maybe instanceof ZodError) {
      throw new Error(
        `Invalid input: ${JSON.stringify(error_maybe.errors, null, 2)}`,
      );
    }

    /**
     * Otherwise, just throw the error as is.
     */
    throw error_maybe;
  }
}
