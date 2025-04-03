/**
 * Tests for Linear GraphQL utilities
 */
import { assertEquals, assertRejects } from "std/assert/mod.ts";
import {
  executeGraphQL,
  GraphQLError,
  LINEAR_API_URL,
  SEARCH_ISSUES_QUERY,
  searchIssues,
} from "./graphql.ts";
import { createInMemoryHTTP } from "../http/in-memory.ts";
import { createTestConfig } from "../config/mod.ts";

// Test data
const TEST_CONFIG = createTestConfig({ linearApiKey: "test-key" });

// Mock successful search response
const MOCK_SEARCH_RESPONSE = {
  data: {
    issues: {
      nodes: [
        {
          id: "TEST-123",
          title: "Test Issue",
          description: "This is a test issue",
          state: {
            name: "In Progress",
          },
          assignee: {
            name: "Test User",
          },
          team: {
            name: "Test Team",
            key: "TEST",
          },
          updatedAt: "2023-01-01T00:00:00.000Z",
        },
      ],
    },
  },
};

// Mock error response
const MOCK_ERROR_RESPONSE = {
  errors: [
    {
      message: "Test GraphQL error",
      locations: [{ line: 1, column: 1 }],
      path: ["issues"],
      extensions: { code: "TEST_ERROR" },
    },
  ],
};

Deno.test("GraphQLError - creates error with details", () => {
  const error = new GraphQLError("Test message", MOCK_ERROR_RESPONSE.errors);
  assertEquals(error.message, "Test message");
  assertEquals(error.name, "GraphQLError");
  assertEquals(error.errors, MOCK_ERROR_RESPONSE.errors);
});

Deno.test("executeGraphQL - sends correct request", async () => {
  // Setup mock HTTP effect to verify request details
  let requestUrl = "";
  let requestOptions: Record<string, unknown> = {};

  const http = createInMemoryHTTP({
    responses: new Map([
      ["api.linear.app", (url, options) => {
        requestUrl = url;
        requestOptions = options || {};
        return Promise.resolve(
          new Response(JSON.stringify(MOCK_SEARCH_RESPONSE), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }],
    ]),
  });

  // Execute GraphQL query
  const variables = { query: "test", first: 10 };
  await executeGraphQL(http, SEARCH_ISSUES_QUERY, variables, TEST_CONFIG);

  // Verify request details
  assertEquals(requestUrl, LINEAR_API_URL);
  assertEquals(requestOptions.method, "POST");
  assertEquals(
    (requestOptions.headers as Record<string, string>)["Authorization"],
    "Bearer test-key",
  );
  assertEquals(
    (requestOptions.headers as Record<string, string>)["Content-Type"],
    "application/json",
  );

  // Verify body contains query and variables
  const body = JSON.parse(requestOptions.body as string);
  assertEquals(body.query, SEARCH_ISSUES_QUERY);
  assertEquals(body.variables, variables);
});

Deno.test("executeGraphQL - handles GraphQL errors", async () => {
  const http = createInMemoryHTTP({
    responses: new Map([
      ["api.linear.app", () => {
        return Promise.resolve(
          new Response(JSON.stringify(MOCK_ERROR_RESPONSE), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }],
    ]),
  });

  await assertRejects(
    async () => {
      await executeGraphQL(http, SEARCH_ISSUES_QUERY, {
        query: "test",
        first: 10,
      }, TEST_CONFIG);
    },
    GraphQLError,
    "GraphQL returned errors",
  );
});

Deno.test("executeGraphQL - handles HTTP errors", async () => {
  const http = createInMemoryHTTP({
    responses: new Map([
      ["api.linear.app", () => {
        return Promise.resolve(
          new Response(JSON.stringify({ message: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }],
    ]),
  });

  await assertRejects(
    async () => {
      await executeGraphQL(http, SEARCH_ISSUES_QUERY, {
        query: "test",
        first: 10,
      }, TEST_CONFIG);
    },
    Error,
    "HTTP error 401",
  );
});

Deno.test("searchIssues - transforms GraphQL response to domain model", async () => {
  const http = createInMemoryHTTP({
    responses: new Map([
      ["api.linear.app", () => {
        return Promise.resolve(
          new Response(JSON.stringify(MOCK_SEARCH_RESPONSE), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }],
    ]),
  });

  const result = await searchIssues(http, "test query", TEST_CONFIG);

  assertEquals(result.results.length, 1);
  assertEquals(result.results[0].id, "TEST-123");
  assertEquals(result.results[0].title, "Test Issue");
  assertEquals(result.results[0].description, "This is a test issue");
  assertEquals(result.results[0].status, "In Progress");
  assertEquals(result.results[0].assignee?.name, "Test User");
  assertEquals(result.results[0].team?.name, "Test Team");
  assertEquals(result.results[0].team?.key, "TEST");
  assertEquals(result.results[0].updatedAt, "2023-01-01T00:00:00.000Z");
});

Deno.test("searchIssues - handles empty response", async () => {
  const http = createInMemoryHTTP({
    responses: new Map([
      ["api.linear.app", () => {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                issues: {
                  nodes: [],
                },
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      }],
    ]),
  });

  const result = await searchIssues(http, "no results", TEST_CONFIG);
  assertEquals(result.results.length, 0);
});

Deno.test("searchIssues - handles errors", async () => {
  const http = createInMemoryHTTP({
    responses: new Map([
      ["api.linear.app", () => {
        return Promise.resolve(
          new Response(JSON.stringify(MOCK_ERROR_RESPONSE), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }],
    ]),
  });

  await assertRejects(
    async () => {
      await searchIssues(http, "error query", TEST_CONFIG);
    },
    GraphQLError,
  );
});
