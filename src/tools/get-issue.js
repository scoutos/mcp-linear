/**
 * Linear issue details tool
 */
import { z } from 'zod';
import { create_tool } from './utils/mod.js';
import { IssueSchema, CommentSchema } from '../effects/linear/types/types.js';

/**
 * GetIssueContext type definition
 * Using JSDoc for now, but this could be converted to TypeScript or Zod schema in the future
 *
 * @typedef {Object} GetIssueContext
 * @property {import('../utils/config/mod.js').Config} config
 * @property {Object} effects
 * @property {import('../effects/linear/index.js').LinearEffect} effects.linear
 * @property {import('../effects/logging/mod.js').LoggingEffect} effects.logger
 */

/**
 * Input schema for GetIssue tool
 */
const GetIssueInputSchema = z.object({
  issueId: z.string(),
  includeComments: z.boolean().default(true),
  debug: z.boolean().default(false), // Debug mode to show extra diagnostics
});

/**
 * Gets a single issue from Linear using the SDK
 *
 * @param {import('@linear/sdk').LinearClient} client - Linear client from SDK
 * @param {string} issueId - The ID of the issue to retrieve
 * @param {Object} options - Options
 * @param {boolean} [options.includeComments=true] - Whether to include comments in the result
 * @param {import('../effects/logging/mod.js').LoggingEffect} [logger] - Optional logger
 * @returns {Promise<import('../effects/linear/types/types.js').Issue>} Issue details
 */
async function getIssue(
  client,
  issueId,
  { includeComments = true } = {},
  logger
) {
  try {
    logger?.debug(`Fetching Linear issue with ID: ${issueId}`);

    // Fetch the issue from Linear
    const issue = await client.issue(issueId);

    if (!issue) {
      logger?.error(`Issue with ID ${issueId} not found`);
      throw new Error(`Issue with ID ${issueId} not found`);
    }

    logger?.debug(`Successfully retrieved issue: ${issue.id}`);

    // Get state/status information (it's a promise in the Linear SDK)
    let statusName = 'Unknown';
    try {
      if (issue.state) {
        const state = await issue.state;
        if (state && state.name) {
          statusName = state.name;
          logger?.debug(`Found state: ${statusName}`);
        }
      }
    } catch (stateError) {
      logger?.warn(`Error fetching state data: ${stateError.message}`);
    }

    // Get assignee if present (it's a promise in the Linear SDK)
    let assigneeData = undefined;
    try {
      if (issue.assignee) {
        const assignee = await issue.assignee;
        if (assignee) {
          assigneeData = {
            id: assignee.id,
            name: assignee.name,
            email: assignee.email,
          };
          logger?.debug(`Found assignee: ${assignee.name}`);
        }
      }
    } catch (assigneeError) {
      logger?.warn(`Error fetching assignee data: ${assigneeError.message}`);
    }

    // Get project if present (it's a promise in the Linear SDK)
    let projectData = undefined;
    try {
      if (issue.project) {
        const project = await issue.project;
        if (project) {
          projectData = {
            id: project.id,
            name: project.name,
          };
          logger?.debug(`Found project: ${project.name}`);
        }
      }
    } catch (projectError) {
      logger?.warn(`Error fetching project data: ${projectError.message}`);
    }

    // Fetch comments if requested
    let commentsData = [];
    if (includeComments) {
      try {
        logger?.debug(`Fetching comments for issue: ${issue.id}`);
        const comments = await issue.comments();

        // Process comments (also resolving promises as needed)
        for (const comment of comments.nodes) {
          let userData = undefined;

          // Get user information (it's a promise in the Linear SDK)
          try {
            if (comment.user) {
              const user = await comment.user;
              if (user) {
                userData = {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                };
              }
            }
          } catch (userError) {
            logger?.warn(
              `Error fetching comment user data: ${userError.message}`
            );
          }

          commentsData.push(
            CommentSchema.parse({
              id: comment.id,
              body: comment.body,
              user: userData,
              createdAt: comment.createdAt,
              updatedAt: comment.updatedAt,
            })
          );
        }

        logger?.debug(`Successfully processed ${commentsData.length} comments`);
      } catch (commentsError) {
        logger?.warn(`Error fetching comments: ${commentsError.message}`);
        // Continue with the issue data even if comments fail
      }
    }

    // Process and validate the issue data
    const processedIssue = IssueSchema.parse({
      id: issue.id,
      title: issue.title,
      description: issue.description || undefined,
      priority: issue.priority,
      assignee: assigneeData,
      project: projectData,
      status: statusName,
      comments: commentsData,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    });

    return processedIssue;
  } catch (error) {
    // Enhanced error logging
    logger?.error(`Error retrieving Linear issue: ${error.message}`, {
      issueId,
      includeComments,
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
 * Handler for GetIssue tool
 * @type {import('./types/mod.js').ToolHandler<GetIssueContext, typeof GetIssueInputSchema>}
 */
const handler = async (ctx, { issueId, includeComments, debug }) => {
  const logger = ctx.effects.logger;

  try {
    // Log details about config and parameters
    logger.debug('Get issue called with parameters:', {
      issueId,
      includeComments,
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

    // Get issue using the Linear SDK client
    logger.debug('Executing Linear API get with issue ID:', issueId);
    const issue = await getIssue(
      linearClient,
      issueId,
      {
        includeComments,
      },
      logger
    );

    // Log that we found the issue
    logger.info(`Found issue with ID: ${issue.id}`);

    // Format the output
    let responseText = '';

    // Format priority to be readable
    const priorityMap = {
      0: 'No priority',
      1: 'Urgent',
      2: 'High',
      3: 'Medium',
      4: 'Low',
    };

    const priority = issue.priority ?? 0;

    // Format timestamps to be more readable
    const formatDate = timestamp => {
      if (!timestamp) return 'Unknown';
      const date = new Date(timestamp);
      return date.toLocaleString();
    };

    // Format the issue details
    responseText += `# ${issue.title || 'Untitled'}\n\n`;
    responseText += `**ID:** ${issue.id}\n`;
    responseText += `**Status:** ${issue.status || 'Unknown'}\n`;
    responseText += `**Priority:** ${priorityMap[priority] || 'Unknown'}\n`;

    if (issue.project) {
      responseText += `**Project:** ${issue.project.name}\n`;
    }

    if (issue.assignee) {
      responseText += `**Assignee:** ${issue.assignee.name}\n`;
    }

    responseText += `**Created:** ${formatDate(issue.createdAt)}\n`;
    responseText += `**Updated:** ${formatDate(issue.updatedAt)}\n\n`;

    // Add description if available
    if (issue.description) {
      responseText += `## Description\n\n${issue.description}\n\n`;
    }

    // Add comments if available
    if (issue.comments && issue.comments.length > 0) {
      responseText += `## Comments (${issue.comments.length})\n\n`;

      issue.comments.forEach((comment, index) => {
        const userName = comment.user ? comment.user.name : 'Unknown User';
        const commentDate = formatDate(comment.createdAt);

        responseText += `### ${index + 1}. ${userName} (${commentDate})\n\n`;
        responseText += `${comment.body}\n\n`;

        // Add edit info if comment was updated
        if (comment.updatedAt && comment.createdAt !== comment.updatedAt) {
          responseText += `*Edited: ${formatDate(comment.updatedAt)}*\n\n`;
        }
      });
    } else if (includeComments) {
      responseText += `## Comments\n\nNo comments found for this issue.\n\n`;
    }

    logger.debug('Returning formatted issue results');
    return {
      content: [{ type: 'text', text: responseText }],
    };
  } catch (error) {
    logger.error(`Error getting issue: ${error.message}`);
    logger.error(error.stack);

    // Create a user-friendly error message with troubleshooting guidance
    let errorMessage = `Error getting issue: ${error.message}`;

    // Add detailed diagnostic information if in debug mode
    if (debug) {
      errorMessage += '\n\n=== DETAILED DEBUG INFORMATION ===';

      // Add parameters that were used
      errorMessage += `\nParameters:
- issueId: ${issueId}
- includeComments: ${includeComments}`;

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
 * GetIssue tool factory
 */
export const GetIssue = create_tool({
  name: 'get_issue',
  description:
    'Get detailed information about a specific Linear issue (also called a ticket), including comments if requested.',
  inputSchema: GetIssueInputSchema,
  handler,
});

// Export for testing
export { getIssue };
