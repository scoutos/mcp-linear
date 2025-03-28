#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

// Determine binary name based on platform
const isWindows = os.platform() === "win32";
const binaryName = isWindows ? "mcp-linear.exe" : "mcp-linear";
const binaryPath = path.join(__dirname, "..", "dist", binaryName);

// Check if binary exists
if (!fs.existsSync(binaryPath)) {
  console.log(
    "Binary not found. You may need to compile it for your platform.",
  );
  console.log("Please see README.md for instructions on building from source.");

  // If Deno is available, we could compile it automatically
  try {
    const hasDeno = execSync("deno --version").toString().includes("deno");

    if (hasDeno) {
      console.log(
        "Deno detected. Attempting to compile binary automatically...",
      );

      // Create dist directory if it doesn't exist
      if (!fs.existsSync(path.join(__dirname, "..", "dist"))) {
        fs.mkdirSync(path.join(__dirname, "..", "dist"));
      }

      // Compile the binary
      execSync(
        "deno compile --allow-net --allow-env --output dist/mcp-linear main.ts",
        {
          cwd: path.join(__dirname, ".."),
          stdio: "inherit",
        },
      );

      console.log("Binary compiled successfully.");
    }
  } catch (error) {
    console.log("Could not auto-compile binary. Please compile manually.");
  }
} else {
  console.log(`Binary found at ${binaryPath}`);

  // Make the binary executable on Unix-like systems
  if (!isWindows) {
    try {
      fs.chmodSync(binaryPath, "755");
    } catch (error) {
      console.warn(
        "Warning: Could not make binary executable. You may need to run chmod +x manually.",
      );
    }
  }
}

console.log("Installation completed.");
