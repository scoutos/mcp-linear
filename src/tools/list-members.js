/**
 * Linear members listing tool
 */
import { z } from 'zod';
import { create_tool } from './utils/mod.js';
import { UserSchema } from '../effects/linear/types/types.js';

/**
 * We're using JSDoc to reference types from the Linear SDK
 * The SDK exports types for LinearClient which provides access to all API methods
 */

/**
 * ListMembersContext type definition
 * Using JSDoc for now, but this could be converted to TypeScript or Zod schema in the future
 *
 * @typedef {Object} ListMembersContext
 * @property {import('../utils/config/mod.js').Config} config
 * @property {Object} effects
 * @property {import('../effects/linear/index.js').LinearEffect} effects.linear
 * @property {import('../effects/logging/mod.js').LoggingEffect} effects.logger
 */

/**
 * Input schema for ListMembers tool
 */
const ListMembersInputSchema = z.object({
  teamId: z.string().optional(),
  nameFilter: z.string().optional(),
  limit: z.number().min(1).max(100).default(25),
  debug: z.boolean().default(false), // Debug mode to show extra diagnostics
});

/**
 * Extended user schema with additional fields
 */
const ExtendedUserSchema = UserSchema.extend({
  displayName: z.string().optional(),
  active: z.boolean().optional(),
  // Add timestamps
  createdAt: z.union([z.string(), z.date()]).optional(),
  updatedAt: z.union([z.string(), z.date()]).optional(),
  lastSeen: z.union([z.string(), z.date()]).optional(),
  // Add role/status information
  admin: z.boolean().optional(),
  isMe: z.boolean().optional(),
  role: z.string().optional(),
  // Organization membership status
  organizationMembership: z
    .object({
      id: z.string(),
      owner: z.boolean().optional(),
      member: z.boolean().optional(),
      guest: z.boolean().optional(),
    })
    .optional(),
});

/**
 * Member search results schema
 */
const MemberSearchResultsSchema = z.object({
  results: z.array(ExtendedUserSchema),
});

/**
 * Lists members/users in Linear
 *
 * @param {import('@linear/sdk').LinearClient} client - Linear client from SDK
 * @param {Object} filters - Filter criteria
 * @param {string} [filters.teamId] - Filter by team ID
 * @param {string} [filters.nameFilter] - Filter members by name (partial match)
 * @param {Object} options - Search options
 * @param {number} [options.limit=25] - Maximum number of results to return
 * @param {import('../effects/logging/mod.js').LoggingEffect} [logger] - Optional logger
 * @returns {Promise<import('zod').infer<typeof MemberSearchResultsSchema>>} Search results
 */
async function listMembers(client, filters = {}, { limit = 25 } = {}, logger) {
  try {
    logger?.debug('Building Linear SDK filter parameters', {
      filters,
      limit,
    });

    // Build query parameters similar to how issues() is used in list-tickets.js
    const queryParams = {
      first: limit, // Limit number of results
    };

    // Note: We're using the users() method from the Linear SDK
    // This follows the same pattern as issues() in list-tickets.js
    logger?.debug(
      'Querying users with params:',
      JSON.stringify(queryParams, null, 2)
    );

    // @ts-ignore - The Linear SDK types may not be fully accurate
    const usersResponse = await client.users(queryParams);
    logger?.debug(`Found ${usersResponse.nodes.length} users`);

    // Process users - filter and format them
    let filteredUsers = usersResponse.nodes;

    // Apply name filter if provided
    if (filters.nameFilter) {
      const nameFilterLower = filters.nameFilter.toLowerCase();
      logger?.debug(`Filtering by name: ${filters.nameFilter}`);

      filteredUsers = filteredUsers.filter(user => {
        const name = user.name.toLowerCase();
        const displayName = user.displayName?.toLowerCase() || '';

        return (
          name.includes(nameFilterLower) ||
          displayName.includes(nameFilterLower)
        );
      });

      logger?.debug(
        `After name filtering, found ${filteredUsers.length} users`
      );
    }

    // Apply team filter if provided
    // Note: This requires looking up team membership which we'll implement if the API supports it
    if (filters.teamId) {
      logger?.debug(`Filtering by team ID: ${filters.teamId}`);

      // This would require team membership lookup
      // For now, we'll just log that it's not implemented
      logger?.warn('Team filtering not implemented yet');
    }

    // Limit the results
    filteredUsers = filteredUsers.slice(0, limit);
    logger?.debug(`After limiting, returning ${filteredUsers.length} users`);

    // Convert to our schema format
    const members = await Promise.all(
      filteredUsers.map(async user => {
        // Get organization membership details if available
        let organizationMembership = undefined;
        try {
          // @ts-ignore - The Linear SDK types may not include this property
          if (user.organizationMembership) {
            // If it's a promise, await it
            // @ts-ignore - Handle potential promise
            const membership =
              // @ts-ignore - Check for promise
              typeof user.organizationMembership.then === 'function'
                ? // @ts-ignore - Await the promise
                  await user.organizationMembership
                : // @ts-ignore - Or use directly
                  user.organizationMembership;

            if (membership) {
              organizationMembership = {
                id: membership.id,
                owner: membership.owner || false,
                member: membership.member || false,
                guest: membership.guest || false,
              };
              logger?.debug(`Found membership details for user: ${user.name}`);
            }
          }
        } catch (membershipError) {
          logger?.warn(
            `Error fetching membership data: ${membershipError.message}`
          );
        }

        // Format timestamps to be consistent
        const formatDate = timestamp => {
          if (!timestamp) return undefined;
          return new Date(timestamp).toISOString();
        };

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          displayName: user.displayName || user.name,
          active: user.active === false ? false : true, // Default to active if not explicitly false
          // Add timestamps
          createdAt: formatDate(user.createdAt),
          updatedAt: formatDate(user.updatedAt),
          lastSeen: formatDate(user.lastSeen),
          // Add role information
          // @ts-ignore - The Linear SDK types may not include these properties
          admin: user.admin || false,
          // @ts-ignore - The Linear SDK types may not include these properties
          isMe: user.isMe || false,
          // @ts-ignore - The Linear SDK types may not include these properties
          role: user.role || 'unknown',
          // Add organization membership details
          organizationMembership,
        };
      })
    );

    logger?.debug(`Successfully processed ${members.length} users`);

    return MemberSearchResultsSchema.parse({ results: members });
  } catch (error) {
    // Enhanced error logging
    logger?.error(`Error listing Linear members: ${error.message}`, {
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
 * Handler for ListMembers tool
 * @type {import('./types/mod.js').ToolHandler<ListMembersContext, typeof ListMembersInputSchema>}
 */
const handler = async (ctx, { teamId, nameFilter, limit, debug }) => {
  const logger = ctx.effects.logger;

  try {
    // Log details about config and parameters
    logger.debug('List members called with parameters:', {
      teamId,
      nameFilter,
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

    // List members using the Linear SDK client with filters
    logger.debug('Executing Linear API list with filters');
    const results = await listMembers(
      linearClient,
      {
        teamId,
        nameFilter,
      },
      {
        limit,
      },
      logger
    );

    // Log the results count
    logger.info(`Found ${results.results.length} members matching criteria`);

    // Format the output
    let responseText = '';

    if (results.results.length === 0) {
      responseText = 'No members found matching your criteria.';
    } else {
      responseText = 'Members found:\n\n';

      results.results.forEach((member, index) => {
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

        // Determine member type
        let memberType = 'Regular user';
        if (member.organizationMembership) {
          if (member.organizationMembership.owner) memberType = 'Owner';
          else if (member.organizationMembership.guest) memberType = 'Guest';
          else if (member.organizationMembership.member) memberType = 'Member';
        }
        if (member.admin) memberType += ' (Admin)';
        if (member.isMe) memberType += ' (You)';

        responseText += `${index + 1}. ${member.displayName}\n`;
        responseText += `   ID: ${member.id}\n`;
        responseText += `   Username: ${member.name}\n`;

        if (member.email) {
          responseText += `   Email: ${member.email}\n`;
        }

        responseText += `   Status: ${member.active ? 'Active' : 'Inactive'}\n`;
        responseText += `   Role: ${
          member.role !== 'unknown' ? member.role : memberType
        }\n`;

        // Add timestamps
        responseText += `   Created: ${formatDisplayDate(member.createdAt)}\n`;
        if (member.updatedAt) {
          responseText += `   Updated: ${formatDisplayDate(
            member.updatedAt
          )}\n`;
        }
        if (member.lastSeen) {
          responseText += `   Last seen: ${formatDisplayDate(
            member.lastSeen
          )}\n`;
        }

        responseText += '\n';
      });
    }

    logger.debug('Returning formatted list results');
    return {
      content: [{ type: 'text', text: responseText }],
    };
  } catch (error) {
    logger.error(`Error listing members: ${error.message}`);
    logger.error(error.stack);

    // Create a user-friendly error message with troubleshooting guidance
    let errorMessage = `Error listing members: ${error.message}`;

    // Add detailed diagnostic information if in debug mode
    if (debug) {
      errorMessage += '\n\n=== DETAILED DEBUG INFORMATION ===';

      // Add filter parameters that were used
      errorMessage += `\nFilter parameters:
- teamId: ${teamId || '<not specified>'}
- nameFilter: ${nameFilter || '<not specified>'}
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
 * ListMembers tool factory
 */
export const ListMembers = create_tool({
  name: 'list_members',
  description:
    'List Linear team members with optional filtering by name. This tool is useful for finding member details including usernames, display names, and emails.',
  inputSchema: ListMembersInputSchema,
  handler,
});

// Export for testing
export { listMembers };
