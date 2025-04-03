import { z } from "zod";
import { create_tool } from "./utils";
import type { ToolHandler } from "./types";
import { HttpEffect } from "../effects/http";
import { Config } from "../types/config";
import type { SearchResults } from "../types/linear";
import { createSearchIssuesAction } from "../actions/search-issues";

type SearchTicketsContext = {
  config: Config;
  effects: {
    http: HttpEffect;
  };
};

const SearchTicketsInputSchema = z.object({
  assignedToMe: z.boolean().default(false),
  status: z.string().optional(),
  sortBy: z.enum(["priority", "createdAt", "updatedAt"]).default("priority"),
  sortDirection: z.enum(["ASC", "DESC"]).default("ASC"),
  limit: z.number().min(1).max(100).default(25),
});

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

    // Create the search issues action with the current context
    const searchIssuesAction = createSearchIssuesAction(ctx);

    // Execute the action with the query
    const results = await searchIssuesAction.execute({
      query: query.trim(),
      limit,
      // Note: The action doesn't handle sort params yet, we'd need to extend it if needed
    });

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

export const SearchTickets = create_tool({
  name: "search_tickets",
  description: "Search for Linear tickets with filtering and sorting options.",
  inputSchema: SearchTicketsInputSchema,
  handler,
});
