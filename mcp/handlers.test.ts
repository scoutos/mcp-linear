import { assertEquals, assertExists } from "jsr:@std/assert";
import { createMCPHandlers, HandlerDependencies } from "./handlers.ts";
import { createTestConfig } from "../utils/config.ts";
import { SearchResults } from "../types/linear.ts";

Deno.test("createMCPHandlers - returns all handlers", () => {
  const handlers = createMCPHandlers();

  assertExists(handlers.searchIssues);
  assertExists(handlers.getIssue);
  assertExists(handlers.updateIssue);
  assertExists(handlers.addComment);
});

Deno.test("searchIssues - returns mock search results when no action provided", async () => {
  const handlers = createMCPHandlers({});

  const response = await handlers.searchIssues({
    id: "request-1",
    params: { query: "test" },
  });

  assertEquals(response.id, "request-1");
  assertExists(response.data);
  const { results } = response.data as { results: unknown[] };
  assertEquals(Array.isArray(results), true);
  assertEquals(results.length, 1);
  assertEquals((results[0] as Record<string, unknown>).id, "TEST-123");
});

Deno.test("searchIssues - uses real action when provided", async () => {
  // Create a mock search action
  const mockSearchAction = {
    execute: () => {
      return Promise.resolve({
        results: [
          {
            id: "REAL-123",
            title: "Real Issue",
            description: "This is a real issue",
            status: "In Progress",
          },
        ],
      } as SearchResults);
    },
  };

  // Create dependencies with mock action
  const deps: HandlerDependencies = {
    actions: {
      searchIssues: mockSearchAction,
    },
    config: createTestConfig(),
  };

  const handlers = createMCPHandlers(deps);

  const response = await handlers.searchIssues({
    id: "request-1",
    params: { query: "test" },
  });

  assertEquals(response.id, "request-1");
  assertExists(response.data);
  const { results } = response.data as { results: unknown[] };
  assertEquals(Array.isArray(results), true);
  assertEquals(results.length, 1);
  assertEquals((results[0] as Record<string, unknown>).id, "REAL-123");
  assertEquals((results[0] as Record<string, unknown>).title, "Real Issue");
});

Deno.test("searchIssues - handles errors from action", async () => {
  // Create a mock search action that throws an error
  const mockSearchAction = {
    execute: () => {
      throw new Error("Test error");
    },
  };

  // Create dependencies with mock action
  const deps: HandlerDependencies = {
    actions: {
      searchIssues: mockSearchAction,
    },
    config: createTestConfig(),
  };

  const handlers = createMCPHandlers(deps);

  const response = await handlers.searchIssues({
    id: "request-1",
    params: { query: "test" },
  });

  assertEquals(response.id, "request-1");
  assertExists(response.data);
  const { results } = response.data as { results: unknown[] };
  assertEquals(Array.isArray(results), true);
  assertEquals(results.length, 0);
  assertEquals(response.error?.message, "Test error");
  assertEquals(response.error?.code, "SEARCH_ERROR");
});

Deno.test("getIssue - returns issue details", async () => {
  const handlers = createMCPHandlers({});

  const response = await handlers.getIssue({
    id: "request-1",
    params: { id: "TEST-123" },
  });

  assertEquals(response.id, "request-1");
  assertExists(response.data);
  const { issue } = response.data as { issue: { id: string } };
  assertEquals(issue.id, "TEST-123");
});

Deno.test("updateIssue - updates issue and returns success", async () => {
  const handlers = createMCPHandlers({});

  const response = await handlers.updateIssue({
    id: "request-1",
    params: {
      id: "TEST-123",
      title: "Updated Title",
      description: "Updated description",
    },
  });

  assertEquals(response.id, "request-1");
  assertExists(response.data);
  const data = response.data as {
    success: boolean;
    issue: { id: string; title: string };
  };
  assertEquals(data.success, true);
  assertEquals(data.issue.id, "TEST-123");
  assertEquals(data.issue.title, "Updated Title");
});

Deno.test("addComment - adds comment and returns success", async () => {
  const handlers = createMCPHandlers({});

  const response = await handlers.addComment({
    id: "request-1",
    params: {
      id: "TEST-123",
      body: "This is a test comment",
    },
  });

  assertEquals(response.id, "request-1");
  assertExists(response.data);
  const data = response.data as { success: boolean; comment: { body: string } };
  assertEquals(data.success, true);
  assertEquals(data.comment.body, "This is a test comment");
});
