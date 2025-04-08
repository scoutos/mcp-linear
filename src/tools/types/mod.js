/**
 * MCP Tool types
 */
import { z } from 'zod';

/**
 * Content item schema for MCP tool responses
 */
export const ContentItemSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

/**
 * MCP tool response schema
 */
export const McpToolResponseSchema = z.object({
  content: z.array(ContentItemSchema),
  isError: z.boolean().optional(),
});

/**
 * @typedef {z.infer<typeof ContentItemSchema>} ContentItem
 */

/**
 * @typedef {z.infer<typeof McpToolResponseSchema>} McpToolResponse
 */

/**
 * @typedef {Promise<McpToolResponse>} ToolResponse
 */

/**
 * @template {import('zod').ZodTypeAny} T
 * @typedef {Object} BaseToolInput
 * @property {string} name
 * @property {string} description
 * @property {T} inputSchema
 */

/**
 * @template C
 * @template {import('zod').ZodTypeAny} T
 * @typedef {(ctx: C, args: import('zod').infer<T>) => ToolResponse} ToolHandler
 */

/**
 * @template C
 * @template {import('zod').ZodTypeAny} T
 * @typedef {Object} ToolDefinition
 * @property {string} name
 * @property {string} description
 * @property {T} inputSchema
 * @property {ToolHandler<C, T>} handler
 */
