#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const readline = require("readline");

// Parse command line arguments
const args = process.argv.slice(2);
let apiKey = null;
let port = 8000;

// Extract API key and port from arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--key" && i + 1 < args.length) {
    apiKey = args[i + 1];
    i++; // Skip the next argument
  } else if (args[i] === "--port" && i + 1 < args.length) {
    port = parseInt(args[i + 1], 10);
    i++; // Skip the next argument
  } else if (args[i].startsWith("--key=")) {
    apiKey = args[i].substring("--key=".length);
  } else if (args[i].startsWith("--port=")) {
    port = parseInt(args[i].substring("--port=".length), 10);
  }
}

// If no API key is provided, prompt for it
async function getApiKey() {
  if (apiKey) return apiKey;

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question("Please enter your Linear API key: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Run the binary
async function runBinary() {
  try {
    apiKey = await getApiKey();

    if (!apiKey) {
      console.error("Error: Linear API key is required");
      process.exit(1);
    }

    // Determine binary path
    const isWindows = os.platform() === "win32";
    const binaryName = isWindows ? "mcp-linear.exe" : "mcp-linear";
    const binaryPath = path.join(__dirname, "..", "dist", binaryName);

    // Spawn the binary with environment variables
    const env = {
      ...process.env,
      LINEAR_API_KEY: apiKey,
      PORT: port.toString(),
    };

    console.log(`Starting Linear MCP server on port ${port}...`);

    const proc = spawn(binaryPath, [], {
      env,
      stdio: "inherit",
    });

    // Handle process events
    proc.on("error", (err) => {
      console.error("Error starting server:", err.message);
      process.exit(1);
    });

    proc.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Server exited with code ${code}`);
        process.exit(code);
      }
    });

    // Handle termination signals
    ["SIGINT", "SIGTERM"].forEach((signal) => {
      process.on(signal, () => {
        console.log(`\nReceived ${signal}, shutting down...`);
        proc.kill(signal);
      });
    });
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

runBinary();
