/**
 * Linear team workflow states listing tool
 */
import { z } from 'zod';
import { create_tool } from './utils/mod.js';

/**
 * ListWorkflowStatesContext type definition
 * Using JSDoc for now, but this could be converted to TypeScript or Zod schema in the future
 *
 * @typedef {Object} ListWorkflowStatesContext
 * @property {import('../utils/config/mod.js').Config} config
 * @property {Object} effects
 * @property {import('../effects/linear/index.js').LinearEffect} effects.linear
 * @property {import('../effects/logging/mod.js').LoggingEffect} effects.logger
 */

/**
 * Input schema for ListWorkflowStates tool
 */
const ListWorkflowStatesInputSchema = z.object({
  teamId: z.string().describe('The ID of the team whose workflow states to list'),
  debug: z.boolean().default(false).describe('Debug mode to show extra diagnostics'),
});

/**
 * Workflow state schema for validation
 */
const WorkflowStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  position: z.number().optional(),
});

/**
 * Lists workflow states for a team in Linear
 *
 * @param {import('@linear/sdk').LinearClient} client - Linear client from SDK
 * @param {string} teamId - The ID of the team
 * @param {import('../effects/logging/mod.js').LoggingEffect} [logger] - Optional logger
 * @returns {Promise<Array>} List of workflow states
 */
async function listWorkflowStates(client, teamId, logger) {
  try {
    logger?.debug(`Fetching workflow states for team: ${teamId}`);
    
    // Get the team first
    const team = await client.team(teamId);
    if (!team) {
      throw new Error(`Team with ID ${teamId} not found`);
    }
    
    logger?.debug(`Found team: ${team.name}`);
    
    // Get workflow states for the team
    const workflowStates = await team.states();
    
    if (!workflowStates || !workflowStates.nodes) {
      return [];
    }
    
    // Process the workflow states
    const states = workflowStates.nodes.map(state => WorkflowStateSchema.parse({
      id: state.id,
      name: state.name,
      color: state.color,
      description: state.description,
      type: state.type, // e.g., "backlog", "unstarted", "started", "completed", "canceled"
      position: state.position,
    }));
    
    return states;
  } catch (error) {
    logger?.error(`Error fetching workflow states: ${error.message}`);
    throw error;
  }
}

/**
 * Handler for ListWorkflowStates tool
 * @type {import('./types/mod.js').ToolHandler<ListWorkflowStatesContext, typeof ListWorkflowStatesInputSchema>}
 */
const handler = async (ctx, { teamId, debug }) => {
  const logger = ctx.effects.logger;
  
  try {
    // Log details about config and parameters
    logger.debug('List workflow states called with parameters:', {
      teamId,
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
    
    // Get team info
    const team = await linearClient.team(teamId);
    const teamName = team ? team.name : 'Unknown Team';
    
    // Get workflow states
    logger.debug('Fetching workflow states for team:', teamId);
    const states = await listWorkflowStates(
      linearClient,
      teamId,
      logger
    );
    
    // Format response
    let responseText = '';
    
    if (states.length === 0) {
      responseText = `No workflow states found for team: ${teamName} (${teamId})`;
    } else {
      responseText = `# Workflow states for team: ${teamName}\n\n`;
      
      // Group states by type
      const statesByType = {};
      states.forEach(state => {
        const type = state.type || 'Other';
        if (!statesByType[type]) {
          statesByType[type] = [];
        }
        statesByType[type].push(state);
      });
      
      // Sort states by position within each type
      Object.keys(statesByType).forEach(type => {
        statesByType[type].sort((a, b) => {
          if (a.position !== undefined && b.position !== undefined) {
            return a.position - b.position;
          }
          return 0;
        });
      });
      
      // Print states by type
      Object.entries(statesByType).forEach(([type, typeStates]) => {
        // Capitalize type name (e.g., "backlog" -> "Backlog")
        const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
        responseText += `## ${formattedType} States\n\n`;
        
        typeStates.forEach(state => {
          responseText += `- **${state.name}** [ID: \`${state.id}\`]\n`;
          if (state.description) {
            responseText += `  Description: ${state.description}\n`;
          }
        });
        
        responseText += '\n';
      });
      
      // Add usage hint
      responseText += `## How to use with update_issue\n\n`;
      responseText += `To update an issue's status, use the \`update_issue\` tool with the \`stateId\` parameter:\n\n`;
      responseText += `\`\`\`
{
  "issueId": "your-issue-id",
  "stateId": "state-id-from-above"
}
\`\`\`\n\n`;
      responseText += `Example: To move an issue to "${states[0]?.name || 'Done'}", use stateId: "${states[0]?.id || 'state-id'}"\n`;
    }
    
    logger.debug('Returning formatted workflow states results');
    return {
      content: [{ type: 'text', text: responseText }],
    };
  } catch (error) {
    logger.error(`Error listing workflow states: ${error.message}`);
    logger.error(error.stack);
    
    // Create a user-friendly error message with troubleshooting guidance
    let errorMessage = `Error listing workflow states: ${error.message}`;
    
    // Add detailed diagnostic information if in debug mode
    if (debug) {
      errorMessage += '\n\n=== DETAILED DEBUG INFORMATION ===';
      
      // Add parameters that were used
      errorMessage += `\nParameters:
- teamId: ${teamId}`;
      
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
 * ListWorkflowStates tool factory
 */
export const ListWorkflowStates = create_tool({
  name: 'list_workflow_states',
  description: 'List the available workflow states for a Linear team. This is useful for finding the right stateId to use when updating an issue status.',
  inputSchema: ListWorkflowStatesInputSchema,
  handler,
});

// Export for testing
export { listWorkflowStates };