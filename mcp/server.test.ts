import { assertEquals, assertExists } from "jsr:@std/assert";
import { createServer } from "./server.ts";

// Helper to make requests to our server handler
async function mockRequest(handler: (request: Request) => Promise<Response>, path: string, method = "GET", body?: unknown): Promise<Response> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  const options: RequestInit = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const request = new Request(`http://localhost:8000${path}`, options);
  return await handler(request);
}

Deno.test("createServer returns a handler function", () => {
  const handler = createServer();
  assertExists(handler);
  assertEquals(typeof handler, "function");
});

Deno.test("MCP Server - GET /mcp responds with 200", async () => {
  // Initialize server
  const handler = createServer();
  
  // Make request to /mcp endpoint
  const response = await mockRequest(handler, "/mcp");
  
  // Verify response
  assertEquals(response.status, 200);
  const body = await response.json();
  assertExists(body);
  assertEquals(body.name, "Linear MCP Server");
  assertEquals(body.version, "0.1.0");
  assertEquals(body.description, "MCP server for Linear issue tracking");
});

Deno.test("MCP Server - GET /mcp/tools returns list of available tools", async () => {
  // Initialize server
  const handler = createServer();
  
  // Make request to /mcp/tools endpoint
  const response = await mockRequest(handler, "/mcp/tools");
  
  // Verify response
  assertEquals(response.status, 200);
  const body = await response.json();
  assertExists(body.tools);
  assertEquals(Array.isArray(body.tools), true);
  assertEquals(body.tools.length, 2);
  assertEquals(body.tools[0].name, "linear-search");
  assertEquals(body.tools[1].name, "linear-issue");
});

Deno.test("MCP Server - POST /mcp/tools/linear-search with query returns search results", async () => {
  // Initialize server
  const handler = createServer();
  
  // Make request to search tools endpoint
  const response = await mockRequest(handler, "/mcp/tools/linear-search", "POST", {
    query: "test issue",
  });
  
  // Verify response - we don't expect real results in the test, but the structure should be correct
  assertEquals(response.status, 200);
  const body = await response.json();
  assertExists(body.results);
  assertEquals(Array.isArray(body.results), true);
  assertEquals(body.results.length, 1);
  assertEquals(body.results[0].id, "TEST-123");
});

Deno.test("MCP Server - GET /mcp/tools/linear-issue/{id} returns issue details", async () => {
  // Initialize server
  const handler = createServer();
  
  // Make request to get issue endpoint
  const response = await mockRequest(handler, "/mcp/tools/linear-issue/TEST-123");
  
  // Verify response structure
  assertEquals(response.status, 200);
  const body = await response.json();
  assertExists(body.issue);
  assertEquals(typeof body.issue, "object");
  assertEquals(body.issue.id, "TEST-123");
  assertEquals(Array.isArray(body.issue.comments), true);
});

Deno.test("MCP Server - PUT /mcp/tools/linear-issue/{id} updates issue", async () => {
  // Initialize server
  const handler = createServer();
  
  const updateData = {
    title: "Updated Title",
    description: "Updated description",
  };
  
  // Make request to update issue endpoint
  const response = await mockRequest(handler, "/mcp/tools/linear-issue/TEST-123", "PUT", updateData);
  
  // Verify response
  assertEquals(response.status, 200);
  const body = await response.json();
  assertExists(body.success);
  assertEquals(body.success, true);
  assertEquals(body.issue.id, "TEST-123");
  assertEquals(body.issue.title, "Updated Title");
  assertEquals(body.issue.description, "Updated description");
});

Deno.test("MCP Server - POST /mcp/tools/linear-issue/{id}/comment adds comment", async () => {
  // Initialize server
  const handler = createServer();
  
  const commentData = {
    body: "This is a test comment",
  };
  
  // Make request to add comment endpoint
  const response = await mockRequest(handler, "/mcp/tools/linear-issue/TEST-123/comment", "POST", commentData);
  
  // Verify response
  assertEquals(response.status, 200);
  const body = await response.json();
  assertExists(body.success);
  assertEquals(body.success, true);
  assertExists(body.comment);
  assertEquals(typeof body.comment, "object");
  assertEquals(body.comment.body, "This is a test comment");
});

Deno.test("MCP Server - Returns 404 for unknown paths", async () => {
  // Initialize server
  const handler = createServer();
  
  // Make request to unknown endpoint
  const response = await mockRequest(handler, "/unknown");
  
  // Verify response
  assertEquals(response.status, 404);
  const body = await response.json();
  assertEquals(body.error, "Not found");
});