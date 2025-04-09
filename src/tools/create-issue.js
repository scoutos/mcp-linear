/**
 * Linear issue creation tool
 */
import { z } from 'zod';
import { create_tool } from './utils/mod.js';
import { IssueSchema } from '../effects/linear/types/types.js';

/**
 * CreateIssueContext type definition
 * Using JSDoc for now, but this could be converted to TypeScript or Zod schema in the future
 *
 * @typedef {Object} CreateIssueContext
 * @property {import('../utils/config/mod.js').Config} config
 * @property {Object} effects
 * @property {import('../effects/linear/index.js').LinearEffect} effects.linear
 * @property {import('../effects/logging/mod.js').LoggingEffect} effects.logger
 */

/**
 * Input schema for CreateIssue tool
 */
const CreateIssueInputSchema = z.object({
  title: z.string().describe('The title of the issue to create'),
  teamId: z
    .string()
    .describe('The ID of the Linear team where the issue will be created'),
  description: z
    .string()
    .optional()
    .describe('The detailed description of the issue'),
  priority: z
    .number()
    .min(0)
    .max(4)
    .optional()
    .describe('The priority of the issue (0-4)'),
  assigneeId: z
    .string()
    .optional()
    .describe('The ID of the user to assign the issue to'),
  stateId: z
    .string()
    .optional()
    .describe('The ID of the state to set for the issue'),
  projectId: z
    .string()
    .optional()
    .describe('The ID of the project to associate with the issue'),
  debug: z
    .boolean()
    .default(false)
    .describe('Debug mode to show extra diagnostics'),
});

/**
 * Creates a new issue in Linear
 *
 * @param {import('@linear/sdk').LinearClient} client - Linear client from SDK
 * @param {string} title - The title of the issue
 * @param {string} teamId - The ID of the team where the issue will be created
 * @param {Object} options - Additional issue options
 * @param {string} [options.description] - The detailed description of the issue
 * @param {number} [options.priority] - The priority of the issue (0-4)
 * @param {string} [options.assigneeId] - The ID of the user to assign the issue to
 * @param {string} [options.stateId] - The ID of the state to set for the issue
 * @param {string} [options.projectId] - The ID of the project to associate with the issue
 * @param {import('../effects/logging/mod.js').LoggingEffect} [logger] - Optional logger
 * @returns {Promise<import('../effects/linear/types/types.js').Issue>} The created issue
 */
async function createIssue(client, title, teamId, options = {}, logger) {
  try {
    logger?.debug(`Creating new Linear issue with title: ${title}`);

    // Prepare the issue creation input for the Linear SDK
    const issueInput = {
      title,
      teamId,
      description: options.description,
      priority: options.priority,
      assigneeId: options.assigneeId,
      stateId: options.stateId,
      projectId: options.projectId,
    };

    // Filter out undefined values
    Object.keys(issueInput).forEach(key => {
      if (issueInput[key] === undefined) {
        delete issueInput[key];
      }
    });

    logger?.debug('Issue creation payload:', issueInput);

    // Create the issue using the Linear SDK
    // Note: The correct method is issues.create, not issueCreate
    const issueResult = await client.issues.create(issueInput);

    if (!issueResult) {
      throw new Error('Failed to create issue, received null response');
    }

    // Linear API returns a promise for the created issue
    const issueData = await issueResult.issue;

    if (!issueData) {
      throw new Error('Failed to retrieve issue data from response');
    }

    logger?.debug(`Successfully created issue: ${issueData.id}`);

    // Load related data asynchronously
    let assigneeData = null;
    let projectData = null;
    let stateData = null;

    if (issueData.assignee) {
      assigneeData = await issueData.assignee;
    }

    if (issueData.project) {
      projectData = await issueData.project;
    }

    if (issueData.state) {
      stateData = await issueData.state;
    }

    // Process and validate the issue data using our schema
    const processedIssue = IssueSchema.parse({
      id: issueData.id,
      title: issueData.title,
      description: issueData.description || undefined, // Convert null to undefined
      status: stateData?.name,
      priority: issueData.priority,
      assignee: assigneeData
        ? {
            id: assigneeData.id,
            name: assigneeData.name,
            email: assigneeData.email,
          }
        : undefined,
      project: projectData
        ? {
            id: projectData.id,
            name: projectData.name,
          }
        : undefined,
      createdAt:
        issueData.createdAt instanceof Date
          ? issueData.createdAt.toISOString()
          : issueData.createdAt,
      updatedAt:
        issueData.updatedAt instanceof Date
          ? issueData.updatedAt.toISOString()
          : issueData.updatedAt,
    });

    return processedIssue;
  } catch (error) {
    // Enhanced error logging
    logger?.error(`Error creating Linear issue: ${error.message}`, {
      title,
      teamId,
      options,
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
 * Handler for CreateIssue tool
 * @type {import('./types/mod.js').ToolHandler<CreateIssueContext, typeof CreateIssueInputSchema>}
 */
const handler = async (
  ctx,
  {
    title,
    teamId,
    description,
    priority,
    assigneeId,
    stateId,
    projectId,
    debug,
  }
) => {
  const logger = ctx.effects.logger;

  try {
    // Log details about config and parameters
    logger.debug('Create issue called with parameters:', {
      title,
      teamId,
      description: description
        ? `${description.substring(0, 20)}...`
        : undefined,
      priority,
      assigneeId,
      stateId,
      projectId,
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

    // Create the issue using the Linear SDK client
    logger.debug('Executing Linear API to create issue');
    const options = {
      description,
      priority,
      assigneeId,
      stateId,
      projectId,
    };

    const result = await createIssue(
      linearClient,
      title,
      teamId,
      options,
      logger
    );

    // Log that we created the issue
    logger.info(`Created issue with ID: ${result.id}`);

    // Format the output
    const formatDate = timestamp => {
      if (!timestamp) return 'Just now';
      const date = new Date(timestamp);
      return date.toLocaleString();
    };

    let responseText = '';
    responseText += `✅ Issue created successfully\n\n`;

    // Add issue details
    responseText += `**Issue ID:** ${result.id}\n`;
    responseText += `**Title:** ${result.title}\n`;

    if (result.status) {
      responseText += `**Status:** ${result.status}\n`;
    }

    if (result.priority !== undefined) {
      const priorityLabels = ['No priority', 'Urgent', 'High', 'Medium', 'Low'];
      responseText += `**Priority:** ${priorityLabels[result.priority]}\n`;
    }

    if (result.assignee) {
      responseText += `**Assigned to:** ${result.assignee.name}\n`;
    }

    if (result.project) {
      responseText += `**Project:** ${result.project.name}\n`;
    }

    responseText += `**Created at:** ${formatDate(result.createdAt)}\n\n`;

    if (result.description) {
      responseText += `**Description:**\n${result.description}\n`;
    }

    logger.debug('Returning formatted issue result');
    return {
      content: [{ type: 'text', text: responseText }],
    };
  } catch (error) {
    logger.error(`Error creating issue: ${error.message}`);
    logger.error(error.stack);

    // Create a user-friendly error message with troubleshooting guidance
    let errorMessage = `Error creating issue: ${error.message}`;

    // Add detailed diagnostic information if in debug mode
    if (debug) {
      errorMessage += '\n\n=== DETAILED DEBUG INFORMATION ===';

      // Add parameters that were used
      errorMessage += `\nParameters:
- title: ${title}
- teamId: ${teamId}
- description: ${description ? 'provided' : 'not provided'}
- priority: ${priority !== undefined ? priority : 'not provided'}
- assigneeId: ${assigneeId || 'not provided'}
- stateId: ${stateId || 'not provided'}
- projectId: ${projectId || 'not provided'}`;

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
 * CreateIssue tool factory
 */
export const CreateIssue = create_tool({
  name: 'create_issue',
  description:
    'Create a new issue in Linear. This tool is useful for adding new tasks, bugs, or feature requests to your Linear workspace.',
  inputSchema: CreateIssueInputSchema,
  handler,
});

// Export for testing
export { createIssue };
