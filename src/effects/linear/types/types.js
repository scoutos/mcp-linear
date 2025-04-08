/**
 * Linear API types defined as Zod schemas
 */
import { z } from 'zod';

/**
 * Linear user schema
 */
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
});

/**
 * Linear team schema
 */
export const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(),
});

/**
 * Linear label schema
 */
export const LabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
});

/**
 * Linear comment schema
 */
export const CommentSchema = z.object({
  id: z.string(),
  body: z.string(),
  user: UserSchema.optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

/**
 * Linear issue schema
 */
export const IssueSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.number().optional(),
  labels: z.array(LabelSchema).optional(),
  assignee: UserSchema.optional(),
  comments: z.array(CommentSchema).optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
});

/**
 * Linear search results schema
 */
export const SearchResultsSchema = z.object({
  results: z.array(IssueSchema),
});

/**
 * Linear issue update request schema
 */
export const IssueUpdateRequestSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.number().optional(),
  assigneeId: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
});

/**
 * Linear comment creation request schema
 */
export const CommentCreateRequestSchema = z.object({
  body: z.string(),
});

/**
 * Type definitions inferred from Zod schemas
 * These are JSDoc type definitions since we're using JavaScript
 */

/**
 * @typedef {z.infer<typeof UserSchema>} User
 */

/**
 * @typedef {z.infer<typeof TeamSchema>} Team
 */

/**
 * @typedef {z.infer<typeof LabelSchema>} Label
 */

/**
 * @typedef {z.infer<typeof CommentSchema>} Comment
 */

/**
 * @typedef {z.infer<typeof IssueSchema>} Issue
 */

/**
 * @typedef {z.infer<typeof SearchResultsSchema>} SearchResults
 */

/**
 * @typedef {z.infer<typeof IssueUpdateRequestSchema>} IssueUpdateRequest
 */

/**
 * @typedef {z.infer<typeof CommentCreateRequestSchema>} CommentCreateRequest
 */
