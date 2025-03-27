import { assertEquals, assertExists } from "jsr:@std/assert";
import { createMCPHandlers } from "./handlers.ts";

Deno.test("createMCPHandlers - returns all handlers", () => {
  const handlers = createMCPHandlers({});
  
  assertExists(handlers.searchIssues);
  assertExists(handlers.getIssue);
  assertExists(handlers.updateIssue);
  assertExists(handlers.addComment);
});

Deno.test("searchIssues - returns search results", async () => {
  const handlers = createMCPHandlers({});
  
  const response = await handlers.searchIssues({
    id: "request-1",
    params: { query: "test" },
  });
  
  assertEquals(response.id, "request-1");
  assertExists(response.data);
  const { results } = response.data as { results: unknown[] };
  assertEquals(Array.isArray(results), true);
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
  const data = response.data as { success: boolean; issue: { id: string; title: string } };
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