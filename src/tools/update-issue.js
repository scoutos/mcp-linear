/**
 * Linear issue update tool
 */
import { z } from 'zod';
import { create_tool } from './utils/mod.js';
import { IssueSchema } from '../effects/linear/types/types.js';

/**
 * UpdateIssueContext type definition
 * Using JSDoc for now, but this could be converted to TypeScript or Zod schema in the future
 *
 * @typedef {Object} UpdateIssueContext
 * @property {import('../utils/config/mod.js').Config} config
 * @property {Object} effects
 * @property {import('../effects/linear/index.js').LinearEffect} effects.linear
 * @property {import('../effects/logging/mod.js').LoggingEffect} effects.logger
 */

/**
 * Input schema for UpdateIssue tool
 */
const UpdateIssueInputSchema = z.object({
  issueId: z.string().describe('The ID of the issue to update'),
  stateId: z.string().optional().describe('The ID of the state to move the issue to'),
  title: z.string().optional().describe('The new title for the issue'),
  description: z.string().optional().describe('The new description for the issue'),
  priority: z.number().min(0).max(4).optional().describe('The priority of the issue (0-4)'),
  assigneeId: z.string().optional().describe('The ID of the user to assign the issue to'),
  debug: z.boolean().default(false).describe('Debug mode to show extra diagnostics'),
});

/**
 * Updates an issue in Linear
 *
 * @param {import('@linear/sdk').LinearClient} client - Linear client from SDK
 * @param {string} issueId - The ID of the issue to update
 * @param {Object} updateData - Data to update on the issue
 * @param {string} [updateData.stateId] - The ID of the state to move the issue to
 * @param {string} [updateData.title] - The new title for the issue
 * @param {string} [updateData.description] - The new description for the issue
 * @param {number} [updateData.priority] - The priority of the issue (0-4)
 * @param {string} [updateData.assigneeId] - The ID of the user to assign the issue to
 * @param {import('../effects/logging/mod.js').LoggingEffect} [logger] - Optional logger
 * @returns {Promise<import('../effects/linear/types/types.js').Issue>} The updated issue
 */
async function updateIssue(client, issueId, updateData = {}, logger) {
  try {
    logger?.debug(`Updating Linear issue with ID: ${issueId}`, updateData);

    // Get the current issue to make sure it exists
    const issue = await client.issue(issueId);
    
    if (!issue) {
      logger?.error(`Issue with ID ${issueId} not found`);
      throw new Error(`Issue with ID ${issueId} not found`);
    }

    // Prepare the update payload
    const updatePayload = {};
    
    if (updateData.stateId) {
      updatePayload.stateId = updateData.stateId;
    }
    
    if (updateData.title) {
      updatePayload.title = updateData.title;
    }
    
    if (updateData.description !== undefined) {
      updatePayload.description = updateData.description;
    }
    
    if (updateData.priority !== undefined) {
      updatePayload.priority = updateData.priority;
    }
    
    if (updateData.assigneeId !== undefined) {
      updatePayload.assigneeId = updateData.assigneeId;
    }
    
    // Call the update method on the issue
    const updatedIssue = await issue.update(updatePayload);
    logger?.debug(`Successfully updated issue: ${issueId}`);
    
    // Get state/status information (it's a promise in the Linear SDK)
    let statusName = 'Unknown';
    try {
      if (updatedIssue.state) {
        const state = await updatedIssue.state;
        if (state && state.name) {
          statusName = state.name;
          logger?.debug(`New state: ${statusName}`);
        }
      }
    } catch (stateError) {
      logger?.warn(`Error fetching state data: ${stateError.message}`);
    }
    
    // Get assignee if present (it's a promise in the Linear SDK)
    let assigneeData = undefined;
    try {
      if (updatedIssue.assignee) {
        const assignee = await updatedIssue.assignee;
        if (assignee) {
          assigneeData = {
            id: assignee.id,
            name: assignee.name,
            email: assignee.email,
          };
        }
      }
    } catch (assigneeError) {
      logger?.warn(`Error fetching assignee data: ${assigneeError.message}`);
    }
    
    // Get project if present (it's a promise in the Linear SDK)
    let projectData = undefined;
    try {
      if (updatedIssue.project) {
        const project = await updatedIssue.project;
        if (project) {
          projectData = {
            id: project.id,
            name: project.name,
          };
        }
      }
    } catch (projectError) {
      logger?.warn(`Error fetching project data: ${projectError.message}`);
    }
    
    // Process and validate the issue data
    const processedIssue = IssueSchema.parse({
      id: updatedIssue.id,
      identifier: updatedIssue.identifier || undefined,
      url: updatedIssue.url || undefined,
      title: updatedIssue.title,
      description: updatedIssue.description || undefined,
      priority: updatedIssue.priority,
      assignee: assigneeData,
      project: projectData,
      status: statusName,
      createdAt: updatedIssue.createdAt,
      updatedAt: updatedIssue.updatedAt,
    });
    
    return processedIssue;
  } catch (error) {
    // Enhanced error logging
    logger?.error(`Error updating Linear issue: ${error.message}`, {
      issueId,
      updateData,
      stack: error.stack,
    });
    
    // Rethrow the error for the tool to handle
    throw error;
  }
}

/**
 * Handler for UpdateIssue tool
 * @type {import('./types/mod.js').ToolHandler<UpdateIssueContext, typeof UpdateIssueInputSchema>}
 */
const handler = async (
  ctx,
  {
    issueId,
    stateId, 
    title,
    description,
    priority,
    assigneeId,
    debug,
  }
) => {
  const logger = ctx.effects.logger;
  
  try {
    // Log details about config and parameters
    logger.debug('Update issue called with parameters:', {
      issueId,
      stateId,
      title,
      description: description ? `${description.substring(0, 20)}...` : undefined,
      priority,
      assigneeId,
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
    
    // Update the issue using the Linear SDK
    logger.debug('Executing Linear API to update issue');
    const updateData = {
      stateId,
      title,
      description,
      priority,
      assigneeId,
    };
    
    const result = await updateIssue(
      linearClient,
      issueId,
      updateData,
      logger
    );
    
    // Log that we updated the issue
    logger.info(`Updated issue with ID: ${result.id}`);
    
    // Format the output
    const formatDate = timestamp => {
      if (!timestamp) return 'Just now';
      const date = new Date(timestamp);
      return date.toLocaleString();
    };
    
    const priorityLabels = {
      0: 'No priority',
      1: 'Urgent',
      2: 'High',
      3: 'Medium',
      4: 'Low',
    };
    
    let responseText = '';
    responseText += `✅ Issue updated successfully\n\n`;
    
    // Add issue details
    responseText += `**Issue ID:** ${result.id}\n`;
    if (result.identifier) {
      responseText += `**Identifier:** ${result.identifier}\n`;
    }
    if (result.url) {
      responseText += `**URL:** ${result.url}\n`;
    }
    responseText += `**Title:** ${result.title}\n`;
    
    if (result.status) {
      responseText += `**Status:** ${result.status}\n`;
    }
    
    if (result.priority !== undefined) {
      responseText += `**Priority:** ${priorityLabels[result.priority] || 'Unknown'}\n`;
    }
    
    if (result.assignee) {
      responseText += `**Assigned to:** ${result.assignee.name}\n`;
    }
    
    if (result.project) {
      responseText += `**Project:** ${result.project.name}\n`;
    }
    
    responseText += `**Updated at:** ${formatDate(result.updatedAt)}\n`;
    
    if (result.description) {
      responseText += `\n**Description:**\n${result.description}\n`;
    }
    
    logger.debug('Returning formatted issue update result');
    return {
      content: [{ type: 'text', text: responseText }],
    };
  } catch (error) {
    logger.error(`Error updating issue: ${error.message}`);
    logger.error(error.stack);
    
    // Create a user-friendly error message with troubleshooting guidance
    let errorMessage = `Error updating issue: ${error.message}`;
    
    // Add detailed diagnostic information if in debug mode
    if (debug) {
      errorMessage += '\n\n=== DETAILED DEBUG INFORMATION ===';
      
      // Add parameters that were used
      errorMessage += `\nParameters:
- issueId: ${issueId}
- stateId: ${stateId || 'not provided'}
- title: ${title || 'not provided'}
- description: ${description ? 'provided' : 'not provided'}
- priority: ${priority !== undefined ? priority : 'not provided'}
- assigneeId: ${assigneeId || 'not provided'}`;
      
      // Check if API key is configured
      const apiKey = ctx.config.linearApiKey || '';
      const keyStatus = apiKey
        ? `API key is configured (${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)})`
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
        errorMessage += `\n\nStack trace: ${error.stack.split('\n').slice(0, 3).join('\n')}`;
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
 * UpdateIssue tool factory
 */
export const UpdateIssue = create_tool({
  name: 'update_issue',
  description:
    'Update an existing issue in Linear. Use this to change the status, title, description, priority, or assignee of an issue.',
  inputSchema: UpdateIssueInputSchema,
  handler,
});

// Export for testing
export { updateIssue };