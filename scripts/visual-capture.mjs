import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const gameRoot = resolve(scriptDir, "..");
const outputDir = resolve(gameRoot, "visual-report/current");
const baseURL = process.env.MS_VISUAL_BASE_URL ?? "http://127.0.0.1:5180";
const viewport = { width: 426, height: 922 };

const screens = [
  { name: "round", path: "/?screen=round", fileName: "round.png" },
  { name: "feedback", path: "/?screen=feedback", fileName: "feedback.png" },
  { name: "result", path: "/?screen=result", fileName: "result.png" }
];

async function isServerReady() {
  try {
    const response = await fetch(baseURL, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 15_000) {
    if (await isServerReady()) {
      return;
    }
    await new Promise((resolveTimeout) => setTimeout(resolveTimeout, 250));
  }

  throw new Error(`Timed out waiting for dev server at ${baseURL}`);
}

async function ensureServer() {
  if (await isServerReady()) {
    return undefined;
  }

  const server = spawn("pnpm", ["exec", "vite", "--host", "127.0.0.1", "--port", "5180"], {
    cwd: gameRoot,
    env: process.env,
    stdio: "ignore"
  });

  await waitForServer();
  return server;
}

async function captureScreens() {
  await mkdir(outputDir, { recursive: true });

  const server = await ensureServer();
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });

    for (const screen of screens) {
      const url = new URL(screen.path, baseURL).toString();
      const outputPath = resolve(outputDir, screen.fileName);

      await page.goto(url, { waitUntil: "load" });
      await page.screenshot({ path: outputPath, fullPage: false });
      console.log(`Captured ${screen.name}: ${outputPath}`);
    }
  } finally {
    await browser.close();

    if (server) {
      server.kill();
    }
  }
}

captureScreens().catch((error) => {
  console.error(error);
  process.exit(1);
});
