// Script to fix syntax errors

// Fix file: mcp/handlers.test.ts
const handlersTestPath = "./mcp/handlers.test.ts";
let content = await Deno.readTextFile(handlersTestPath);
content = content.replace(/\} as SearchResults;/g, "} as SearchResults");
await Deno.writeTextFile(handlersTestPath, content);
console.log("Fixed: mcp/handlers.test.ts");

// Fix file: utils/linear-graphql.test.ts
const linearGraphqlTestPath = "./utils/linear-graphql.test.ts";
content = await Deno.readTextFile(linearGraphqlTestPath);
content = content.replace(/\}\);(\s+)\}\]/g, "})$1}]");
await Deno.writeTextFile(linearGraphqlTestPath, content);
console.log("Fixed: utils/linear-graphql.test.ts");

// Fix file: actions/search-issues.test.ts
const searchIssuesTestPath = "./actions/search-issues.test.ts";
content = await Deno.readTextFile(searchIssuesTestPath);
content = content.replace(/\}\);(\s+)\}\]/g, "})$1}]");
await Deno.writeTextFile(searchIssuesTestPath, content);
console.log("Fixed: actions/search-issues.test.ts");

console.log("All syntax errors fixed!");
