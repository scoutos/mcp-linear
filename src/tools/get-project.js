/**
 * Linear project detail retrieval tool
 */
import { z } from 'zod';
import { create_tool } from './utils/mod.js';
import { ProjectSchema } from '../effects/linear/types/types.js';

/**
 * GetProjectContext type definition
 * Using JSDoc for now, but this could be converted to TypeScript or Zod schema in the future
 *
 * @typedef {Object} GetProjectContext
 * @property {import('../utils/config/mod.js').Config} config
 * @property {Object} effects
 * @property {import('../effects/linear/index.js').LinearEffect} effects.linear
 * @property {import('../effects/logging/mod.js').LoggingEffect} effects.logger
 */

/**
 * Input schema for GetProject tool
 */
const GetProjectInputSchema = z.object({
  projectId: z.string().describe('The ID of the Linear project to retrieve'),
  includeIssues: z
    .boolean()
    .default(true)
    .describe('Whether to include issues in the project details'),
  includeMembers: z
    .boolean()
    .default(true)
    .describe('Whether to include member details in the project'),
  includeComments: z
    .boolean()
    .default(false)
    .describe('Whether to include comments on issues in the project'),
  limit: z
    .number()
    .min(1)
    .max(50)
    .default(10)
    .describe('Maximum number of issues/members to include in details'),
  debug: z
    .boolean()
    .default(false)
    .describe('Debug mode to show extra diagnostics'),
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
  state: z.string().nullable().optional(),
  progress: z.number().optional(),
  completed: z.boolean().optional(),
  canceled: z.boolean().optional(),
  archived: z.boolean().optional(),
  // Add description
  description: z.string().optional(),
  // Add team information
  teamId: z.string().optional(),
  teamName: z.string().optional(),
  teamKey: z.string().optional(),
  // Add lead/member information
  leadId: z.string().optional(),
  leadName: z.string().optional(),
  members: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().optional(),
        role: z.string().optional(),
      })
    )
    .optional(),
  // Add issues
  issues: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        state: z.string().optional(),
        priority: z.number().optional(),
        assigneeName: z.string().optional(),
        createdAt: z.union([z.string(), z.date()]).optional(),
        updatedAt: z.union([z.string(), z.date()]).optional(),
        comments: z
          .array(
            z.object({
              id: z.string(),
              body: z.string(),
              userName: z.string().optional(),
              createdAt: z.union([z.string(), z.date()]).optional(),
            })
          )
          .optional(),
      })
    )
    .optional(),
  // Metrics
  issueCount: z.number().optional(),
  completedIssueCount: z.number().optional(),
  slackChannel: z.string().optional(),
  slugId: z.string().optional(),
  url: z.string().optional(),
});

/**
 * Gets detailed information about a project from Linear
 *
 * @param {import('@linear/sdk').LinearClient} client - Linear client from SDK
 * @param {string} projectId - ID of the project to retrieve
 * @param {Object} options - Query options
 * @param {boolean} [options.includeIssues=true] - Whether to include issues in the response
 * @param {boolean} [options.includeMembers=true] - Whether to include members in the response
 * @param {boolean} [options.includeComments=false] - Whether to include comments on issues
 * @param {number} [options.limit=10] - Maximum number of issues/members to include
 * @param {import('../effects/logging/mod.js').LoggingEffect} [logger] - Optional logger
 * @returns {Promise<import('zod').infer<typeof ExtendedProjectSchema>>} Project details
 */
async function getProject(
  client,
  projectId,
  {
    includeIssues = true,
    includeMembers = true,
    includeComments = false,
    limit = 10,
  } = {},
  logger
) {
  try {
    logger?.debug(`Fetching Linear project with ID: ${projectId}`);

    // Get the project
    // @ts-ignore - The Linear SDK types may not be fully accurate
    const project = await client.project(projectId);

    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    logger?.debug(`Successfully retrieved project: ${project.name}`);

    // Get team information if available
    let teamData = undefined;
    try {
      // @ts-ignore - SDK structure may differ from types
      if (project.team) {
        // If it's a promise, await it
        // @ts-ignore - SDK structure may differ from types
        const team =
          // @ts-ignore - SDK structure may differ from types
          typeof project.team.then === 'function'
            ? // @ts-ignore - SDK structure may differ from types
              await project.team
            : // @ts-ignore - SDK structure may differ from types
              project.team;

        if (team) {
          teamData = {
            id: team.id,
            name: team.name,
            key: team.key,
          };
          logger?.debug(`Found team for project: ${team.name}`);
        }
      }
    } catch (teamError) {
      logger?.warn(`Error fetching team data: ${teamError.message}`);
    }

    // Get lead information if available
    let leadData = undefined;
    try {
      if (project.lead) {
        // If it's a promise, await it
        const lead =
          typeof project.lead.then === 'function'
            ? await project.lead
            : project.lead;

        if (lead) {
          // @ts-ignore - LinearFetch<User> may not provide these properties on the type
          leadData = {
            // @ts-ignore - LinearFetch<User> may not provide id property
            id: lead.id,
            // @ts-ignore - LinearFetch<User> may not provide name property
            name: lead.name,
          };
          // @ts-ignore - LinearFetch<User> may not provide name property
          logger?.debug(`Found lead for project: ${lead.name}`);
        }
      }
    } catch (leadError) {
      logger?.warn(`Error fetching lead data: ${leadError.message}`);
    }

    // Prepare the result object with basic project info
    const result = {
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
      // Convert date properties to boolean status
      completed: !!project.completedAt,
      canceled: !!project.canceledAt,
      archived: !!project.archive,
      // Add team information
      teamId: teamData?.id,
      teamName: teamData?.name,
      teamKey: teamData?.key,
      // Add lead information
      leadId: leadData?.id,
      leadName: leadData?.name,
      // Metrics - these might be calculated or fetched separately
      // @ts-ignore - SDK may provide these properties
      issueCount: project.issueCount || 0,
      // @ts-ignore - SDK may provide these properties
      completedIssueCount: project.completedIssueCount || 0,
      // @ts-ignore - SDK may provide this property
      slackChannel: project.slackChannel,
      slugId: project.slugId,
      url: project.url,
    };

    // Fetch members if requested
    if (includeMembers) {
      logger?.debug('Fetching project members');
      try {
        // @ts-ignore - The Linear SDK types may not be fully accurate
        const projectMembers = await project.members();
        if (projectMembers && projectMembers.nodes) {
          const memberNodes = projectMembers.nodes.slice(0, limit);
          result.members = await Promise.all(
            memberNodes.map(async member => {
              // Get full member data
              return {
                id: member.id,
                name: member.name,
                email: member.email,
                // @ts-ignore - SDK structure may differ from types
                role: member.role || 'Member',
              };
            })
          );
          logger?.debug(`Retrieved ${result.members.length} project members`);
        }
      } catch (membersError) {
        logger?.warn(`Error fetching project members: ${membersError.message}`);
      }
    }

    // Fetch issues if requested
    if (includeIssues) {
      logger?.debug('Fetching project issues');
      try {
        // Build query params for issues
        const issueParams = {
          first: limit,
          filter: {
            project: { id: { eq: projectId } },
          },
        };

        // @ts-ignore - The Linear SDK types may not be fully accurate
        const projectIssues = await client.issues(issueParams);

        if (projectIssues && projectIssues.nodes) {
          result.issues = await Promise.all(
            projectIssues.nodes.map(async issue => {
              // Get assignee information
              let assigneeName = undefined;
              try {
                if (issue.assignee) {
                  // @ts-ignore - LinearFetch<User> types need special handling
                  const assignee = await issue.assignee;
                  if (assignee) {
                    // @ts-ignore - LinearFetch<User> may not provide expected properties
                    assigneeName = assignee.name;
                  }
                }
              } catch (assigneeError) {
                logger?.warn(
                  `Error fetching assignee data: ${assigneeError.message}`
                );
              }

              // Get state information
              let stateName = undefined;
              try {
                if (issue.state) {
                  // @ts-ignore - LinearFetch<WorkflowState> types need special handling
                  const state = await issue.state;
                  if (state) {
                    // @ts-ignore - LinearFetch<WorkflowState> may not provide expected properties
                    stateName = state.name;
                  }
                }
              } catch (stateError) {
                logger?.warn(
                  `Error fetching state data: ${stateError.message}`
                );
              }

              const issueResult = {
                id: issue.id,
                title: issue.title,
                description: issue.description,
                state: stateName,
                priority: issue.priority,
                assigneeName: assigneeName,
                createdAt: formatDate(issue.createdAt),
                updatedAt: formatDate(issue.updatedAt),
              };

              // Fetch comments if requested
              if (includeComments) {
                logger?.debug(`Fetching comments for issue: ${issue.id}`);
                try {
                  // @ts-ignore - The Linear SDK types may not be fully accurate
                  const issueComments = await issue.comments();
                  if (issueComments && issueComments.nodes) {
                    issueResult.comments = await Promise.all(
                      issueComments.nodes.slice(0, limit).map(async comment => {
                        let userName = undefined;
                        try {
                          if (comment.user) {
                            // @ts-ignore - LinearFetch<User> types need special handling
                            const user = await comment.user;
                            if (user) {
                              // @ts-ignore - LinearFetch<User> may not provide expected properties
                              userName = user.name;
                            }
                          }
                        } catch (userError) {
                          logger?.warn(
                            `Error fetching comment user data: ${userError.message}`
                          );
                        }

                        return {
                          id: comment.id,
                          body: comment.body,
                          userName: userName,
                          createdAt: formatDate(comment.createdAt),
                        };
                      })
                    );
                    logger?.debug(
                      `Retrieved ${issueResult.comments.length} comments for issue ${issue.id}`
                    );
                  }
                } catch (commentsError) {
                  logger?.warn(
                    `Error fetching issue comments: ${commentsError.message}`
                  );
                }
              }

              return issueResult;
            })
          );
          logger?.debug(`Retrieved ${result.issues.length} project issues`);
        }
      } catch (issuesError) {
        logger?.warn(`Error fetching project issues: ${issuesError.message}`);
      }
    }

    // Parse the result with our schema
    return ExtendedProjectSchema.parse(result);
  } catch (error) {
    // Enhanced error logging
    logger?.error(`Error retrieving Linear project: ${error.message}`, {
      projectId,
      includeIssues,
      includeMembers,
      includeComments,
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
 * Handler for GetProject tool
 * @type {import('./types/mod.js').ToolHandler<GetProjectContext, typeof GetProjectInputSchema>}
 */
const handler = async (
  ctx,
  { projectId, includeIssues, includeMembers, includeComments, limit, debug }
) => {
  const logger = ctx.effects.logger;

  try {
    // Log details about parameters
    logger.debug('Get project called with parameters:', {
      projectId,
      includeIssues,
      includeMembers,
      includeComments,
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

    // Get the project using the Linear SDK client
    logger.debug('Executing Linear API to get project details');
    const project = await getProject(
      linearClient,
      projectId,
      {
        includeIssues,
        includeMembers,
        includeComments,
        limit,
      },
      logger
    );

    logger.info(
      `Successfully retrieved project: ${project.name} (${project.id})`
    );

    // Format the output
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

    // Build the response
    let responseText = `# Project: ${project.name}\n\n`;
    responseText += `**ID:** ${project.id}\n`;

    if (project.description) {
      responseText += `\n**Description:**\n${project.description}\n`;
    }

    responseText += `\n**Status:** ${status} (${progressPercent}% complete)\n`;

    if (project.teamName) {
      responseText += `**Team:** ${project.teamName}`;
      if (project.teamKey) {
        responseText += ` (${project.teamKey})`;
      }
      responseText += '\n';
    }

    if (project.leadName) {
      responseText += `**Lead:** ${project.leadName}\n`;
    }

    responseText += `**Issues:** ${project.completedIssueCount}/${project.issueCount} completed\n`;

    // Add dates
    responseText += `\n**Timeline:**\n`;
    if (project.startDate) {
      responseText += `- Start date: ${formatDisplayDate(project.startDate)}\n`;
    }

    if (project.targetDate) {
      responseText += `- Target date: ${formatDisplayDate(
        project.targetDate
      )}\n`;
    }

    responseText += `- Created: ${formatDisplayDate(project.createdAt)}\n`;

    if (project.updatedAt) {
      responseText += `- Last updated: ${formatDisplayDate(
        project.updatedAt
      )}\n`;
    }

    // Add URL if available
    if (project.url) {
      responseText += `\n**URL:** ${project.url}\n`;
    }

    // Add members if included
    if (project.members && project.members.length > 0) {
      responseText += `\n## Project Members (${project.members.length})\n\n`;
      project.members.forEach((member, idx) => {
        responseText += `${idx + 1}. **${member.name}**`;
        if (member.role) {
          responseText += ` - ${member.role}`;
        }
        if (member.email) {
          responseText += ` <${member.email}>`;
        }
        responseText += '\n';
      });
    }

    // Add issues if included
    if (project.issues && project.issues.length > 0) {
      responseText += `\n## Project Issues (${project.issues.length}/${project.issueCount})\n\n`;
      project.issues.forEach((issue, idx) => {
        responseText += `${idx + 1}. **${issue.title}** (${issue.id})\n`;
        if (issue.state) {
          responseText += `   - Status: ${issue.state}\n`;
        }

        if (issue.assigneeName) {
          responseText += `   - Assigned to: ${issue.assigneeName}\n`;
        }

        if (issue.priority !== undefined) {
          const priorityLabels = [
            'No priority',
            'Urgent',
            'High',
            'Medium',
            'Low',
          ];
          responseText += `   - Priority: ${priorityLabels[issue.priority]}\n`;
        }

        if (issue.updatedAt) {
          responseText += `   - Last updated: ${formatDisplayDate(
            issue.updatedAt
          )}\n`;
        }

        if (issue.comments && issue.comments.length > 0) {
          responseText += `   - Comments (${issue.comments.length}):\n`;
          issue.comments.forEach((comment, commentIdx) => {
            responseText += `     ${commentIdx + 1}. `;
            if (comment.userName) {
              responseText += `**${comment.userName}**: `;
            }

            // Truncate long comments
            const commentText =
              comment.body.length > 100
                ? comment.body.substring(0, 97) + '...'
                : comment.body;

            responseText += `${commentText}\n`;
          });
        }

        responseText += '\n';
      });
    }

    logger.debug('Returning formatted project details');
    return {
      content: [{ type: 'text', text: responseText }],
    };
  } catch (error) {
    logger.error(`Error retrieving project: ${error.message}`);
    logger.error(error.stack);

    // Create a user-friendly error message with troubleshooting guidance
    let errorMessage = `Error retrieving project: ${error.message}`;

    // Add detailed diagnostic information if in debug mode
    if (debug) {
      errorMessage += '\n\n=== DETAILED DEBUG INFORMATION ===';

      // Add parameters that were used
      errorMessage += `\nParameters:
- projectId: ${projectId}
- includeIssues: ${includeIssues}
- includeMembers: ${includeMembers}
- includeComments: ${includeComments}
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
 * GetProject tool factory
 */
export const GetProject = create_tool({
  name: 'get_project',
  description:
    'Get detailed information about a Linear project including team, lead, issues, and members. Use this to see comprehensive details of a specific project.',
  inputSchema: GetProjectInputSchema,
  handler,
});

// Export for testing
export { getProject };
