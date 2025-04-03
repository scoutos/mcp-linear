import { z } from "zod";
import { HttpEffect } from "../effects/http";
import { Config } from "../types/config";
import { SearchResults } from "../types/linear";
import { searchIssues as searchIssuesGraphQL } from "../utils/linear-graphql";
import { create_action } from "./utils/create-action";

/**
 * Context for the SearchIssues action
 */
export type SearchIssuesContext = {
  config: Config;
  effects: {
    http: HttpEffect;
  };
};

/**
 * Arguments for the SearchIssues action
 */
export const SearchIssuesArgs = z.object({
  query: z.string().nonempty(),
  limit: z.number().min(1).max(100).default(25),
});

/**
 * Handler for the SearchIssues action
 */
export const searchIssuesHandler = async (
  ctx: SearchIssuesContext,
  args: z.infer<typeof SearchIssuesArgs>,
): Promise<SearchResults> => {
  const { query, limit } = args;

  // Validate input
  if (!query || query.trim() === "") {
    return { results: [] };
  }

  // Use the GraphQL utility to search issues
  return await searchIssuesGraphQL(ctx.effects.http, query, ctx.config, limit);
};

/**
 * Create a SearchIssues action with the given context
 */
export function createSearchIssuesAction(ctx: SearchIssuesContext) {
  return create_action(
    {
      name: "search_issues",
      description: "Search for Linear issues with the given query",
      inputSchema: SearchIssuesArgs,
    },
    ctx,
    searchIssuesHandler,
  );
}
