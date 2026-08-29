import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const baseUrl = "http://127.0.0.1:5323";
const harnessUrl = `${baseUrl}/tmp/design-qa/stage8-qa-20260828/harness.html`;
const evidencePath = resolve(import.meta.dirname, "codex-browser-adversarial-evidence.json");
const screenshotPath = resolve(import.meta.dirname, "codex-intro-focus.png");
const resultPath = [0, 2, 0, 1, 0];

async function serverReady() {
  try {
    return (await fetch(baseUrl, { method: "HEAD" })).ok;
  } catch {
    return false;
  }
}

async function waitForServer(expected) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if ((await serverReady()) === expected) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  }
  throw new Error(`Vite server did not ${expected ? "start" : "stop"}`);
}

async function stopServer(server) {
  if (!server || server.exitCode !== null) return;
  const exited = new Promise((resolveExit) => server.once("exit", resolveExit));
  server.kill("SIGTERM");
  await Promise.race([
    exited,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Vite cleanup timed out")), 5_000))
  ]);
  await waitForServer(false);
}

async function visibleAction(page, primaryLabel, fixedLabel = primaryLabel) {
  const candidates = page.locator(`button[aria-label="${primaryLabel}"], button[aria-label="${fixedLabel}"]`);
  for (let index = 0; index < await candidates.count(); index += 1) {
    if (await candidates.nth(index).isVisible()) return candidates.nth(index);
  }
  throw new Error(`No visible action for ${primaryLabel}`);
}

async function playToFinalFeedback(page) {
  await page.getByRole("dialog", { name: "今天你能体面下班吗?", exact: true }).waitFor();
  await page.getByRole("button", { name: "开始上班", exact: true }).click();
  for (let round = 0; round < resultPath.length; round += 1) {
    await page.getByLabel("当前回合", { exact: true }).waitFor();
    await page.locator(".ms-fixed-choice").nth(resultPath[round]).click();
    await page.getByLabel("选择反馈", { exact: true }).waitFor();
    if (round < resultPath.length - 1) {
      await (await visibleAction(page, "继续", "继续（固定操作）")).click();
    }
  }
}

function countEvents(events, name) {
  return events.filter((event) => event.name === name).length;
}

async function eventSnapshot(page) {
  return page.evaluate(() => window.__stage8Events.map((event) => ({
    name: event.name,
    properties: event.properties ?? {}
  })));
}

async function setShareMocks(page, mode) {
  await page.evaluate((shareMode) => {
    window.__clipboardCalls = 0;
    window.__resolveShare = undefined;
    const clipboard = {
      writeText: () => {
        window.__clipboardCalls += 1;
        return Promise.resolve();
      }
    };

    if (shareMode === "cancel") {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: () => Promise.reject(new DOMException("cancelled", "AbortError"))
      });
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: clipboard });
    } else if (shareMode === "success") {
      Object.defineProperty(navigator, "share", { configurable: true, value: () => Promise.resolve() });
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: clipboard });
    } else if (shareMode === "fallback") {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: () => Promise.reject(new Error("native unavailable"))
      });
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: clipboard });
    } else if (shareMode === "none") {
      Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    } else if (shareMode === "pending") {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: () => new Promise((resolveShare) => {
          window.__resolveShare = resolveShare;
        })
      });
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    }
  }, mode);
}

async function run() {
  if (await serverReady()) throw new Error(`${baseUrl} is already occupied`);
  const server = spawn(resolve(projectRoot, "node_modules/.bin/vite"), ["--host", "127.0.0.1", "--port", "5323"], {
    cwd: projectRoot,
    env: process.env,
    stdio: "ignore"
  });
  let browser;
  const externalRequests = [];
  const consoleErrors = [];
  const evidence = {};

  try {
    await waitForServer(true);
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      hasTouch: true,
      isMobile: true,
      serviceWorkers: "block",
      timezoneId: "Asia/Shanghai",
      viewport: { width: 390, height: 844 }
    });
    await context.addInitScript(() => {
      if (sessionStorage.getItem("codex-adversarial-initialized") !== "yes") {
        localStorage.clear();
        sessionStorage.setItem("codex-adversarial-initialized", "yes");
      }
    });
    const page = await context.newPage();
    page.on("request", (request) => {
      const url = request.url();
      if (!url.startsWith("data:") && !url.startsWith("blob:") && new URL(url).origin !== new URL(baseUrl).origin) {
        externalRequests.push(url);
      }
    });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto(harnessUrl, { waitUntil: "load" });
    const introDialog = page.getByRole("dialog", { name: "今天你能体面下班吗?", exact: true });
    const startButton = page.getByRole("button", { name: "开始上班", exact: true });
    await introDialog.waitFor();
    const startBox = await startButton.boundingBox();
    const introBeforeTab = await page.evaluate(() => ({
      activeTag: document.activeElement?.tagName ?? "",
      activeText: document.activeElement?.textContent?.trim() ?? "",
      underlayInert: document.querySelector(".ms-fixed-intro-underlay")?.hasAttribute("inert") ?? false,
      overflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - document.documentElement.clientWidth
    }));
    await page.screenshot({ path: screenshotPath, fullPage: false });
    await page.keyboard.press("Tab");
    const introAfterFirstTab = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? "");
    await page.keyboard.press("Tab");
    const introAfterSecondTab = await page.evaluate(() => ({
      activeTag: document.activeElement?.tagName ?? "",
      activeText: document.activeElement?.textContent?.trim() ?? ""
    }));
    evidence.introFocus = {
      beforeTab: introBeforeTab,
      afterFirstTab: introAfterFirstTab,
      afterSecondTab: introAfterSecondTab,
      startButtonBox: startBox,
      initialFocusInsideDialog: await introDialog.evaluate((dialog) => dialog.contains(document.activeElement)),
      focusWrappedToStart: introAfterSecondTab.activeText === "开始上班"
    };

    await startButton.focus();
    await playToFinalFeedback(page);
    const finalAction = await visibleAction(page, "查看结果", "查看结果（固定操作）");
    await finalAction.evaluate((button) => {
      button.click();
      button.click();
    });
    await page.getByLabel("结果分享卡", { exact: true }).waitFor();
    const afterDoubleFinalEvents = await eventSnapshot(page);
    const historyEnvelope = await page.evaluate(() => JSON.parse(localStorage.getItem("monday-survival:history:v1") ?? "null"));
    evidence.doubleFinal = {
      feedbackContinueCount: countEvents(afterDoubleFinalEvents, "feedback_continue"),
      resultViewCount: countEvents(afterDoubleFinalEvents, "result_view"),
      historyEntryCount: historyEnvelope?.entries?.length ?? 0,
      tail: afterDoubleFinalEvents.slice(-8)
    };

    const createPoster = await visibleAction(page, "生成我的周一战报", "生成我的周一战报（固定操作）");
    await createPoster.evaluate((button) => {
      button.click();
      button.click();
    });
    await page.getByAltText("可保存的周一战报").waitFor();
    const afterPosterEvents = await eventSnapshot(page);
    evidence.doublePoster = {
      generatedCount: countEvents(afterPosterEvents, "result_image_generated")
    };

    const shareButton = page.getByRole("button", { name: "挑战一个同事", exact: true });
    await setShareMocks(page, "cancel");
    await shareButton.click();
    await page.getByText("已取消分享，未复制任何内容。", { exact: true }).waitFor();
    evidence.shareCancel = {
      clipboardCalls: await page.evaluate(() => window.__clipboardCalls),
      events: await eventSnapshot(page)
    };

    await setShareMocks(page, "success");
    await shareButton.click();
    await page.getByText("分享已完成。", { exact: true }).waitFor();

    await setShareMocks(page, "fallback");
    await shareButton.click();
    await page.getByText("分享文案已复制，可以发给同事。", { exact: true }).waitFor();
    evidence.shareFallbackClipboardCalls = await page.evaluate(() => window.__clipboardCalls);

    await setShareMocks(page, "none");
    await shareButton.click();
    await page.getByText("操作失败，请重试或手动截图。", { exact: true }).waitFor();

    await setShareMocks(page, "pending");
    const attemptsBeforePending = countEvents(await eventSnapshot(page), "share_attempted");
    await shareButton.evaluate((button) => {
      button.click();
      button.click();
    });
    await page.getByText("正在打开系统分享…", { exact: true }).waitFor();
    const attemptsDuringPending = countEvents(await eventSnapshot(page), "share_attempted");
    await page.evaluate(() => window.__resolveShare?.());
    await page.getByText("分享已完成。", { exact: true }).waitFor();

    const finalEvents = await eventSnapshot(page);
    evidence.shareSummary = {
      attemptedCount: countEvents(finalEvents, "share_attempted"),
      completedCount: countEvents(finalEvents, "share_completed"),
      attemptsAddedByDoubleClick: attemptsDuringPending - attemptsBeforePending,
      completedMethods: finalEvents
        .filter((event) => event.name === "share_completed")
        .map((event) => event.properties.method),
      shareTail: finalEvents.filter((event) => event.name.startsWith("share_"))
    };

    await page.getByRole("button", { name: "关闭周一战报", exact: true }).click();
    await page.reload({ waitUntil: "load" });
    evidence.reloadRecovery = await page.evaluate(() => ({
      hasRound: Boolean(document.querySelector('[aria-label="当前回合"]')),
      historyEntryCount: JSON.parse(localStorage.getItem("monday-survival:history:v1") ?? "null")?.entries?.length ?? 0,
      bodyTextLength: document.body.innerText.length
    }));
    await context.close();
  } finally {
    await browser?.close();
    await stopServer(server);
  }

  evidence.externalRequests = externalRequests;
  evidence.consoleErrors = consoleErrors;
  evidence.portReleased = !(await serverReady());
  await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(evidence, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
