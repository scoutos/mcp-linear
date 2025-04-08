/**
 * Linear projects listing tool
 */
import { z } from 'zod';
import { create_tool } from './utils/mod.js';
import { ProjectSchema } from '../effects/linear/types/types.js';

/**
 * We're using JSDoc to reference types from the Linear SDK
 * The SDK exports types for LinearClient which provides access to all API methods
 */

/**
 * ListProjectsContext type definition
 * Using JSDoc for now, but this could be converted to TypeScript or Zod schema in the future
 *
 * @typedef {Object} ListProjectsContext
 * @property {import('../utils/config/mod.js').Config} config
 * @property {Object} effects
 * @property {import('../effects/linear/index.js').LinearEffect} effects.linear
 * @property {import('../effects/logging/mod.js').LoggingEffect} effects.logger
 */

/**
 * Input schema for ListProjects tool
 */
const ListProjectsInputSchema = z.object({
  teamId: z.string().optional(),
  nameFilter: z.string().optional(),
  projectId: z.string().optional(), // Add direct project ID lookup
  state: z.enum(['active', 'completed', 'canceled', 'all']).optional(), // Add state filter
  includeArchived: z.boolean().default(false),
  includeThroughIssues: z.boolean().default(true), // Add option to include projects referenced by issues
  fuzzyMatch: z.boolean().default(true), // Enable fuzzy name matching by default
  limit: z.number().min(1).max(100).default(25),
  debug: z.boolean().default(false), // Debug mode to show extra diagnostics
});

/**
 * Extended project schema with additional fields
 */
const ExtendedProjectSchema = ProjectSchema.extend({
  // Add timestamps
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
  startDate: z.union([z.string(), z.date()]).optional(),
  targetDate: z.union([z.string(), z.date()]).optional(),
  // Add status information
  state: z.string().optional(),
  progress: z.number().optional(),
  completed: z.boolean().optional(),
  canceled: z.boolean().optional(),
  archived: z.boolean().optional(),
  // Add description
  description: z.string().optional(),
  // Add team information
  teamId: z.string().optional(),
  teamName: z.string().optional(),
  // Add lead/member information
  leadId: z.string().optional(),
  leadName: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
  issueCount: z.number().optional(),
  completedIssueCount: z.number().optional(),
  slackChannel: z.string().optional(),
  slugId: z.string().optional(),
  url: z.string().optional(),
});

/**
 * Project search results schema
 */
const ProjectSearchResultsSchema = z.object({
  results: z.array(ExtendedProjectSchema),
});

/**
 * Lists projects in Linear
 *
 * @param {import('@linear/sdk').LinearClient} client - Linear client from SDK
 * @param {Object} filters - Filter criteria
 * @param {string} [filters.teamId] - Filter by team ID
 * @param {string} [filters.projectId] - Direct lookup by project ID
 * @param {string} [filters.nameFilter] - Filter projects by name
 * @param {string} [filters.state] - Filter by project state
 * @param {boolean} [filters.includeArchived=false] - Include archived projects
 * @param {boolean} [filters.includeThroughIssues=true] - Include projects referenced by issues
 * @param {boolean} [filters.fuzzyMatch=true] - Use fuzzy/partial matching for names
 * @param {Object} options - Search options
 * @param {number} [options.limit=25] - Maximum number of results to return
 * @param {import('../effects/logging/mod.js').LoggingEffect} [logger] - Optional logger
 * @returns {Promise<import('zod').infer<typeof ProjectSearchResultsSchema>>} Search results
 */
async function listProjects(client, filters = {}, { limit = 25 } = {}, logger) {
  try {
    logger?.debug('Building Linear SDK filter parameters', {
      filters,
      limit,
    });

    // Store all projects we find
    const allProjects = new Map();

    // Direct lookup by project ID if specified
    if (filters.projectId) {
      logger?.debug(`Looking up project by ID: ${filters.projectId}`);
      try {
        // @ts-ignore - The Linear SDK types may not be fully accurate
        const project = await client.project(filters.projectId);
        if (project) {
          allProjects.set(project.id, project);
          logger?.debug(`Found project by ID: ${project.name} (${project.id})`);
        }
      } catch (projectError) {
        logger?.warn(`Error fetching project by ID: ${projectError.message}`);
      }
    }

    // Build query parameters for projects() method
    const queryParams = {
      first: 100, // Request more projects to ensure we get a good sample
      includeArchived: filters.includeArchived,
    };

    // Apply state filter if provided
    if (filters.state && filters.state !== 'all') {
      // @ts-ignore - The Linear SDK types may not be fully accurate
      queryParams.filter = {
        state: { eq: filters.state },
      };
      logger?.debug(`Added state filter: ${filters.state}`);
    }

    // Add team-specific projects if teamId is provided
    if (filters.teamId) {
      logger?.debug(`Adding team filter: ${filters.teamId}`);

      try {
        // Get the team first
        // @ts-ignore - The Linear SDK types may not be fully accurate
        const team = await client.team(filters.teamId);
        if (team) {
          // Then get projects for that team
          // @ts-ignore - The Linear SDK types may not be fully accurate
          const teamProjectsResponse = await team.projects(queryParams);
          logger?.debug(
            `Found ${teamProjectsResponse.nodes.length} projects for team ${filters.teamId}`
          );

          // Add all team projects to our collection
          for (const project of teamProjectsResponse.nodes) {
            allProjects.set(project.id, project);
          }
        } else {
          logger?.warn(`Team with ID ${filters.teamId} not found`);
        }
      } catch (teamError) {
        logger?.warn(`Error fetching team data: ${teamError.message}`);
      }
    }

    // Get all projects regardless of team
    logger?.debug(
      'Querying all projects with params:',
      JSON.stringify(queryParams, null, 2)
    );

    try {
      // @ts-ignore - The Linear SDK types may not be fully accurate
      const projectsResponse = await client.projects(queryParams);
      logger?.debug(
        `Found ${projectsResponse.nodes.length} projects from direct query`
      );

      // Add all projects to our collection
      for (const project of projectsResponse.nodes) {
        allProjects.set(project.id, project);
      }
    } catch (projectsError) {
      logger?.warn(`Error fetching projects: ${projectsError.message}`);
    }

    // Add projects referenced by issues if enabled
    if (filters.includeThroughIssues !== false) {
      logger?.debug('Looking for projects referenced by issues');

      try {
        // Build issue query parameters
        const issueQueryParams = {
          first: 100, // Get a good sample of issues
        };

        // If we're filtering by team, also filter issues by team
        if (filters.teamId) {
          // @ts-ignore - Filter structure
          issueQueryParams.filter = { team: { id: { eq: filters.teamId } } };
        }

        // @ts-ignore - The Linear SDK types may not be fully accurate
        const issuesResponse = await client.issues(issueQueryParams);
        logger?.debug(
          `Found ${issuesResponse.nodes.length} issues to scan for projects`
        );

        // Extract projects from issues
        for (const issue of issuesResponse.nodes) {
          if (issue.project) {
            try {
              const project = await issue.project;
              if (project && !allProjects.has(project.id)) {
                // Only process if we don't already have this project
                allProjects.set(project.id, project);
                logger?.debug(
                  `Found additional project from issue: ${project.name} (${project.id})`
                );
              }
            } catch (projectError) {
              logger?.warn(
                `Error fetching project from issue: ${projectError.message}`
              );
            }
          }
        }
      } catch (issuesError) {
        logger?.warn(`Error fetching issues: ${issuesError.message}`);
      }
    }

    logger?.debug(
      `Total projects found (before filtering): ${allProjects.size}`
    );

    // Convert projects map to array
    let projectsArray = Array.from(allProjects.values());

    // Apply name filtering
    if (filters.nameFilter) {
      projectsArray = filterProjectsByName(
        projectsArray,
        filters.nameFilter,
        filters.fuzzyMatch !== false, // Enable fuzzy matching unless explicitly disabled
        logger
      );

      logger?.debug(`Projects after name filtering: ${projectsArray.length}`);
    }

    // Sort projects by updatedAt (most recent first) or name
    projectsArray.sort((a, b) => {
      if (a.updatedAt && b.updatedAt) {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
      return a.name.localeCompare(b.name);
    });

    // Apply limit
    projectsArray = projectsArray.slice(0, limit);
    logger?.debug(
      `Projects after limiting to ${limit}: ${projectsArray.length}`
    );

    // Process projects to extract all relevant information
    const processedProjects = await processProjects(projectsArray, logger);
    logger?.debug(
      `Successfully processed ${processedProjects.length} projects`
    );

    return ProjectSearchResultsSchema.parse({ results: processedProjects });
  } catch (error) {
    // Enhanced error logging
    logger?.error(`Error listing Linear projects: ${error.message}`, {
      filters,
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
 * Filter projects by name with enhanced matching capabilities
 *
 * @param {Array} projects - The projects to filter
 * @param {string} nameFilter - The name filter to apply
 * @param {boolean} [fuzzyMatch=true] - Whether to use fuzzy/flexible matching
 * @param {import('../effects/logging/mod.js').LoggingEffect} [logger] - Optional logger
 * @returns {Array} Filtered projects
 */
function filterProjectsByName(projects, nameFilter, fuzzyMatch = true, logger) {
  if (!nameFilter) {
    return projects;
  }

  // Clean up the filter text for better matching
  const nameFilterClean = nameFilter
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  logger?.debug(
    `Filtering by name: "${nameFilter}" (cleaned: "${nameFilterClean}")`
  );

  // Create variants for improved matching
  const nameVariants = [
    nameFilterClean,
    // Remove spaces
    nameFilterClean.replace(/\s+/g, ''),
    // Replace spaces with hyphens
    nameFilterClean.replace(/\s+/g, '-'),
    // Replace spaces with underscores
    nameFilterClean.replace(/\s+/g, '_'),
  ];

  // For partial matching (if enabled)
  const nameFilterParts = fuzzyMatch ? nameFilterClean.split(/\s+/) : [];

  // If filter might be an acronym, generate expansion pattern
  const possibleAcronym = /^[A-Z0-9]{2,}$/i.test(nameFilterClean);

  logger?.debug(
    `Using ${fuzzyMatch ? 'fuzzy' : 'exact'} matching with ${
      nameVariants.length
    } variants` + `${possibleAcronym ? ' (possible acronym)' : ''}`
  );

  const filtered = projects.filter(project => {
    // Get project properties to match against
    const name = project.name.toLowerCase();
    const description = project.description?.toLowerCase() || '';
    const slugId = project.slugId?.toLowerCase() || '';

    // Direct matches with name variants
    for (const variant of nameVariants) {
      if (
        name.includes(variant) ||
        slugId.includes(variant) ||
        description.includes(variant)
      ) {
        return true;
      }
    }

    // Special case for acronyms: check if project name words match acronym letters
    if (possibleAcronym) {
      const nameWords = name.split(/[\s\-_]+/);

      if (nameWords.length >= nameFilterClean.length) {
        // Check if first letters form the acronym
        const acronym = nameWords
          .map(word => word.charAt(0))
          .join('')
          .toLowerCase();

        if (acronym.includes(nameFilterClean.toLowerCase())) {
          return true;
        }
      }
    }

    // For fuzzy matching, check if all parts of the filter are present
    if (fuzzyMatch && nameFilterParts.length > 1) {
      // All parts must be present in name or description
      const allPartsPresent = nameFilterParts.every(
        part => name.includes(part) || description.includes(part)
      );

      if (allPartsPresent) {
        return true;
      }
    }

    return false;
  });

  logger?.debug(`After name filtering, found ${filtered.length} projects`);

  return filtered;
}

/**
 * Process projects to extract all relevant information
 *
 * @param {Array} projects - The projects to process
 * @param {import('../effects/logging/mod.js').LoggingEffect} [logger] - Optional logger
 * @returns {Promise<Array>} Processed projects
 */
async function processProjects(projects, logger) {
  return Promise.all(
    projects.map(async project => {
      let teamName = undefined;
      let leadName = undefined;

      // Get team information if available
      try {
        if (project.team) {
          // If it's a promise, await it
          const team =
            typeof project.team.then === 'function'
              ? await project.team
              : project.team;

          if (team) {
            teamName = team.name;
            logger?.debug(`Found team for project: ${teamName}`);
          }
        }
      } catch (teamError) {
        logger?.warn(`Error fetching team data: ${teamError.message}`);
      }

      // Get lead information if available
      try {
        if (project.lead) {
          // If it's a promise, await it
          const lead =
            typeof project.lead.then === 'function'
              ? await project.lead
              : project.lead;

          if (lead) {
            leadName = lead.name;
            logger?.debug(`Found lead for project: ${leadName}`);
          }
        }
      } catch (leadError) {
        logger?.warn(`Error fetching lead data: ${leadError.message}`);
      }

      // Format timestamps to be consistent
      const formatDate = timestamp => {
        if (!timestamp) return undefined;
        return new Date(timestamp).toISOString();
      };

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        // Add timestamps
        createdAt: formatDate(project.createdAt),
        updatedAt: formatDate(project.updatedAt),
        startDate: formatDate(project.startDate),
        targetDate: formatDate(project.targetDate),
        // Add status information
        state: project.state,
        progress: project.progress || 0,
        completed: project.completed || false,
        canceled: project.canceled || false,
        archived: project.archived || false,
        // Add team information
        teamId: project.teamId,
        teamName: teamName,
        // Add lead information
        leadId: project.leadId,
        leadName: leadName,
        // Add metrics
        memberIds: project.memberIds || [],
        issueCount: project.issueCount || 0,
        completedIssueCount: project.completedIssueCount || 0,
        // Other details
        slackChannel: project.slackChannel,
        slugId: project.slugId,
        url: project.url,
      };
    })
  );
}

/**
 * Handler for ListProjects tool
 * @type {import('./types/mod.js').ToolHandler<ListProjectsContext, typeof ListProjectsInputSchema>}
 */
const handler = async (
  ctx,
  {
    teamId,
    nameFilter,
    projectId,
    state,
    includeArchived,
    includeThroughIssues,
    fuzzyMatch,
    limit,
    debug,
  }
) => {
  const logger = ctx.effects.logger;

  try {
    // Log details about config and parameters
    logger.debug('List projects called with parameters:', {
      teamId,
      nameFilter,
      projectId,
      state,
      includeArchived,
      includeThroughIssues,
      fuzzyMatch,
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

    // List projects using the Linear SDK client with filters
    logger.debug('Executing Linear API list with filters');
    const results = await listProjects(
      linearClient,
      {
        teamId,
        nameFilter,
        projectId,
        state,
        includeArchived,
        includeThroughIssues,
        fuzzyMatch,
      },
      {
        limit,
      },
      logger
    );

    // Log the results count
    logger.info(`Found ${results.results.length} projects matching criteria`);

    // Format the output
    let responseText = '';

    if (results.results.length === 0) {
      responseText = 'No projects found matching your criteria.';
    } else {
      responseText = 'Projects found:\n\n';

      results.results.forEach((project, index) => {
        // Format dates for display
        const formatDisplayDate = timestamp => {
          if (!timestamp) return 'Not set';
          try {
            const date = new Date(timestamp);
            return date.toLocaleString();
          } catch (e) {
            return 'Invalid date';
          }
        };

        // Determine project status
        let status = 'Active';
        if (project.archived) status = 'Archived';
        else if (project.canceled) status = 'Canceled';
        else if (project.completed) status = 'Completed';
        else if (project.state) status = project.state;

        // Format completion percentage
        const progressPercent = Math.round(project.progress * 100);

        responseText += `${index + 1}. ${project.name}\n`;
        responseText += `   ID: ${project.id}\n`;

        if (project.description) {
          // Truncate description to keep output manageable
          const truncatedDescription =
            project.description.length > 100
              ? project.description.substring(0, 97) + '...'
              : project.description;
          responseText += `   Description: ${truncatedDescription}\n`;
        }

        responseText += `   Status: ${status} (${progressPercent}% complete)\n`;

        if (project.teamName) {
          responseText += `   Team: ${project.teamName}\n`;
        }

        if (project.leadName) {
          responseText += `   Lead: ${project.leadName}\n`;
        }

        responseText += `   Issues: ${project.completedIssueCount}/${project.issueCount} completed\n`;

        // Add dates
        if (project.startDate) {
          responseText += `   Start date: ${formatDisplayDate(
            project.startDate
          )}\n`;
        }

        if (project.targetDate) {
          responseText += `   Target date: ${formatDisplayDate(
            project.targetDate
          )}\n`;
        }

        responseText += `   Created: ${formatDisplayDate(project.createdAt)}\n`;

        if (project.updatedAt) {
          responseText += `   Updated: ${formatDisplayDate(
            project.updatedAt
          )}\n`;
        }

        if (project.url) {
          responseText += `   URL: ${project.url}\n`;
        }

        responseText += '\n';
      });
    }

    logger.debug('Returning formatted list results');
    return {
      content: [{ type: 'text', text: responseText }],
    };
  } catch (error) {
    logger.error(`Error listing projects: ${error.message}`);
    logger.error(error.stack);

    // Create a user-friendly error message with troubleshooting guidance
    let errorMessage = `Error listing projects: ${error.message}`;

    // Add detailed diagnostic information if in debug mode
    if (debug) {
      errorMessage += '\n\n=== DETAILED DEBUG INFORMATION ===';

      // Add filter parameters that were used
      errorMessage += `\nFilter parameters:
- teamId: ${teamId || '<not specified>'}
- nameFilter: ${nameFilter || '<not specified>'}
- projectId: ${projectId || '<not specified>'}
- state: ${state || '<not specified>'}
- includeArchived: ${includeArchived}
- includeThroughIssues: ${includeThroughIssues}
- fuzzyMatch: ${fuzzyMatch}
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
 * ListProjects tool factory
 */
export const ListProjects = create_tool({
  name: 'list_projects',
  description:
    'List Linear projects with optional filtering by team, name, and archive status. Shows project details including status, lead, progress, and dates.',
  inputSchema: ListProjectsInputSchema,
  handler,
});

// Export for testing
export { listProjects };
