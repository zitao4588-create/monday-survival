import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";

const baseURL = process.env.MS_WECHAT_BASE_URL ?? "http://127.0.0.1:5321";
const base = new URL(baseURL);
const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
const viewports = [
  { width: 375, height: 667, name: "small-iphone" },
  { width: 390, height: 844, name: "modern-iphone" },
  { width: 426, height: 922, name: "target-stage" }
];
const resultPath = [0, 2, 0, 1, 0];

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

  while (Date.now() - startedAt < 20_000) {
    if (await isServerReady()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out waiting for ${baseURL}`);
}

async function ensureServer() {
  if (await isServerReady()) {
    return undefined;
  }

  if (!localHosts.has(base.hostname)) {
    throw new Error(`${baseURL} is not ready and cannot be started as a local Vite server`);
  }

  const port = base.port || "5321";
  const server = spawn("pnpm", ["exec", "vite", "--host", "127.0.0.1", "--port", port], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "ignore"
  });

  await waitForServer();
  return server;
}

async function assertNoHorizontalOverflow(page, viewportName) {
  const metrics = await page.evaluate(() => ({
    bodyScrollWidth: document.body.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    docScrollWidth: document.documentElement.scrollWidth
  }));
  const overflow = Math.max(metrics.bodyScrollWidth, metrics.docScrollWidth) - metrics.clientWidth;

  if (overflow > 1) {
    throw new Error(`${viewportName} has horizontal overflow: ${JSON.stringify(metrics)}`);
  }
}

async function playToResult(page) {
  for (const choiceIndex of resultPath) {
    await page.locator(".ms-claude-choice-ticket").nth(choiceIndex).click();
    await page.getByLabel("选择反馈").waitFor();
    await page.getByLabel("继续").click();
  }

  await page.getByLabel("结果分享卡").waitFor();
}

async function checkResultImage(page) {
  await page.getByLabel("生成结果图").click();
  const poster = page.getByAltText("可保存的周一结果图");
  await poster.waitFor();

  const posterState = await poster.evaluate((image) => ({
    naturalHeight: image instanceof HTMLImageElement ? image.naturalHeight : 0,
    naturalWidth: image instanceof HTMLImageElement ? image.naturalWidth : 0,
    src: image instanceof HTMLImageElement ? image.src.slice(0, 64) : ""
  }));

  if (!posterState.src.startsWith("data:image/png;base64,iVBORw0K")) {
    throw new Error(`Result poster did not render as a PNG data URL: ${JSON.stringify(posterState)}`);
  }

  if (posterState.naturalWidth !== 853 || posterState.naturalHeight !== 1844) {
    throw new Error(`Unexpected poster dimensions: ${JSON.stringify(posterState)}`);
  }

  await page.getByRole("link", { name: "下载图片" }).waitFor();
  const shareTextButton = page.getByRole("button", { name: "分享文案" });
  await shareTextButton.waitFor();
  await shareTextButton.click();
  await page.getByText("分享文案已准备好，可以发给同事。").waitFor();
}

async function run() {
  const server = await ensureServer();
  const browser = await chromium.launch();
  const errors = [];

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        deviceScaleFactor: 1,
        hasTouch: true,
        isMobile: true,
        viewport
      });
      await context.grantPermissions(["clipboard-write"], { origin: base.origin });
      const page = await context.newPage();
      const consoleErrors = [];

      page.on("console", (message) => {
        if (message.type() === "error") {
          consoleErrors.push(message.text());
        }
      });
      page.on("pageerror", (error) => {
        consoleErrors.push(error.message);
      });

      await page.goto(baseURL, { waitUntil: "load" });
      await page.getByLabel("当前回合").waitFor();
      await assertNoHorizontalOverflow(page, viewport.name);

      if (viewport.name === "target-stage") {
        await playToResult(page);
        await assertNoHorizontalOverflow(page, viewport.name);
        await checkResultImage(page);
      }

      if (consoleErrors.length > 0) {
        errors.push(`${viewport.name} console errors:\n${consoleErrors.join("\n")}`);
      }

      await context.close();
      console.log(`Passed ${viewport.name}`);
    }
  } finally {
    await browser.close();
    if (server) {
      server.kill();
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n\n"));
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
