// Script to fix TypeScript type issues in test files

// Fix file: actions/search-issues.test.ts
const searchIssuesTestPath = "./actions/search-issues.test.ts";
let content = await Deno.readTextFile(searchIssuesTestPath);

// Fix Response to Promise<Response> by wrapping in Promise.resolve
content = content.replace(
  /return new Response\(/g,
  "return Promise.resolve(new Response(",
);
content = content.replace(/\)\);(\s+)\}\]/g, "))$1}]");

await Deno.writeTextFile(searchIssuesTestPath, content);
console.log("Fixed: actions/search-issues.test.ts");

// Fix file: mcp/handlers.test.ts
const handlersTestPath = "./mcp/handlers.test.ts";
content = await Deno.readTextFile(handlersTestPath);

// Fix the mock search action to return a Promise
content = content.replace(
  /execute: \(\) => \{/g,
  "execute: async () => {",
);
content = content.replace(
  /return \{/g,
  "return await Promise.resolve({",
);

await Deno.writeTextFile(handlersTestPath, content);
console.log("Fixed: mcp/handlers.test.ts");

// Fix file: utils/linear-graphql.test.ts
const linearGraphqlTestPath = "./utils/linear-graphql.test.ts";
content = await Deno.readTextFile(linearGraphqlTestPath);

// Fix Response to Promise<Response> by wrapping in Promise.resolve
content = content.replace(
  /return new Response\(/g,
  "return Promise.resolve(new Response(",
);
content = content.replace(/\)\);(\s+)\}\]/g, "))$1}]");

await Deno.writeTextFile(linearGraphqlTestPath, content);
console.log("Fixed: utils/linear-graphql.test.ts");

console.log("All type issues fixed!");
