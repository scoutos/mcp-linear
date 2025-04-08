/**
 * Linear ticket listing tool
 */
import { z } from 'zod';
import { create_tool } from './utils/mod.js';
import {
  IssueSchema,
  SearchResultsSchema,
} from '../effects/linear/types/types.js';

/**
 * ListTicketsContext type definition
 * Using JSDoc for now, but this could be converted to TypeScript or Zod schema in the future
 *
 * @typedef {Object} ListTicketsContext
 * @property {import('../utils/config/mod.js').Config} config
 * @property {Object} effects
 * @property {import('../effects/linear/index.js').LinearEffect} effects.linear
 * @property {import('../effects/logging/mod.js').LoggingEffect} effects.logger
 */

/**
 * Input schema for ListTickets tool
 */
const ListTicketsInputSchema = z.object({
  assignedToMe: z.boolean().default(false),
  assignee: z.string().optional(),
  status: z.string().optional(),
  project: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
  sortDirection: z.enum(['ASC', 'DESC']).default('DESC'),
  limit: z.number().min(1).max(100).default(25),
  debug: z.boolean().default(false), // Debug mode to show extra diagnostics
});

/**
 * Lists issues in Linear using the SDK with optional filtering
 *
 * @param {import('@linear/sdk').LinearClient} client - Linear client from SDK
 * @param {Object} filters - Filter criteria
 * @param {boolean} [filters.assignedToMe=false] - Only show tickets assigned to me
 * @param {string} [filters.assignee] - Filter by assignee identifier
 * @param {string} [filters.status] - Filter by status name
 * @param {string} [filters.project] - Filter by project name
 * @param {Object} options - Search options
 * @param {number} [options.limit=25] - Maximum number of results to return
 * @param {'priority' | 'createdAt' | 'updatedAt'} [options.sortBy] - Field to sort by
 * @param {'ASC' | 'DESC'} [options.sortDirection='ASC'] - Direction to sort
 * @param {import('../effects/logging/mod.js').LoggingEffect} [logger] - Optional logger
 * @returns {Promise<import('../effects/linear/types/types.js').SearchResults>} Search results
 */
async function listIssues(
  client,
  filters = {},
  { limit = 25, sortBy, sortDirection = 'ASC' } = {},
  logger
) {
  try {
    logger?.debug('Building Linear SDK filter parameters', {
      filters,
      limit,
      sortBy: sortBy || 'none',
      sortDirection,
    });

    // Build filters properly using Linear SDK filter syntax
    const filter = {};

    // Add assignee filter
    if (filters.assignedToMe) {
      // For assignedToMe we'll use the viewer API directly,
      // but we'll still build the filter for normal query as fallback
      filter.assignee = { id: { eq: 'me' } };
    } else if (filters.assignee) {
      filter.assignee = { name: { eq: filters.assignee } };
    }

    // Add status filter
    if (filters.status) {
      // Properly filter by state name
      filter.state = { name: { eq: filters.status } };
      logger?.debug(`Filtering by state name: ${filters.status}`);
    }

    // Add project filter
    if (filters.project) {
      // Filter by project name
      filter.project = { name: { eq: filters.project } };
      logger?.debug(`Filtering by project name: ${filters.project}`);
    }

    logger?.debug('Built filter object:', JSON.stringify(filter, null, 2));

    // Use the sort direction as provided
    let direction = sortDirection;
    logger?.debug(`Using sort direction: ${direction} for field: ${sortBy}`);

    // Build search parameters
    const searchParams = {
      first: limit,
    };

    // Add sort parameters if specified
    if (sortBy) {
      searchParams.orderBy = sortBy;
      searchParams.orderDirection = direction;
    }

    // Build the full GraphQL query parameters with proper filter
    const queryParams = {
      filter, // Use the properly constructed filter object
      ...searchParams,
    };

    // Log the complete query parameters for debugging
    logger?.debug(
      'Full Linear API query parameters:',
      JSON.stringify(queryParams, null, 2)
    );

    let result;

    try {
      // First try using the viewer API which may be more reliable for getting assigned tickets
      if (filters.assignedToMe) {
        logger?.debug(
          'Using viewer.assignedIssues API for retrieving assigned tickets'
        );
        const me = await client.viewer;
        result = await me.assignedIssues(searchParams);
        logger?.debug('Successfully retrieved tickets using viewer API');
      } else {
        // Otherwise use the direct GraphQL API from Linear SDK
        logger?.debug('Using issues API for general ticket search');
        // @ts-ignore - The Linear SDK types are not accurate for the GraphQL API
        result = await client.issues(queryParams);
        logger?.debug('Successfully retrieved tickets using issues API');
      }
    } catch (error) {
      logger?.error(`Linear API error:`, error);
      throw error;
    }

    // Log the raw response structure (without full content)
    logger?.debug(`Linear API response structure:`, {
      hasNodes: !!result.nodes,
      nodeCount: result.nodes?.length || 0,
      firstNodeKeys: result.nodes?.[0] ? Object.keys(result.nodes[0]) : [],
    });

    // Log search results at debug level
    logger?.debug(`Linear list returned ${result.nodes.length} results`);

    // Process issues from Linear SDK format to our domain model
    // The Linear SDK returns promises for many fields, so we need to await them
    const processedIssues = [];

    for (const issue of result.nodes) {
      try {
        logger?.debug(`Processing issue ${issue.id}`);

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
          logger?.warn(
            `Error fetching assignee data: ${assigneeError.message}`
          );
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

        const processedIssue = IssueSchema.parse({
          id: issue.id,
          title: issue.title,
          description: issue.description || undefined,
          priority: issue.priority,
          assignee: assigneeData,
          project: projectData,
          status: statusName,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
        });

        processedIssues.push(processedIssue);
      } catch (processError) {
        logger?.error(
          `Error processing issue ${issue.id}: ${processError.message}`
        );
        // Continue processing other issues even if one fails
      }
    }

    logger?.debug(
      `Successfully processed ${processedIssues.length}/${result.nodes.length} issues`
    );
    const issues = processedIssues;

    // Return the processed results
    return SearchResultsSchema.parse({ results: issues });
  } catch (error) {
    // Enhanced error logging
    logger?.error(`Error listing Linear issues: ${error.message}`, {
      filters,
      limit,
      sortBy,
      sortDirection,
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
 * Handler for ListTickets tool
 * @type {import('./types/mod.js').ToolHandler<ListTicketsContext, typeof ListTicketsInputSchema>}
 */
const handler = async (
  ctx,
  {
    assignedToMe,
    assignee,
    status,
    project,
    sortBy,
    sortDirection,
    limit,
    debug,
  }
) => {
  const logger = ctx.effects.logger;

  try {
    // Log details about config and parameters
    logger.debug('List tickets called with parameters:', {
      assignedToMe,
      assignee,
      status,
      project,
      sortBy,
      sortDirection,
      limit,
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

    // List issues using the Linear SDK client with filters
    logger.debug('Executing Linear API list with filters');
    const results = await listIssues(
      linearClient,
      {
        assignedToMe,
        assignee,
        status,
        project,
      },
      {
        limit,
        sortBy,
        sortDirection,
      },
      logger
    );

    // Log the results count
    logger.info(`Found ${results.results.length} tickets matching criteria`);

    // Format the output
    let responseText = '';

    logger.info(`Result: ${JSON.stringify(results, null, 2)}`);

    if (results.results.length === 0) {
      responseText = 'No tickets found matching your criteria.';
    } else {
      responseText = 'Tickets found:\n\n';

      results.results.forEach((issue, index) => {
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

        responseText += `${index + 1}. ${issue.title || 'Untitled'}\n`;
        responseText += `   ID: ${issue.id}\n`;
        responseText += `   Status: ${issue.status || 'Unknown'}\n`;
        responseText += `   Priority: ${priorityMap[priority] || 'Unknown'}\n`;

        if (issue.project) {
          responseText += `   Project: ${issue.project.name}\n`;
        }

        if (issue.assignee) {
          responseText += `   Assignee: ${issue.assignee.name}\n`;
        }

        responseText += `   Created: ${formatDate(issue.createdAt)}\n`;
        responseText += `   Updated: ${formatDate(issue.updatedAt)}\n`;

        responseText += '\n';
      });
    }

    logger.debug('Returning formatted list results');
    return {
      content: [{ type: 'text', text: responseText }],
    };
  } catch (error) {
    logger.error(`Error listing tickets: ${error.message}`);
    logger.error(error.stack);

    // Create a user-friendly error message with troubleshooting guidance
    let errorMessage = `Error listing tickets: ${error.message}`;

    // Add detailed diagnostic information if in debug mode
    if (debug) {
      errorMessage += '\n\n=== DETAILED DEBUG INFORMATION ===';

      // Add filter parameters that were used
      errorMessage += `\nFilter parameters:
- assignedToMe: ${assignedToMe}
- assignee: ${assignee || '<not specified>'}
- status: ${status || '<not specified>'}
- project: ${project || '<not specified>'}
- sortBy: ${sortBy}
- sortDirection: ${sortDirection}
- limit: ${limit}`;

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

    // No need to restore log level as it's not used
    // if (debug && logger.setLevel) {
    //  logger.setLevel(oldLogLevel);
    // }

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
 * ListTickets tool factory
 */
export const ListTickets = create_tool({
  name: 'list_tickets',
  description:
    'List Linear tickets with filtering by assignee, status, and project. Use this instead of search when you just want to browse tickets without a search query.',
  inputSchema: ListTicketsInputSchema,
  handler,
});

// Export for testing
export { listIssues };
