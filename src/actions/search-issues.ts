/**
 * Search issues action
 */
import { HttpEffect } from "../effects/http";
import { Config } from "../types/config";
import { SearchResults } from "../types/linear";
import { searchIssues as searchIssuesGraphQL } from "../utils/linear-graphql";

/**
 * Dependencies for the search issues action
 */
export type SearchIssuesEffects = {
  http: HttpEffect;
};

/**
 * Parameters for searching issues
 */
export type SearchIssuesParams = {
  query: string;
  limit?: number;
};

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
    const { query, limit = 25 } = params;

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
    );
  },
});
