/**
 * Search issues action
 */
import { z } from "zod";
import { HTTPEffect } from "../http/mod.ts";
import { Config } from "../config/mod.ts";
import { SearchResults } from "../linear/types.ts";
import { searchIssues as searchIssuesGraphQL } from "../linear/graphql.ts";

/**
 * Dependencies for the search issues action
 */
export type SearchIssuesEffects = {
  http: HTTPEffect;
};

/**
 * Schema for searching issues
 */
export const SearchIssuesSchema = z.object({
  query: z.string().nonempty(),
  limit: z.number().min(1).max(100).default(25),
  sortBy: z.enum(["priority", "createdAt", "updatedAt"]).optional(),
  sortDirection: z.enum(["ASC", "DESC"]).default("ASC"),
});

/**
 * Parameters for searching issues
 */
export type SearchIssuesParams = z.infer<typeof SearchIssuesSchema>;

/**
 * Create a search issues action
 */
export const SearchIssuesAction = (effects: SearchIssuesEffects) => ({
  /**
   * Execute the search issues action
   *
   * @param params Search parameters
   * @param config Application configuration with Linear API key
   * @returns Search results with matching issues
   */
  async execute(
    params: SearchIssuesParams,
    config: Config,
  ): Promise<SearchResults> {
    const { query, limit, sortBy, sortDirection } = params;

    // Validate input
    if (!query || query.trim() === "") {
      return { results: [] };
    }

    // Use the GraphQL utility to search issues
    return await searchIssuesGraphQL(
      effects.http,
      query,
      config,
      limit,
      sortBy,
      sortDirection,
    );
  },
});
