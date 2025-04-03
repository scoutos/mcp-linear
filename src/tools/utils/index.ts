import { z, ZodError } from "zod";
import type {
  BaseToolInput,
  ToolDefinition,
  ToolHandler,
  ToolResponse,
} from "../types";

export abstract class BaseTool<Context, InputSchema extends z.ZodTypeAny> {
  public readonly name: string;
  public readonly description: string;
  public readonly inputSchema: InputSchema;

  _ctx?: Context;

  constructor({ name, description, inputSchema }: BaseToolInput<InputSchema>) {
    this.name = name;
    this.description = description;
    this.inputSchema = inputSchema;
  }

  protected abstract handle: ToolHandler<Context, InputSchema>;

  public initialize(ctx: Context): void {
    this._ctx = ctx;
  }

  public async call(args: unknown): ToolResponse {
    if (!this._ctx) {
      throw new Error(
        `Tool "${this.name}" has not been initialized with context.`,
      );
    }

    try {
      const validatedArgs = this.inputSchema.parse(args);
      return await this.handle(this._ctx, validatedArgs);
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          content: [
            {
              type: "text",
              text: `Validation Error: ${
                JSON.stringify(error.errors, null, 2)
              }`,
            },
          ],
        };
      }
      throw error;
    }
  }
}

export function create_tool<Context, InputSchema extends z.ZodTypeAny>({
  handler,
  ...meta
}: ToolDefinition<Context, InputSchema>): new (
  ctx: Context,
) => BaseTool<Context, InputSchema> {
  return class extends BaseTool<Context, InputSchema> {
    constructor(ctx: Context) {
      super(meta);
      this.initialize(ctx);
    }

    protected handle: ToolHandler<Context, InputSchema> = async (ctx, args) => {
      return handler(ctx, args);
    };
  };
}
