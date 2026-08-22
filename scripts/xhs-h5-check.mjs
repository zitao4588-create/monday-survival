import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { access, mkdir } from "node:fs/promises";
import path from "node:path";

const baseURL = process.env.MS_XHS_BASE_URL ?? "http://127.0.0.1:5322";
const base = new URL(baseURL);
const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
const viewports = [
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 426, height: 922 }
];
const expectedHint = "请使用系统截图保存当前结果。";

async function isServerReady() {
  try {
    const response = await fetch(baseURL, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(expectedReady) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 20_000) {
    if ((await isServerReady()) === expectedReady) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`等待 ${baseURL} ${expectedReady ? "启动" : "停止"}超时`);
}

async function findViteEntry() {
  const candidates = [
    path.resolve(process.cwd(), "node_modules/vite/bin/vite.js"),
    path.resolve(process.cwd(), "../../node_modules/vite/bin/vite.js")
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Continue to the workspace-level installation.
    }
  }

  throw new Error("未找到 Vite 可执行入口，请先在 Game Lab 根目录安装依赖");
}

async function startServer() {
  if (await isServerReady()) {
    throw new Error(`${baseURL} 已被其他服务占用，请换端口或先停止该服务`);
  }

  if (!localHosts.has(base.hostname)) {
    throw new Error("自动验收只允许启动本地 preview 服务");
  }

  const viteEntry = await findViteEntry();
  let serverError = "";
  const server = spawn(
    process.execPath,
    [viteEntry, "preview", "--host", "127.0.0.1", "--port", base.port || "5322", "--outDir", "dist-xhs"],
    { cwd: process.cwd(), env: process.env, stdio: ["ignore", "ignore", "pipe"] }
  );
  server.stderr.setEncoding("utf8");
  server.stderr.on("data", (chunk) => {
    serverError = `${serverError}${chunk}`.slice(-4_000);
  });

  try {
    await Promise.race([
      waitForServer(true),
      new Promise((_, reject) => {
        server.once("exit", (code, signal) => {
          reject(
            new Error(
              `Vite preview 提前退出（code=${code ?? "null"}, signal=${signal ?? "null"}）${
                serverError.trim() ? `：\n${serverError.trim()}` : ""
              }`
            )
          );
        });
      })
    ]);
    return server;
  } catch (error) {
    await stopServer(server);
    throw error;
  }
}

async function stopServer(server) {
  if (server.exitCode !== null) {
    await waitForServer(false);
    return;
  }

  const exited = new Promise((resolve) => server.once("exit", resolve));
  server.kill("SIGTERM");

  await Promise.race([
    exited,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Vite preview 进程未能及时退出")), 5_000))
  ]);
  await waitForServer(false);
}

async function assertNoHorizontalOverflow(page, viewport) {
  const widths = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    client: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth
  }));

  if (Math.max(widths.body, widths.document) - widths.client > 1) {
    throw new Error(`${viewport.width}x${viewport.height} 存在横向溢出：${JSON.stringify(widths)}`);
  }
}

async function playFiveRounds(page, viewport) {
  for (let round = 1; round <= 5; round += 1) {
    await page.getByLabel("当前回合", { exact: true }).waitFor();
    await assertNoHorizontalOverflow(page, viewport);
    await page.locator(".ms-choice-ticket").first().click();
    await page.getByLabel("选择反馈", { exact: true }).waitFor();
    await assertNoHorizontalOverflow(page, viewport);
    await page.getByLabel("继续", { exact: true }).click();
  }

  await page.getByLabel("结果分享卡", { exact: true }).waitFor();
  await assertNoHorizontalOverflow(page, viewport);
  await page.getByLabel("保存结果图", { exact: true }).click();
  await page.getByRole("status").filter({ hasText: expectedHint }).waitFor();
  await assertNoHorizontalOverflow(page, viewport);

  if (viewport.width === 390 && viewport.height === 844) {
    const screenshotDirectory = path.resolve(process.cwd(), "tmp");
    await mkdir(screenshotDirectory, { recursive: true });
    await page.screenshot({ path: path.join(screenshotDirectory, "xhs-result-390x844.png"), fullPage: true });
  }
}

async function launchBrowser() {
  const executablePath = process.env.MS_XHS_BROWSER_PATH;
  const channel = process.env.MS_XHS_BROWSER_CHANNEL ?? "chrome";

  return chromium.launch({
    ...(executablePath ? { executablePath } : { channel }),
    headless: true
  });
}

async function run() {
  const server = await startServer();
  let browser;

  try {
    browser = await launchBrowser();

    for (const viewport of viewports) {
      const context = await browser.newContext({
        hasTouch: true,
        isMobile: true,
        viewport
      });
      const page = await context.newPage();
      const runtimeFailures = [];
      const externalRequests = [];

      page.on("console", (message) => {
        if (message.type() === "error") {
          const location = message.location();
          runtimeFailures.push(`console: ${message.text()}${location.url ? ` (${location.url})` : ""}`);
        }
      });
      page.on("pageerror", (error) => runtimeFailures.push(`pageerror: ${error.message}`));
      page.on("response", (response) => {
        if (response.status() >= 400) {
          runtimeFailures.push(`HTTP ${response.status()}: ${response.url()}`);
        }
      });
      page.on("request", (request) => {
        try {
          const requestURL = new URL(request.url());
          if ((requestURL.protocol === "http:" || requestURL.protocol === "https:")
            && !localHosts.has(requestURL.hostname)) {
            externalRequests.push(request.url());
          }
        } catch {
          runtimeFailures.push(`无法解析请求地址：${request.url()}`);
        }
      });

      await page.goto(baseURL, { waitUntil: "load" });
      await playFiveRounds(page, viewport);

      const forbiddenDomCount = await page.locator(
        'a[target="_blank"], a[download], iframe, object, embed, form'
      ).count();
      if (forbiddenDomCount > 0) {
        runtimeFailures.push(`页面存在 ${forbiddenDomCount} 个禁用 DOM 节点`);
      }

      if (externalRequests.length > 0) {
        runtimeFailures.push(`外部请求：${externalRequests.join(", ")}`);
      }

      if (runtimeFailures.length > 0) {
        throw new Error(`${viewport.width}x${viewport.height} 运行检查失败：\n- ${runtimeFailures.join("\n- ")}`);
      }

      await context.close();
      console.log(`${viewport.width}x${viewport.height}：五回合、截图提示、零外部请求、零错误、无横向溢出。`);
    }
  } finally {
    await browser?.close();
    await stopServer(server);
  }

  if (await isServerReady()) {
    throw new Error("验收结束后 preview 服务仍在运行");
  }

  console.log("XHS H5 检查通过；preview 服务已清理并确认退出。");
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
