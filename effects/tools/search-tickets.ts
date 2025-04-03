/**
 * Linear ticket search tool
 */
import { z } from "zod";
import { create_tool } from "./utils/mod.ts";
import type { ToolHandler } from "./types/mod.ts";
import { HTTPEffect } from "../http/mod.ts";
import { Config } from "../config/mod.ts";
import type { SearchResults } from "../linear/types.ts";
import { searchIssues as searchIssuesGraphQL } from "../linear/graphql.ts";

/**
 * Context for SearchTickets tool
 */
type SearchTicketsContext = {
  config: Config;
  effects: {
    http: HTTPEffect;
  };
};

/**
 * Input schema for SearchTickets tool
 */
const SearchTicketsInputSchema = z.object({
  assignedToMe: z.boolean().default(false),
  status: z.string().optional(),
  sortBy: z.enum(["priority", "createdAt", "updatedAt"]).default("priority"),
  sortDirection: z.enum(["ASC", "DESC"]).default("ASC"),
  limit: z.number().min(1).max(100).default(25),
});

/**
 * Handler for SearchTickets tool
 */
const handler: ToolHandler<
  SearchTicketsContext,
  typeof SearchTicketsInputSchema
> = async (ctx, { assignedToMe, status, sortBy, sortDirection, limit }) => {
  try {
    // Build the query based on input parameters
    let query = "";

    if (assignedToMe) {
      query += "assignee:me ";
    }

    if (status) {
      query += `state:"${status}" `;
    }

    // For priority, we may want to reverse the direction since in Linear
    // lower priority number = higher priority
    let direction = sortDirection as "ASC" | "DESC";
    if (sortBy === "priority") {
      // Flip direction for priority since lower number = higher priority in Linear
      direction = direction === "ASC" ? "DESC" : "ASC";
    }

    // Search for issues using the GraphQL utility with server-side sorting
    const results = await searchIssuesGraphQL(
      ctx.effects.http,
      query.trim(),
      ctx.config,
      limit,
      sortBy as "priority" | "createdAt" | "updatedAt",
      direction,
    );

    // Format the output
    let responseText = "";

    if (results.results.length === 0) {
      responseText = "No tickets found matching your criteria.";
    } else {
      responseText = "Tickets found:\n\n";

      results.results.forEach((issue, index) => {
        const priorityMap: Record<number, string> = {
          0: "No priority",
          1: "Urgent",
          2: "High",
          3: "Medium",
          4: "Low",
        };

        const priority = issue.priority ?? 0;

        responseText += `${index + 1}. ${issue.title || "Untitled"}\n`;
        responseText += `   ID: ${issue.id}\n`;
        responseText += `   Status: ${issue.status || "Unknown"}\n`;
        responseText += `   Priority: ${priorityMap[priority] || "Unknown"}\n`;

        if (issue.assignee) {
          responseText += `   Assignee: ${issue.assignee.name}\n`;
        }

        if (issue.team) {
          responseText += `   Team: ${issue.team.name} (${issue.team.key})\n`;
        }

        responseText += "\n";
      });
    }

    return {
      content: [{ type: "text", text: responseText }],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error searching tickets: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
};

/**
 * SearchTickets tool factory
 */
export const SearchTickets = create_tool({
  name: "search_tickets",
  description: "Search for Linear tickets with filtering and sorting options.",
  inputSchema: SearchTicketsInputSchema,
  handler,
});
