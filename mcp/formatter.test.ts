import { assertEquals } from "jsr:@std/assert";
import { formatMCPResponse, createErrorResponse } from "./formatter.ts";
import { MCPResponse } from "../types/mcp.ts";

Deno.test("formatMCPResponse - formats successful response with 200 status", async () => {
  const mcpResponse: MCPResponse = {
    id: "request-1",
    data: { success: true, data: "test" },
  };
  
  const response = formatMCPResponse(mcpResponse);
  
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Content-Type"), "application/json");
  
  const body = await response.json();
  assertEquals(body.success, true);
  assertEquals(body.data, "test");
});

Deno.test("formatMCPResponse - formats error response with 400 status", async () => {
  const mcpResponse: MCPResponse = {
    id: "request-1",
    data: { message: "Something went wrong" },
    error: {
      message: "Error occurred",
      code: "TEST_ERROR",
    },
  };
  
  const response = formatMCPResponse(mcpResponse);
  
  assertEquals(response.status, 400);
  assertEquals(response.headers.get("Content-Type"), "application/json");
  
  const body = await response.json();
  assertEquals(body.message, "Something went wrong");
});

Deno.test("createErrorResponse - creates error response with specified status", async () => {
  const response = createErrorResponse("Test error", "TEST_ERROR", 404);
  
  assertEquals(response.status, 404);
  assertEquals(response.headers.get("Content-Type"), "application/json");
  
  const body = await response.json();
  assertEquals(body.error.message, "Test error");
  assertEquals(body.error.code, "TEST_ERROR");
});

Deno.test("createErrorResponse - creates error response with default status and code", async () => {
  const response = createErrorResponse("Test error");
  
  assertEquals(response.status, 500);
  assertEquals(response.headers.get("Content-Type"), "application/json");
  
  const body = await response.json();
  assertEquals(body.error.message, "Test error");
  assertEquals(body.error.code, "INTERNAL_ERROR");
});