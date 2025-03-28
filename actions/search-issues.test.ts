/**
 * Tests for the search issues action
 */
import { assertEquals } from "https://deno.land/std/assert/mod.ts";
import { SearchIssuesAction } from "./search-issues.ts";
import { createInMemoryHTTP } from "../effects/http/in-memory.ts";
import { createTestConfig } from "../utils/config.ts";
import { LINEAR_API_URL } from "../utils/linear-graphql.ts";

// Test data
const TEST_CONFIG = createTestConfig();
const _MOCK_ISSUES = [
  {
    id: "TEST-123",
    title: "Test Issue",
    description: "This is a test issue",
    status: "In Progress",
  },
];

// Mock response
const MOCK_RESPONSE = {
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
        },
      ],
    },
  },
};

Deno.test("SearchIssuesAction - returns empty results for empty query", async () => {
  // Setup mock HTTP effect
  const http = createInMemoryHTTP();

  // Create action
  const searchIssues = SearchIssuesAction({ http });

  // Test with empty query
  const result = await searchIssues.execute({ query: "" }, TEST_CONFIG);

  // Verify empty results
  assertEquals(result.results.length, 0);
});

Deno.test("SearchIssuesAction - handles successful search", async () => {
  // Setup mock HTTP effect
  const http = createInMemoryHTTP({
    responses: new Map([
      [LINEAR_API_URL, () => {
        return Promise.resolve(
          new Response(JSON.stringify(MOCK_RESPONSE), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }],
    ]),
  });

  // Create action
  const searchIssues = SearchIssuesAction({ http });

  // Test with query
  const result = await searchIssues.execute({ query: "test" }, TEST_CONFIG);

  // Verify results
  assertEquals(result.results.length, 1);
  assertEquals(result.results[0].id, "TEST-123");
  assertEquals(result.results[0].title, "Test Issue");
  assertEquals(result.results[0].description, "This is a test issue");
  assertEquals(result.results[0].status, "In Progress");
});

Deno.test("SearchIssuesAction - uses custom limit", async () => {
  // Track query parameters
  let requestBody = "";

  // Setup mock HTTP effect
  const http = createInMemoryHTTP({
    responses: new Map([
      [LINEAR_API_URL, (_url, options) => {
        if (options?.body) {
          requestBody = options.body as string;
        }

        return Promise.resolve(
          new Response(JSON.stringify(MOCK_RESPONSE), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }],
    ]),
  });

  // Create action
  const searchIssues = SearchIssuesAction({ http });

  // Test with custom limit
  await searchIssues.execute({ query: "test", limit: 10 }, TEST_CONFIG);

  // Verify limit is passed through
  const parsedBody = JSON.parse(requestBody);
  assertEquals(parsedBody.variables.first, 10);
});
