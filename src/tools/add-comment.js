/**
 * Linear ticket comment tool
 */
import { z } from 'zod';
import { create_tool } from './utils/mod.js';
import { CommentSchema } from '../effects/linear/types/types.js';

/**
 * AddCommentContext type definition
 * Using JSDoc for now, but this could be converted to TypeScript or Zod schema in the future
 *
 * @typedef {Object} AddCommentContext
 * @property {import('../utils/config/mod.js').Config} config
 * @property {Object} effects
 * @property {import('../effects/linear/index.js').LinearEffect} effects.linear
 * @property {import('../effects/logging/mod.js').LoggingEffect} effects.logger
 */

/**
 * Input schema for AddComment tool
 */
const AddCommentInputSchema = z.object({
  ticketId: z.string().describe('The ID of the Linear ticket to comment on'),
  comment: z.string().describe('The comment text to add to the ticket'),
  debug: z
    .boolean()
    .default(false)
    .describe('Debug mode to show extra diagnostics'),
});

/**
 * Adds a comment to a Linear issue
 *
 * @param {import('@linear/sdk').LinearClient} client - Linear client from SDK
 * @param {string} ticketId - The ID of the ticket to comment on
 * @param {string} comment - The comment text to add
 * @param {import('../effects/logging/mod.js').LoggingEffect} [logger] - Optional logger
 * @returns {Promise<import('../effects/linear/types/types.js').Comment>} The created comment
 */
async function addComment(client, ticketId, comment, logger) {
  try {
    logger?.debug(`Adding comment to Linear issue with ID: ${ticketId}`);

    // First verify the issue exists
    const issue = await client.issue(ticketId);

    if (!issue) {
      logger?.error(`Issue with ID ${ticketId} not found`);
      throw new Error(`Issue with ID ${ticketId} not found`);
    }

    logger?.debug(`Successfully found issue: ${issue.id}, adding comment`);

    // Create the comment using the Linear SDK
    // The Linear SDK expects a CommentCreateInput object
    const commentResult = await client.createComment({
      // The issueId property is part of CommentCreateInput
      issueId: ticketId,
      // The body property is part of CommentCreateInput
      body: comment,
    });

    if (!commentResult) {
      throw new Error('Failed to create comment, received null response');
    }

    // CommentPayload contains a comment property that's a promise
    const commentData = await commentResult.comment;

    if (!commentData) {
      throw new Error('Failed to retrieve comment data from response');
    }

    logger?.debug(`Successfully added comment: ${commentData.id}`);

    // Get current user information for the response
    const me = await client.viewer;
    let userData = undefined;

    if (me) {
      userData = {
        id: me.id,
        name: me.name,
        email: me.email,
      };
    }

    // Process and validate the comment data using our schema
    const processedComment = CommentSchema.parse({
      id: commentData.id,
      body: commentData.body,
      user: userData,
      createdAt:
        commentData.createdAt instanceof Date
          ? commentData.createdAt.toISOString()
          : commentData.createdAt,
      updatedAt:
        commentData.updatedAt instanceof Date
          ? commentData.updatedAt.toISOString()
          : commentData.updatedAt,
    });

    return processedComment;
  } catch (error) {
    // Enhanced error logging
    logger?.error(`Error adding comment to Linear issue: ${error.message}`, {
      ticketId,
      commentLength: comment?.length,
      stack: error.stack,
    });

    // Check if it's a Zod validation error (formatted differently)
    if (error.name === 'ZodError') {
      logger?.error(
        'Zod validation error details:',
        JSON.stringify(error.errors, null, 2)
      );
    }

    // Rethrow the error for the tool to handle
    throw error;
  }
}

/**
 * Handler for AddComment tool
 * @type {import('./types/mod.js').ToolHandler<AddCommentContext, typeof AddCommentInputSchema>}
 */
const handler = async (ctx, { ticketId, comment, debug }) => {
  const logger = ctx.effects.logger;

  try {
    // Log details about config and parameters
    logger.debug('Add comment called with parameters:', {
      ticketId,
      commentLength: comment?.length,
      debug,
    });

    // Debug log for API key (masked)
    const apiKey = ctx.config.linearApiKey || '';
    const maskedKey = apiKey
      ? apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4)
      : '<not set>';
    logger.debug(`Using Linear API key: ${maskedKey}`);

    if (!ctx.config.linearApiKey) {
      throw new Error('LINEAR_API_KEY is not configured');
    }

    // Create a Linear client using our effect
    logger.debug('Creating Linear client');
    const linearClient = ctx.effects.linear.createClient(
      ctx.config.linearApiKey
    );

    // Add the comment using the Linear SDK client
    logger.debug('Executing Linear API to add comment');
    const result = await addComment(linearClient, ticketId, comment, logger);

    // Log that we created the comment
    logger.info(`Added comment to ticket ID: ${ticketId}`);

    // Format the output
    const formatDate = timestamp => {
      if (!timestamp) return 'Just now';
      const date = new Date(timestamp);
      return date.toLocaleString();
    };

    let responseText = '';
    responseText += `✅ Comment added successfully to ticket ${ticketId}\n\n`;

    // Add comment details
    responseText += `**Comment ID:** ${result.id}\n`;

    if (result.user) {
      responseText += `**Posted by:** ${result.user.name}\n`;
    }

    responseText += `**Posted at:** ${formatDate(result.createdAt)}\n\n`;
    responseText += `**Comment:**\n${result.body}\n`;

    logger.debug('Returning formatted comment result');
    return {
      content: [{ type: 'text', text: responseText }],
    };
  } catch (error) {
    logger.error(`Error adding comment: ${error.message}`);
    logger.error(error.stack);

    // Create a user-friendly error message with troubleshooting guidance
    let errorMessage = `Error adding comment: ${error.message}`;

    // Add detailed diagnostic information if in debug mode
    if (debug) {
      errorMessage += '\n\n=== DETAILED DEBUG INFORMATION ===';

      // Add parameters that were used
      errorMessage += `\nParameters:
- ticketId: ${ticketId}
- comment length: ${comment?.length} characters`;

      // Check if API key is configured
      const apiKey = ctx.config.linearApiKey || '';
      const keyStatus = apiKey
        ? `API key is configured (${apiKey.substring(
            0,
            4
          )}...${apiKey.substring(apiKey.length - 4)})`
        : 'API key is NOT configured - set LINEAR_API_KEY';

      errorMessage += `\n\nLinear API Status: ${keyStatus}`;

      // Add error details
      if (error.name) {
        errorMessage += `\nError type: ${error.name}`;
      }

      if (error.code) {
        errorMessage += `\nError code: ${error.code}`;
      }

      if (error.stack) {
        errorMessage += `\n\nStack trace: ${error.stack
          .split('\n')
          .slice(0, 3)
          .join('\n')}`;
      }

      // Add Linear API info for manual testing
      errorMessage += `\n\nLinear API: Using official Linear SDK (@linear/sdk)
For manual testing, try using the SDK directly or the Linear API Explorer in the Linear UI.`;
    }

    // Add a note that debug mode can be enabled for more details
    if (!debug) {
      errorMessage += `\n\nFor more detailed diagnostics, retry with debug:true in the input.`;
    }

    return {
      content: [
        {
          type: 'text',
          text: errorMessage,
        },
      ],
      isError: true,
    };
  }
};

/**
 * AddComment tool factory
 */
export const AddComment = create_tool({
  name: 'add_comment',
  description:
    'Add a comment to a specific Linear ticket. This tool is useful for providing feedback, status updates, or additional information on existing tickets.',
  inputSchema: AddCommentInputSchema,
  handler,
});

// Export for testing
export { addComment };
