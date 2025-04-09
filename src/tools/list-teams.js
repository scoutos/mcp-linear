/**
 * Linear teams listing tool
 */
import { z } from 'zod';
import { create_tool } from './utils/mod.js';
import { TeamSchema } from '../effects/linear/types/types.js';

/**
 * ListTeamsContext type definition
 * Using JSDoc for now, but this could be converted to TypeScript or Zod schema in the future
 *
 * @typedef {Object} ListTeamsContext
 * @property {import('../utils/config/mod.js').Config} config
 * @property {Object} effects
 * @property {import('../effects/linear/index.js').LinearEffect} effects.linear
 * @property {import('../effects/logging/mod.js').LoggingEffect} effects.logger
 */

/**
 * Input schema for ListTeams tool
 */
const ListTeamsInputSchema = z.object({
  nameFilter: z
    .string()
    .optional()
    .describe('Filter teams by name (partial match)'),
  includeMembers: z
    .boolean()
    .default(true)
    .describe('Include sparse member listing for each team'),
  includeProjects: z
    .boolean()
    .default(true)
    .describe('Include sparse project listing for each team'),
  limit: z
    .number()
    .min(1)
    .max(100)
    .default(25)
    .describe('Maximum number of teams to return'),
  debug: z
    .boolean()
    .default(false)
    .describe('Debug mode to show extra diagnostics'),
});

/**
 * Extended team schema with additional fields
 */
const ExtendedTeamSchema = TeamSchema.extend({
  // Additional team properties
  description: z.string().optional(),
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
  // Relationships
  members: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        displayName: z.string().optional(),
        active: z.boolean().optional(),
      })
    )
    .optional(),
  projects: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        state: z.string().optional(),
        completed: z.boolean().optional(),
      })
    )
    .optional(),
  // Metrics
  memberCount: z.number().optional(),
  projectCount: z.number().optional(),
  issueCount: z.number().optional(),
  activeIssueCount: z.number().optional(),
  completedIssueCount: z.number().optional(),
  // Additional
  color: z.string().optional(),
  private: z.boolean().optional(),
  cycleEnable: z.boolean().optional(),
  timezone: z.string().optional(),
  markedAsDuplicate: z.boolean().optional(),
  issuesPerCycle: z.number().optional(),
  // URL
  url: z.string().optional(),
});

/**
 * Team search results schema
 */
const TeamSearchResultsSchema = z.object({
  results: z.array(ExtendedTeamSchema),
});

/**
 * Lists teams in Linear
 *
 * @param {import('@linear/sdk').LinearClient} client - Linear client from SDK
 * @param {Object} filters - Filter criteria
 * @param {string} [filters.nameFilter] - Filter teams by name (partial match)
 * @param {Object} options - Additional options
 * @param {boolean} [options.includeMembers=true] - Include member information
 * @param {boolean} [options.includeProjects=true] - Include project information
 * @param {number} [options.limit=25] - Maximum number of teams to return
 * @param {import('../effects/logging/mod.js').LoggingEffect} [logger] - Optional logger
 * @returns {Promise<import('zod').infer<typeof TeamSearchResultsSchema>>} Search results
 */
async function listTeams(
  client,
  filters = {},
  { includeMembers = true, includeProjects = true, limit = 25 } = {},
  logger
) {
  try {
    logger?.debug('Building Linear SDK parameters', {
      filters,
      includeMembers,
      includeProjects,
      limit,
    });

    // Get all teams
    // @ts-ignore - The Linear SDK types may not be fully accurate
    const teamsResponse = await client.teams();
    logger?.debug(`Found ${teamsResponse.nodes.length} teams`);

    // Filter teams by name if specified
    let filteredTeams = teamsResponse.nodes;
    if (filters.nameFilter) {
      const nameFilterLower = filters.nameFilter.toLowerCase();
      logger?.debug(`Filtering teams by name: ${filters.nameFilter}`);

      filteredTeams = filteredTeams.filter(team => {
        const name = team.name.toLowerCase();
        const key = team.key.toLowerCase();
        const description = team.description?.toLowerCase() || '';

        // Check for direct inclusion
        if (
          name.includes(nameFilterLower) ||
          key.includes(nameFilterLower) ||
          description.includes(nameFilterLower)
        ) {
          return true;
        }

        // No match found
        return false;
      });

      logger?.debug(
        `After name filtering, found ${filteredTeams.length} teams`
      );
    }

    // Apply limit to teams
    filteredTeams = filteredTeams.slice(0, limit);

    // Process teams to extract detailed information
    const processedTeams = await Promise.all(
      filteredTeams.map(async team => {
        logger?.debug(`Processing team ${team.name} (${team.id})`);

        // Build base team object
        const teamData = {
          id: team.id,
          name: team.name,
          key: team.key,
          description: team.description,
          createdAt: formatDate(team.createdAt),
          updatedAt: formatDate(team.updatedAt),
          color: team.color,
          private: team.private,
          // @ts-ignore - SDK may have different property name
          cycleEnable: team.cyclesEnabled || team.cycleEnable,
          timezone: team.timezone,
          // @ts-ignore - SDK structure may differ from types
          markedAsDuplicate: team.markedAsDuplicate,
          // @ts-ignore - SDK structure may differ from types
          issuesPerCycle: team.issuesPerCycle,
          // @ts-ignore - SDK structure may differ from types
          url: team.url,
        };

        // Add members if requested
        if (includeMembers) {
          try {
            // @ts-ignore - The Linear SDK types may not be fully accurate
            const membersResponse = await team.members();
            if (membersResponse?.nodes) {
              teamData.members = membersResponse.nodes.map(member => ({
                id: member.id,
                name: member.name,
                displayName: member.displayName || member.name,
                active: member.active !== false,
              }));
              teamData.memberCount = teamData.members.length;
            }
            logger?.debug(
              `Added ${teamData.memberCount || 0} members for team ${team.name}`
            );
          } catch (membersError) {
            logger?.warn(
              `Error fetching members for team ${team.name}: ${membersError.message}`
            );
          }
        }

        // Add projects if requested
        if (includeProjects) {
          try {
            // @ts-ignore - The Linear SDK types may not be fully accurate
            const projectsResponse = await team.projects();
            if (projectsResponse?.nodes) {
              teamData.projects = await Promise.all(
                projectsResponse.nodes.map(async project => {
                  // Get state information
                  let stateName = undefined;
                  try {
                    if (project.state) {
                      const state = await project.state;
                      if (state) {
                        // @ts-ignore - SDK structure may differ from types
                        stateName = state.name;
                      }
                    }
                  } catch (stateError) {
                    logger?.warn(
                      `Error fetching project state: ${stateError.message}`
                    );
                  }

                  return {
                    id: project.id,
                    name: project.name,
                    state: stateName,
                    // @ts-ignore - SDK has different property name
                    completed: project.completedAt ? true : false,
                  };
                })
              );
              teamData.projectCount = teamData.projects.length;
            }
            logger?.debug(
              `Added ${teamData.projectCount || 0} projects for team ${
                team.name
              }`
            );
          } catch (projectsError) {
            logger?.warn(
              `Error fetching projects for team ${team.name}: ${projectsError.message}`
            );
          }
        }

        // Add issue counts
        try {
          // @ts-ignore - The Linear SDK types may not be fully accurate
          const issuesResponse = await team.issues();
          if (issuesResponse) {
            teamData.issueCount = issuesResponse.nodes.length;
            teamData.activeIssueCount = issuesResponse.nodes.filter(
              issue => !issue.completedAt
            ).length;
            teamData.completedIssueCount = issuesResponse.nodes.filter(
              issue => issue.completedAt
            ).length;
          }
          logger?.debug(
            `Added issue counts for team ${team.name}: ${
              teamData.issueCount || 0
            } total`
          );
        } catch (issuesError) {
          logger?.warn(
            `Error fetching issues for team ${team.name}: ${issuesError.message}`
          );
        }

        return teamData;
      })
    );

    logger?.debug(`Successfully processed ${processedTeams.length} teams`);
    return TeamSearchResultsSchema.parse({ results: processedTeams });
  } catch (error) {
    // Enhanced error logging
    logger?.error(`Error listing Linear teams: ${error.message}`, {
      filters,
      includeMembers,
      includeProjects,
      limit,
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
 * Format a date value to ISO string
 * @param {Date|string|undefined} timestamp - The timestamp to format
 * @returns {string|undefined} Formatted ISO string or undefined
 */
function formatDate(timestamp) {
  if (!timestamp) return undefined;
  return new Date(timestamp).toISOString();
}

/**
 * Handler for ListTeams tool
 * @type {import('./types/mod.js').ToolHandler<ListTeamsContext, typeof ListTeamsInputSchema>}
 */
const handler = async (
  ctx,
  { nameFilter, includeMembers, includeProjects, limit, debug }
) => {
  const logger = ctx.effects.logger;

  try {
    // Log details about parameters
    logger.debug('List teams called with parameters:', {
      nameFilter,
      includeMembers,
      includeProjects,
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

    // List teams using the Linear SDK client
    logger.debug('Executing Linear API to list teams');
    const results = await listTeams(
      linearClient,
      { nameFilter },
      { includeMembers, includeProjects, limit },
      logger
    );

    // Log the results count
    logger.info(`Found ${results.results.length} teams matching criteria`);

    // Format the output
    let responseText = '';

    if (results.results.length === 0) {
      responseText = 'No teams found matching your criteria.';
    } else {
      responseText = 'Teams found:\n\n';

      // Format dates for display
      const formatDisplayDate = timestamp => {
        if (!timestamp) return 'Not available';
        try {
          const date = new Date(timestamp);
          return date.toLocaleString();
        } catch (e) {
          return 'Invalid date';
        }
      };

      results.results.forEach((team, index) => {
        responseText += `${index + 1}. **${team.name}** (${team.key})\n`;

        if (team.description) {
          responseText += `   Description: ${team.description}\n`;
        }

        // Add metrics
        const memberCount = team.memberCount || 0;
        const projectCount = team.projectCount || 0;
        const issueCount = team.issueCount || 0;
        const completedIssueCount = team.completedIssueCount || 0;

        responseText += `   Members: ${memberCount} | Projects: ${projectCount} | Issues: ${completedIssueCount}/${issueCount} completed\n`;

        // Add created/updated dates
        if (team.createdAt) {
          responseText += `   Created: ${formatDisplayDate(team.createdAt)}\n`;
        }

        if (team.url) {
          responseText += `   URL: ${team.url}\n`;
        }

        // Add members if included
        if (team.members && team.members.length > 0) {
          responseText += `   Members: `;
          const memberNames = team.members
            .slice(0, 5)
            .map(m => m.displayName || m.name)
            .join(', ');

          responseText += memberNames;

          if (team.members.length > 5) {
            responseText += `, +${team.members.length - 5} more`;
          }

          responseText += '\n';
        }

        // Add projects if included
        if (team.projects && team.projects.length > 0) {
          responseText += `   Projects: `;
          const projectNames = team.projects
            .slice(0, 5)
            .map(p => p.name)
            .join(', ');

          responseText += projectNames;

          if (team.projects.length > 5) {
            responseText += `, +${team.projects.length - 5} more`;
          }

          responseText += '\n';
        }

        responseText += '\n';
      });
    }

    logger.debug('Returning formatted list results');
    return {
      content: [{ type: 'text', text: responseText }],
    };
  } catch (error) {
    logger.error(`Error listing teams: ${error.message}`);
    logger.error(error.stack);

    // Create a user-friendly error message with troubleshooting guidance
    let errorMessage = `Error listing teams: ${error.message}`;

    // Add detailed diagnostic information if in debug mode
    if (debug) {
      errorMessage += '\n\n=== DETAILED DEBUG INFORMATION ===';

      // Add filter parameters that were used
      errorMessage += `\nParameters:
- nameFilter: ${nameFilter || '<not specified>'}
- includeMembers: ${includeMembers}
- includeProjects: ${includeProjects}
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
 * ListTeams tool factory
 */
export const ListTeams = create_tool({
  name: 'list_teams',
  description:
    'List Linear teams with details about their members, projects, and issues. Use this to get a high-level view of all teams in your Linear workspace.',
  inputSchema: ListTeamsInputSchema,
  handler,
});

// Export for testing
export { listTeams };
