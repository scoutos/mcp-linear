import { assertEquals, assertExists } from "jsr:@std/assert";
import { main } from "./main.ts";
import { createServer } from "./mcp/server.ts";

// Helper to make requests to our server handler
async function mockRequest(
  handler: (request: Request) => Promise<Response>,
  path: string,
  method = "GET",
  body?: unknown,
): Promise<Response> {
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

Deno.test("Smoke test - main function exists", () => {
  // This is just a simple smoke test to verify the test suite is running
  // and that the main function exists and can be imported
  assertEquals(typeof main, "function");
});

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
});

Deno.test("MCP Server - POST /mcp/tools/linear-search with query returns search results", async () => {
  // Initialize server
  const handler = createServer();

  // Make request to search tools endpoint
  const response = await mockRequest(
    handler,
    "/mcp/tools/linear-search",
    "POST",
    {
      query: "test issue",
    },
  );

  // Verify response - we don't expect real results in the test, but the structure should be correct
  assertEquals(response.status, 200);
  const body = await response.json();
  assertExists(body.results);
  assertEquals(Array.isArray(body.results), true);
});

Deno.test("MCP Server - GET /mcp/tools/linear-issue/{id} returns issue details", async () => {
  // Initialize server
  const handler = createServer();

  // Make request to get issue endpoint
  const response = await mockRequest(
    handler,
    "/mcp/tools/linear-issue/TEST-123",
  );

  // Verify response structure
  assertEquals(response.status, 200);
  const body = await response.json();
  assertExists(body.issue);
  assertEquals(typeof body.issue, "object");
});

Deno.test("MCP Server - PUT /mcp/tools/linear-issue/{id} updates issue", async () => {
  // Initialize server
  const handler = createServer();

  // Make request to update issue endpoint
  const response = await mockRequest(
    handler,
    "/mcp/tools/linear-issue/TEST-123",
    "PUT",
    {
      title: "Updated Title",
      description: "Updated description",
    },
  );

  // Verify response
  assertEquals(response.status, 200);
  const body = await response.json();
  assertExists(body.success);
  assertEquals(body.success, true);
});

Deno.test("MCP Server - POST /mcp/tools/linear-issue/{id}/comment adds comment", async () => {
  // Initialize server
  const handler = createServer();

  // Make request to add comment endpoint
  const response = await mockRequest(
    handler,
    "/mcp/tools/linear-issue/TEST-123/comment",
    "POST",
    {
      body: "This is a test comment",
    },
  );

  // Verify response
  assertEquals(response.status, 200);
  const body = await response.json();
  assertExists(body.success);
  assertEquals(body.success, true);
  assertExists(body.comment);
  assertEquals(typeof body.comment, "object");
});
