import net from "node:net";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const CHILDREN = new Set();
let shuttingDown = false;

function prefixFor(name, colorCode) {
  const reset = "\x1b[0m";
  const color = `\x1b[${colorCode}m`;
  return `${color}[${name}]${reset}`;
}

function wireOutput(child, name, colorCode) {
  const prefix = `${prefixFor(name, colorCode)} `;
  const writePrefixed = (stream, chunk) => {
    const text = chunk.toString();
    const lines = text.split(/\r?\n/);
    const hasTrailingNewline = /\r?\n$/.test(text);

    for (let i = 0; i < lines.length; i += 1) {
      if (i === lines.length - 1 && lines[i] === "" && hasTrailingNewline) {
        continue;
      }
      stream.write(prefix + lines[i]);
      if (i < lines.length - 1 || hasTrailingNewline) {
        stream.write("\n");
      }
    }
  };

  child.stdout?.on("data", (chunk) => {
    writePrefixed(process.stdout, chunk);
  });
  child.stderr?.on("data", (chunk) => {
    writePrefixed(process.stderr, chunk);
  });
}

function spawnManaged(name, cwd, command, args, colorCode) {
  const child = spawn(command, args, {
    cwd,
    shell: true,
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"]
  });

  CHILDREN.add(child);
  wireOutput(child, name, colorCode);
  child.on("close", () => {
    CHILDREN.delete(child);
  });

  return child;
}

function runStep(name, cwd, command, args, colorCode) {
  return new Promise((resolve, reject) => {
    const child = spawnManaged(name, cwd, command, args, colorCode);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${name} failed with exit code ${code ?? "unknown"}`));
      }
    });
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);

    const done = (result) => {
      socket.destroy();
      resolve(result);
    };

    socket.once("connect", () => done(true));
    socket.once("error", () => done(false));
    socket.once("timeout", () => done(false));
    socket.connect(port, host);
  });
}

async function waitForPort(host, port, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    // eslint-disable-next-line no-await-in-loop
    if (await checkPort(host, port)) return;
    // eslint-disable-next-line no-await-in-loop
    await wait(1000);
  }
  throw new Error(`Timed out waiting for ${host}:${port}`);
}

function openBrowser(url) {
  if (process.env.TUNICHAIN_OPEN_BROWSER === "false") {
    console.log(`Browser auto-open disabled (TUNICHAIN_OPEN_BROWSER=false). Frontend: ${url}`);
    return;
  }

  let command;
  let args;

  if (process.platform === "win32") {
    command = "cmd";
    args = ["/c", "start", "", url];
  } else if (process.platform === "darwin") {
    command = "open";
    args = [url];
  } else {
    command = "xdg-open";
    args = [url];
  }

  const opener = spawn(command, args, {
    detached: true,
    stdio: "ignore"
  });

  opener.on("error", () => {
    console.warn(`Could not open browser automatically. Open this URL manually: ${url}`);
  });

  opener.unref();
}

function terminateChildren() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of CHILDREN) {
    child.kill("SIGINT");
  }
}

process.on("SIGINT", () => {
  console.log("\nShutting down Tunichain dev stack...");
  terminateChildren();
  setTimeout(() => process.exit(0), 300);
});

process.on("SIGTERM", () => {
  terminateChildren();
  setTimeout(() => process.exit(0), 300);
});

async function main() {
  const hardhatDir = path.join(rootDir, "tunichain-hardhat");
  const backendDir = path.join(rootDir, "tunichain-backend");
  const frontendDir = path.join(rootDir, "tunichain-frontend");

  console.log("Starting Hardhat local node...");
  const hardhatNode = spawnManaged("CHAIN", hardhatDir, "npx", ["hardhat", "node"], "33");

  hardhatNode.on("close", (code) => {
    if (!shuttingDown) {
      console.error(`Hardhat node exited unexpectedly (code ${code ?? "unknown"}).`);
      terminateChildren();
      process.exit(1);
    }
  });

  console.log("Waiting for Hardhat RPC (127.0.0.1:8545)...");
  await waitForPort("127.0.0.1", 8545);

  console.log("Deploying contracts...");
  await runStep("DEPLOY", hardhatDir, "npx", ["hardhat", "run", "scripts/deploy-tunichain.js", "--network", "localhost"], "36");

  console.log("Resetting database...");
  await runStep("DB", backendDir, "npm", ["run", "reset:db"], "35");

  console.log("Starting backend and frontend...");
  const backend = spawnManaged("BACKEND", backendDir, "npm", ["start"], "32");
  const frontend = spawnManaged("FRONTEND", frontendDir, "npm", ["run", "dev"], "34");

  const frontendUrl = process.env.TUNICHAIN_FRONTEND_URL || "http://localhost:5173";

  try {
    const parsed = new URL(frontendUrl);
    const port = parsed.port ? Number(parsed.port) : parsed.protocol === "https:" ? 443 : 80;
    await waitForPort(parsed.hostname, port, 120_000);
    openBrowser(frontendUrl);
  } catch {
    console.warn(`Could not confirm frontend readiness for ${frontendUrl}.`);
    console.warn(`Open it manually if needed: ${frontendUrl}`);
  }

  backend.on("close", (code) => {
    if (!shuttingDown) {
      console.error(`Backend exited unexpectedly (code ${code ?? "unknown"}).`);
      terminateChildren();
      process.exit(1);
    }
  });

  frontend.on("close", (code) => {
    if (!shuttingDown) {
      console.error(`Frontend exited unexpectedly (code ${code ?? "unknown"}).`);
      terminateChildren();
      process.exit(1);
    }
  });
}

main().catch((error) => {
  console.error(error.message);
  terminateChildren();
  process.exit(1);
});