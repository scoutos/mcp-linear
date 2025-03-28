/**
 * Linear GraphQL utilities
 */
import { Issue, SearchResults } from "../types/linear";
import { Config } from "../types/config";
import { HttpEffect } from "../effects/http";

/**
 * Linear GraphQL API URL
 */
export const LINEAR_API_URL = "https://api.linear.app/graphql";

/**
 * GraphQL query for searching issues
 */
export const SEARCH_ISSUES_QUERY = `
query SearchIssues($query: String!, $first: Int!) {
  issues(filter: { search: $query }, first: $first) {
    nodes {
      id
      title
      description
      state {
        name
      }
      assignee {
        name
      }
      team {
        name
        key
      }
      updatedAt
    }
  }
}`;

/**
 * GraphQL query variables for search
 */
export type SearchIssuesVariables = {
  query: string;
  first: number;
};

/**
 * GraphQL response type for search issues query
 */
export type SearchIssuesResponse = {
  data?: {
    issues: {
      nodes: Array<{
        id: string;
        title?: string;
        description?: string;
        state?: {
          name: string;
        };
        assignee?: {
          name: string;
        };
        team?: {
          name: string;
          key: string;
        };
        updatedAt?: string;
      }>;
    };
  };
  errors?: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
    extensions?: Record<string, unknown>;
  }>;
};

/**
 * Error class for GraphQL errors
 */
export class GraphQLError extends Error {
  errors: Array<{
    message: string;
    locations?: Array<{
      line: number;
      column: number;
    }>;
    path?: string[];
    extensions?: Record<string, unknown>;
  }>;

  constructor(
    message: string,
    errors: SearchIssuesResponse["errors"] = [],
  ) {
    super(message);
    this.name = "GraphQLError";
    this.errors = errors;
  }
}

/**
 * Execute a GraphQL query against the Linear API
 *
 * @param http HTTP effect to use for the request
 * @param query GraphQL query string
 * @param variables Query variables
 * @param config Application configuration with Linear API key
 * @returns GraphQL response data
 * @throws GraphQLError if the request fails or returns errors
 */
export async function executeGraphQL<T, V>(
  http: HttpEffect,
  query: string,
  variables: V,
  config: Config,
): Promise<T> {
  try {
    const response = await http.fetch(LINEAR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.linearApiKey}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (response.status !== 200) {
      throw new Error(
        `HTTP error ${response.status}: ${response.statusText}`,
      );
    }

    const result = await response.json() as {
      data?: T;
      errors?: Array<{
        message: string;
        locations?: Array<{
          line: number;
          column: number;
        }>;
        path?: string[];
        extensions?: Record<string, unknown>;
      }>;
    };

    if (result.errors && result.errors.length > 0) {
      throw new GraphQLError(
        `GraphQL returned errors: ${result.errors[0].message}`,
        result.errors,
      );
    }

    if (!result.data) {
      throw new Error("GraphQL response missing data");
    }

    return result.data;
  } catch (error) {
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new Error(
      `Failed to execute GraphQL query: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/**
 * Search for Linear issues
 *
 * @param http HTTP effect to use for the request
 * @param query Search query string
 * @param config Application configuration with Linear API key
 * @param limit Maximum number of results to return (default: 25)
 * @returns Search results with matching issues
 */
export async function searchIssues(
  http: HttpEffect,
  query: string,
  config: Config,
  limit = 25,
): Promise<SearchResults> {
  try {
    const variables: SearchIssuesVariables = {
      query,
      first: limit,
    };

    const data = await executeGraphQL<
      SearchIssuesResponse["data"],
      SearchIssuesVariables
    >(http, SEARCH_ISSUES_QUERY, variables, config);

    if (!data?.issues?.nodes) {
      return { results: [] };
    }

    // Transform the GraphQL response to our domain type
    const issues: Issue[] = data.issues.nodes.map((node) => ({
      id: node.id,
      title: node.title,
      description: node.description,
      status: node.state?.name,
      assignee: node.assignee
        ? {
          id: "", // Linear API doesn't return ID in this query
          name: node.assignee.name,
        }
        : undefined,
      team: node.team
        ? {
          id: "", // Linear API doesn't return ID in this query
          name: node.team.name,
          key: node.team.key,
        }
        : undefined,
      updatedAt: node.updatedAt,
    }));

    return { results: issues };
  } catch (error) {
    // Wrap all errors
    if (error instanceof GraphQLError) {
      throw error;
    }
    throw new Error(
      `Failed to search issues: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
