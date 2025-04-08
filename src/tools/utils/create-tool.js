/**
 * Tool creation utilities
 */
import { ZodError } from 'zod';
import { McpToolResponseSchema } from '../types/mod.js';

/**
 * Base tool abstract class
 * @template C
 * @template {import('zod').ZodTypeAny} T
 */
export class BaseTool {
  /**
   * @param {import('../types/mod.js').BaseToolInput<T>} input - Tool definition
   */
  constructor({ name, description, inputSchema }) {
    this.name = name;
    this.description = description;
    this.inputSchema = inputSchema;
    // @ts-ignore - inputSchema.shape may not exist on all Zod schemas
    this.shape = inputSchema.shape;
    this._ctx = undefined;
  }

  /**
   * Initialize the tool with a context
   * @param {C} ctx - The context to initialize with
   */
  initialize(ctx) {
    this._ctx = ctx;
  }

  /**
   * Call the tool
   * @param {unknown} args - The arguments to pass to the tool
   * @returns {Promise<import('../types/mod.js').McpToolResponse>} - The tool response
   */
  async call(args) {
    if (!this._ctx) {
      throw new Error(
        `Tool "${this.name}" has not been initialized with context.`
      );
    }

    try {
      // Validate input arguments against schema
      const validatedArgs = this.inputSchema.parse(args);

      // Handle the validated arguments and get response
      // @ts-ignore - handle method is implemented by subclasses
      const response = await this.handle(this._ctx, validatedArgs);

      // Validate the response against our schema
      return McpToolResponseSchema.parse(response);
    } catch (error) {
      if (error instanceof ZodError) {
        // Create a validated error response
        return McpToolResponseSchema.parse({
          content: [
            {
              type: 'text',
              text: `Validation Error: ${JSON.stringify(
                error.errors,
                null,
                2
              )}`,
            },
          ],
          isError: true,
        });
      }
      throw error;
    }
  }
}

/**
 * Create a tool factory function
 * @template C
 * @template {import('zod').ZodTypeAny} T
 * @param {import('../types/mod.js').ToolDefinition<C, T>} definition - Tool definition
 * @returns {new (ctx: C) => BaseTool<C, T>} - Tool class constructor
 */
export function create_tool({ handler, ...meta }) {
  return class extends BaseTool {
    /**
     * @param {C} ctx - The context to initialize with
     */
    constructor(ctx) {
      super(meta);
      this.initialize(ctx);
    }

    /**
     * @param {C} ctx - The context to use for handling
     * @param {import('zod').infer<T>} args - The validated arguments
     * @returns {Promise<import('../types/mod.js').McpToolResponse>} - The tool response
     */
    async handle(ctx, args) {
      // Use the handler and ensure the response is validated
      const response = await handler(ctx, args);
      return McpToolResponseSchema.parse(response);
    }
  };
}
