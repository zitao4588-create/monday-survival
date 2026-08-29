import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import path from "node:path";

const baseURL = process.env.MS_WECHAT_BASE_URL ?? "http://127.0.0.1:5321";
const base = new URL(baseURL);
const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
const testNow = "2026-08-28T12:00:00.000Z";
const testTimeZone = "Asia/Shanghai";
const introTitle = "今天你能体面下班吗?";
const viewports = [
  { width: 375, height: 667, name: "small-iphone" },
  { width: 390, height: 844, name: "modern-iphone" },
  { width: 426, height: 922, name: "target-stage" }
];
const resultPath = [0, 2, 0, 1, 0];
const expectedEventIndexes = [0, 2, 1, 0, 2];
const expectedPerformanceAtRoundStart = [0, 12, 22, 40, 40];
const expectedPerformanceAfterRound = [12, 22, 40, 40, 56];
const forbiddenFutureEventTextByRound = [
  ["09:03", "终于抢到座位", "空位像季度奖金突然出现。手机同时弹出一份待会要过的方案。"],
  [
    "10:18",
    "截止时间被提前",
    "原本周三的交付被一句‘最好今天’推到眼前。所有人开始研究桌面。",
    "老板接着你早上的回复，把周三交付改成‘最好今天’。所有人开始研究桌面。",
    "老板没等到早上的回复，顺手把周三交付改成‘最好今天’。空气更安静了。"
  ],
  [
    "15:07",
    "下午低电量",
    "三个需求、两个催促和一份‘很快就好’的文档同时敲门。",
    "上午那句强硬回应还在群里回响，三个需求和两个催促同时敲门。",
    "上午漏掉的半句要求变成一份加急文档，和两个催促一起敲门。"
  ],
  [
    "18:15",
    "聚餐邀请弹出来",
    "部门群说临时聚餐，备注‘自愿参加’。你的回家倒计时已经开始。",
    "下午补给后状态尚可，部门群又发来一场‘自愿参加’的聚餐。",
    "下午硬扛让电量见底，部门群偏偏发来一场‘自愿参加’的聚餐。"
  ]
];
const expectedChoiceIconsByRound = [
  ["shower-head", "smartphone", "coffee"],
  ["notebook-text", "power", "list-filter"],
  ["list-filter", "calendar-clock", "eye-off"],
  ["panels-top-left", "sandwich", "list-filter"],
  ["sandwich", "door-open", "laptop"]
];

async function createTestContext(browser, options = {}) {
  const context = await browser.newContext({
    ...options,
    timezoneId: testTimeZone
  });

  await context.addInitScript((isoNow) => {
    const OriginalDate = Date;
    const fixedTimestamp = OriginalDate.parse(isoNow);

    function FrozenDate(...args) {
      if (!new.target) {
        return new OriginalDate(fixedTimestamp).toString();
      }

      return Reflect.construct(
        OriginalDate,
        args.length === 0 ? [fixedTimestamp] : args,
        new.target
      );
    }

    Object.setPrototypeOf(FrozenDate, OriginalDate);
    FrozenDate.prototype = OriginalDate.prototype;
    FrozenDate.now = () => fixedTimestamp;
    FrozenDate.parse = OriginalDate.parse;
    FrozenDate.UTC = OriginalDate.UTC;
    globalThis.Date = FrozenDate;
  }, testNow);

  return context;
}

async function isServerReady() {
  try {
    const response = await fetch(baseURL, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(expectedReady = true) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < 20_000) {
    if ((await isServerReady()) === expectedReady) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`等待 ${baseURL} ${expectedReady ? "启动" : "停止"}超时`);
}

async function ensureServer() {
  if (await isServerReady()) {
    if (!localHosts.has(base.hostname)) {
      return null;
    }

    throw new Error(`${baseURL} 已被旧服务占用，请先停止该服务再运行微信 H5 验收`);
  }

  if (!localHosts.has(base.hostname)) {
    throw new Error(`${baseURL} is not ready and cannot be started as a local Vite server`);
  }

  const vitePath = path.join(process.cwd(), "node_modules", ".bin", "vite");
  const port = base.port || "5321";
  const server = spawn(vitePath, ["--host", "127.0.0.1", "--port", port], {
    cwd: process.cwd(),
    env: process.env,
    stdio: "ignore"
  });

  try {
    await waitForServer(true);
    return server;
  } catch (error) {
    await stopServer(server);
    throw error;
  }
}

async function stopServer(server) {
  if (!server) {
    return;
  }

  if (server.exitCode === null) {
    const exited = new Promise((resolve) => server.once("exit", resolve));
    server.kill("SIGTERM");
    await Promise.race([
      exited,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Vite 服务未能在 5 秒内退出")), 5_000))
    ]);
  }

  await waitForServer(false);
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

async function continuePastCloudBaseNotice(page) {
  if (!base.hostname.endsWith(".tcloudbaseapp.com")) {
    return false;
  }

  const confirmLink = page.getByText("确定访问", { exact: true });
  const isVisible = await confirmLink.waitFor({ state: "visible", timeout: 5_000 })
    .then(() => true)
    .catch(() => false);

  if (isVisible) {
    await confirmLink.click();
    return true;
  }

  return false;
}

async function startFirstVisit(page) {
  const dialog = page.getByRole("dialog", { name: introTitle, exact: true });
  const isVisible = await dialog.waitFor({ state: "visible", timeout: 5_000 })
    .then(() => true)
    .catch(() => false);

  if (isVisible) {
    await dialog.getByRole("button", { name: "开始上班", exact: true }).click();
  }

  await page.getByLabel("当前回合", { exact: true }).waitFor();
}

async function assertPerformanceBar(page, screenLabel, expectedValue) {
  const screen = page.getByLabel(screenLabel, { exact: true });
  const performanceCard = screen.locator('[data-stat-kind="score"]');
  const performanceLabel = await performanceCard.getAttribute("aria-label");
  const match = performanceLabel?.match(/^绩效 ([+-]?\d+)(?:，变化 [+-]?\d+)?$/);
  const value = match ? Number.parseInt(match[1], 10) : Number.NaN;
  const bar = performanceCard.locator(".ms-fixed-stat__bar, .ms-fixed-feedback-stat__bar");
  const segments = await bar.locator("span").evaluateAll((elements) => (
    elements.map((element) => element.getAttribute("data-meter-segment") ?? "")
  ));
  const expectedDirection = value < 0 ? "negative" : value > 0 ? "positive" : "zero";
  const actualDirection = await bar.getAttribute("data-performance-direction");
  const negativeIndexes = segments.flatMap((segment, index) => segment === "negative" ? [index] : []);
  const positiveIndexes = segments.flatMap((segment, index) => segment === "positive" ? [index] : []);

  if (!match
    || performanceLabel?.includes("/100")
    || value !== expectedValue
    || segments.length !== 7
    || segments[3] !== "zero"
    || actualDirection !== expectedDirection
    || negativeIndexes.some((index) => index >= 3)
    || positiveIndexes.some((index) => index <= 3)
    || (value < 0 && negativeIndexes.length === 0)
    || (value > 0 && positiveIndexes.length === 0)
    || (value === 0 && (negativeIndexes.length > 0 || positiveIndexes.length > 0))) {
    throw new Error(`${screenLabel}绩效真实值或七段条错误：${performanceLabel}`);
  }
}

async function assertFeedbackSettlement(page, roundNumber) {
  const feedbackScreen = page.getByLabel("选择反馈", { exact: true });
  const feedbackText = await feedbackScreen.innerText();

  if (feedbackText.includes("下一事件预告")) {
    throw new Error(`第 ${roundNumber} 回合反馈页重新泄露了下一事件预告`);
  }

  const leakedText = forbiddenFutureEventTextByRound[roundNumber - 1]?.find((text) => feedbackText.includes(text));
  if (leakedText) {
    throw new Error(`第 ${roundNumber} 回合反馈页泄露下一事件内容：${leakedText}`);
  }

  if ((await feedbackScreen.locator(".ms-fixed-feedback-next").count()) !== 0
    || feedbackText.includes("本回合结算")
    || feedbackText.includes("今日结算")
    || feedbackText.includes("状态已更新")) {
    throw new Error(`第 ${roundNumber} 回合反馈页仍包含额外结算提示`);
  }

  const resultSummary = feedbackScreen.getByLabel("这一手的代价", { exact: true });
  await resultSummary.waitFor();
  await resultSummary.getByText("这一手的代价", { exact: true }).waitFor();
  const impactSummary = (await resultSummary.locator("p").innerText()).trim();
  if (!impactSummary
    || /[+-]?\d+/.test(impactSummary)
    || impactSummary.includes("能量")
    || impactSummary.includes("心情")
    || impactSummary.includes("绩效")
    || (await feedbackScreen.locator(".ms-fixed-feedback-message p").count()) !== 0) {
    throw new Error(`第 ${roundNumber} 回合情绪代价未正确写入下方纸卡`);
  }
}

async function assertResultActions(page) {
  const primaryActions = page.locator(".ms-fixed-result-actions > .ms-fixed-result-action");
  const primaryLabels = (await primaryActions.allInnerTexts()).map((label) => label.trim());
  if ((await primaryActions.count()) !== 2
    || JSON.stringify(primaryLabels) !== JSON.stringify(["生成我的周一战报", "换条路线再试一次"])) {
    throw new Error(`结果页两项主操作发生变化：${JSON.stringify(primaryLabels)}`);
  }

  const archiveAction = page.locator(".ms-fixed-result-actions > .ms-fixed-result-archive-trigger");
  const archiveLabel = (await archiveAction.count()) === 1 ? (await archiveAction.innerText()).trim() : "";
  const archiveAriaLabel = (await archiveAction.count()) === 1 ? await archiveAction.getAttribute("aria-label") : "";
  if ((await archiveAction.count()) !== 1
    || archiveLabel !== "周一档案 · 声音：关"
    || archiveAriaLabel !== "打开周一档案，声音已关闭") {
    throw new Error(`结果页档案入口数量或默认声音状态错误：${JSON.stringify({ archiveAriaLabel, archiveLabel })}`);
  }
}

async function playToResult(page) {
  for (let roundIndex = 0; roundIndex < resultPath.length; roundIndex += 1) {
    await assertPerformanceBar(page, "当前回合", expectedPerformanceAtRoundStart[roundIndex]);
    const icons = await page.locator(".ms-fixed-choice").evaluateAll((elements) => (
      elements.map((element) => element.getAttribute("data-fixed-choice-icon") ?? "")
    ));
    if (JSON.stringify(icons) !== JSON.stringify(expectedChoiceIconsByRound[roundIndex])) {
      throw new Error(`第 ${roundIndex + 1} 回合（事件池 index ${expectedEventIndexes[roundIndex]}）语义图标错误：${JSON.stringify(icons)}`);
    }
    await page.locator(".ms-fixed-choice").nth(resultPath[roundIndex]).click();
    await page.getByLabel("选择反馈").waitFor();
    await assertPerformanceBar(page, "选择反馈", expectedPerformanceAfterRound[roundIndex]);
    await assertFeedbackSettlement(page, roundIndex + 1);
    await page.getByLabel(roundIndex === resultPath.length - 1 ? "查看结果" : "继续", { exact: true }).click();
  }

  await page.getByLabel("结果分享卡").waitFor();
  await page.getByText("今日结局：体面下班", { exact: true }).waitFor();
  const resultText = await page.getByLabel("结果分享卡").innerText();
  const keyChoice = await page.getByLabel("关键一手", { exact: true }).innerText();
  if (!keyChoice.includes("去露个脸") || /\d+%|玩家/.test(resultText) || resultText.includes("本周")) {
    throw new Error(`结果页层级、关键一手或真实性边界错误：${keyChoice}`);
  }
  await assertResultActions(page);
}

async function checkResultImage(page) {
  const createButton = page.getByLabel("生成我的周一战报", { exact: true });
  await createButton.click();
  const poster = page.getByAltText("可保存的周一战报");
  await poster.waitFor();

  const closeButton = page.getByLabel("关闭周一战报", { exact: true });
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "关闭周一战报");
  const closeBox = await closeButton.boundingBox();
  const modalState = await page.evaluate(() => ({
    activeLabel: document.activeElement?.getAttribute("aria-label") ?? "",
    underlayInert: document.querySelector(".ms-fixed-result-underlay")?.hasAttribute("inert") ?? false
  }));
  if (!closeBox || closeBox.width < 44 || closeBox.height < 44
    || modalState.activeLabel !== "关闭周一战报" || !modalState.underlayInert) {
    throw new Error(`战报弹层触控、焦点或 inert 错误：${JSON.stringify({ closeBox, modalState })}`);
  }

  await page.locator(".ms-fixed-result-poster-panel").click({ position: { x: 8, y: 8 } });
  await poster.waitFor({ state: "visible" });

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

  await page.keyboard.press("Escape");
  await poster.waitFor({ state: "hidden" });
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "生成我的周一战报");
  if ((await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? "")) !== "生成我的周一战报") {
    throw new Error("Escape 关闭后焦点未恢复到生成战报按钮");
  }

  await createButton.click();
  await poster.waitFor();
  await page.locator(".ms-fixed-result-poster-modal").click({ position: { x: 4, y: 4 } });
  await poster.waitFor({ state: "hidden" });
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "生成我的周一战报");
  if ((await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? "")) !== "生成我的周一战报") {
    throw new Error("遮罩关闭后焦点未恢复到生成战报按钮");
  }

  await createButton.click();
  await poster.waitFor();

  await page.getByRole("link", { name: "下载图片" }).waitFor();
  const shareTextButton = page.getByRole("button", { name: "挑战一个同事" });
  await shareTextButton.waitFor();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (text) => {
          window.__mondaySurvivalShareText = text;
          return Promise.resolve();
        }
      }
    });
  });
  await shareTextButton.click();
  await page.getByText("分享文案已复制，可以发给同事。").waitFor();
  const sharedText = await page.evaluate(() => window.__mondaySurvivalShareText ?? "");
  if (!sharedText.startsWith("我的今日周一人格：")
    || !sharedText.includes("今日结局：体面下班")
    || !sharedText.includes("关键一手：去露个脸")
    || !sharedText.includes("绩效 +56 · 能量 60/100 · 心情 98/100")) {
    throw new Error(`分享文案未使用共享真实结果：${sharedText}`);
  }

  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: () => Promise.reject(new DOMException("Share cancelled", "AbortError"))
    });
  });
  await shareTextButton.click();
  await page.getByText("已取消分享，未复制任何内容。").waitFor();

  await page.evaluate(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
  });
  await shareTextButton.click();
  await page.getByText("操作失败，请重试或手动截图。").waitFor();

  await closeButton.click();
  if ((await page.getByText("操作失败，请重试或手动截图。", { exact: true }).count()) !== 0) {
    throw new Error("关闭结果图后仍残留分享失败状态");
  }
}

async function run() {
  const server = await ensureServer();
  let browser;
  const errors = [];

  try {
    browser = await chromium.launch();

    for (const viewport of viewports) {
      const context = await createTestContext(browser, {
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
      const continuedPastCloudBaseNotice = await continuePastCloudBaseNotice(page);
      if (continuedPastCloudBaseNotice) {
        await page.getByLabel("当前回合").waitFor();
        consoleErrors.length = 0;
        await page.reload({ waitUntil: "load" });
      }
      await startFirstVisit(page);
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
    try {
      await browser?.close();
    } finally {
      await stopServer(server);
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
