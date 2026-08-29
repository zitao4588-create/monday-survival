import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import path from "node:path";

const baseURL = process.env.MS_XHS_BASE_URL ?? "http://127.0.0.1:5322";
const base = new URL(baseURL);
const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
const testNow = "2026-08-28T12:00:00.000Z";
const testTimeZone = "Asia/Shanghai";
const introStorageKey = "monday-survival:intro:v1";
const introStorageValue = "seen";
const introCopy = {
  description: "5 次选择，守住能量、心情和绩效。",
  duration: "全部走完约2分钟，无需登录",
  start: "开始上班",
  title: "今天你能体面下班吗?"
};
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
const expectedRoundStatOrder = ["energy", "mood", "score"];
const expectedResultStatOrder = ["score", "energy", "mood"];
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

async function ensureServer() {
  if (await isServerReady()) {
    throw new Error(`${baseURL} 已被旧服务占用，请先停止该服务再运行 XHS 验收`);
  }

  if (!localHosts.has(base.hostname)) {
    throw new Error(`${baseURL} 尚未就绪，且不是可自动启动的本地地址`);
  }

  const vitePath = path.join(process.cwd(), "node_modules", ".bin", "vite");
  const port = base.port || "5322";
  const server = spawn(vitePath, ["preview", "--host", "127.0.0.1", "--port", port, "--outDir", "dist-xhs"], {
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
      new Promise((_, reject) => setTimeout(() => reject(new Error("Vite preview 进程未能及时退出")), 5_000))
    ]);
  }

  await waitForServer(false);
}

async function assertNoViewportOverflow(page, viewportName) {
  const metrics = await page.evaluate(() => ({
    bodyScrollHeight: document.body.scrollHeight,
    bodyScrollWidth: document.body.scrollWidth,
    clientHeight: document.documentElement.clientHeight,
    clientWidth: document.documentElement.clientWidth,
    docScrollHeight: document.documentElement.scrollHeight,
    docScrollWidth: document.documentElement.scrollWidth
  }));
  const horizontalOverflow = Math.max(metrics.bodyScrollWidth, metrics.docScrollWidth) - metrics.clientWidth;
  const verticalOverflow = Math.max(metrics.bodyScrollHeight, metrics.docScrollHeight) - metrics.clientHeight;

  if (horizontalOverflow > 1 || verticalOverflow > 1) {
    throw new Error(`${viewportName} 存在页面溢出：${JSON.stringify(metrics)}`);
  }
}

async function assertStageContained(page, screenLabel) {
  const boxes = await page.locator(".ms-fixed-round-page, .ms-fixed-screen-page").first().evaluate((pageElement) => {
    const stageElement = pageElement.querySelector(".ms-fixed-round-viewport, .ms-fixed-screen-viewport");
    const pageBox = pageElement.getBoundingClientRect();
    const stageBox = stageElement?.getBoundingClientRect();
    return {
      page: { bottom: pageBox.bottom, left: pageBox.left, right: pageBox.right, top: pageBox.top },
      stage: stageBox
        ? { bottom: stageBox.bottom, left: stageBox.left, right: stageBox.right, top: stageBox.top }
        : null
    };
  });

  if (!boxes.stage
    || boxes.stage.left < boxes.page.left - 1
    || boxes.stage.right > boxes.page.right + 1
    || boxes.stage.top < boxes.page.top - 1
    || boxes.stage.bottom > boxes.page.bottom + 1) {
    throw new Error(`${screenLabel} 固定画布没有完整包含在单屏内：${JSON.stringify(boxes)}`);
  }
}

async function assertAtTop(page, transitionName) {
  await page.waitForFunction(() => Math.abs(window.scrollY) <= 1);
  const scrollState = await page.evaluate(() => ({
    body: document.body.scrollTop,
    document: document.documentElement.scrollTop,
    window: window.scrollY
  }));

  if (Math.max(Math.abs(scrollState.body), Math.abs(scrollState.document), Math.abs(scrollState.window)) > 1) {
    throw new Error(`${transitionName} 后没有回到页面顶部：${JSON.stringify(scrollState)}`);
  }
}

async function assertScreenReady(page, screenLabel, transitionName) {
  const screen = page.getByLabel(screenLabel, { exact: true });
  await screen.waitFor();
  await assertAtTop(page, transitionName);
  await assertNoViewportOverflow(page, transitionName);
  await assertStageContained(page, transitionName);

  const background = screen.locator(
    ".ms-fixed-round-background, .ms-fixed-feedback-background, .ms-fixed-result-background"
  ).first();
  await background.waitFor();
  await background.evaluate(async (image) => {
    if (!(image instanceof HTMLImageElement) || image.complete) {
      return;
    }

    const source = image.currentSrc || image.src || "（未知背景地址）";

    await Promise.race([
      new Promise((resolve, reject) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", () => reject(new Error(`背景加载失败：${source}`)), { once: true });
      }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`背景加载超过 10 秒：${source}`)), 10_000);
      })
    ]);
  });

  const backgroundState = await background.evaluate((image) => ({
    complete: image instanceof HTMLImageElement ? image.complete : false,
    naturalHeight: image instanceof HTMLImageElement ? image.naturalHeight : 0,
    naturalWidth: image instanceof HTMLImageElement ? image.naturalWidth : 0
  }));

  if (!backgroundState.complete || backgroundState.naturalWidth <= 0 || backgroundState.naturalHeight <= 0) {
    throw new Error(`${transitionName} 背景图未正常加载：${JSON.stringify(backgroundState)}`);
  }
}

async function assertIntroCopy(page) {
  const dialog = page.getByRole("dialog", { name: introCopy.title, exact: true });
  const startButton = dialog.getByRole("button", { name: introCopy.start, exact: true });
  await dialog.waitFor();
  await dialog.getByText(introCopy.description, { exact: true }).waitFor();
  await startButton.waitFor();
  await dialog.getByText(introCopy.duration, { exact: true }).waitFor();
  await assertNoViewportOverflow(page, "首次引导");
  await assertStageContained(page, "首次引导");

  if ((await dialog.getByText(/任何一项/).count()) !== 0) {
    throw new Error("首次引导恢复了已删除的‘任何一项……’文案");
  }

  if (!(await startButton.evaluate((button) => document.activeElement === button))) {
    throw new Error("首次引导打开后焦点没有落在‘开始上班’按钮");
  }

  await page.keyboard.press("Tab");
  if (!(await startButton.evaluate((button) => document.activeElement === button))) {
    throw new Error("首次引导按 Tab 后焦点逃离弹窗操作按钮");
  }

  await page.keyboard.press("Shift+Tab");
  if (!(await startButton.evaluate((button) => document.activeElement === button))) {
    throw new Error("首次引导按 Shift+Tab 后焦点逃离弹窗操作按钮");
  }
}

async function startFirstVisit(page) {
  await assertIntroCopy(page);

  const markerBeforeStart = await page.evaluate((key) => localStorage.getItem(key), introStorageKey);
  if (markerBeforeStart !== null) {
    throw new Error(`首次引导开始前已经写入标记：${markerBeforeStart}`);
  }

  await page.getByRole("button", { name: introCopy.start, exact: true }).click();
  await assertScreenReady(page, "当前回合", "首次引导开始游戏");

  const markerAfterStart = await page.evaluate((key) => localStorage.getItem(key), introStorageKey);
  if (markerAfterStart !== introStorageValue) {
    throw new Error(`首次引导没有写入版本化标记：${markerAfterStart}`);
  }

  await page.reload({ waitUntil: "load" });
  await assertScreenReady(page, "当前回合", "刷新已开始的游戏");
  if ((await page.getByRole("dialog", { name: introCopy.title, exact: true }).count()) !== 0) {
    throw new Error("写入首次引导标记后刷新仍重复出现引导");
  }
}

async function assertNeutralChoices(page, roundNumber) {
  const choices = page.locator(".ms-fixed-choice");
  if ((await choices.count()) !== 3) {
    throw new Error(`第 ${roundNumber} 回合没有恰好显示三个选项`);
  }

  const states = await choices.evaluateAll((elements) => elements.map((element) => {
    const icon = element.querySelector(".ms-fixed-choice__icon");
    const choiceIcon = element.querySelector(".ms-choice-icon");
    return {
      className: element.className,
      iconBorder: icon ? getComputedStyle(icon).borderColor : "",
      iconColor: choiceIcon ? getComputedStyle(choiceIcon).color : "",
      tone: element.getAttribute("data-choice-tone")
    };
  }));

  if (states.some((state) => state.tone !== "neutral" || /--(?:green|yellow|red)\b/.test(state.className))) {
    throw new Error(`第 ${roundNumber} 回合仍带固定好坏色类：${JSON.stringify(states)}`);
  }

  if (new Set(states.map((state) => state.iconBorder)).size !== 1
    || new Set(states.map((state) => state.iconColor)).size !== 1) {
    throw new Error(`第 ${roundNumber} 回合三个选项图标未统一为中性橄榄色：${JSON.stringify(states)}`);
  }

  if ((await page.getByText("上滑查看全部选项 ↑", { exact: true }).count()) !== 0) {
    throw new Error(`第 ${roundNumber} 回合仍显示上滑提示`);
  }

  const previewStates = await choices.locator(".ms-fixed-choice__copy small").evaluateAll((elements) => (
    elements.map((element) => ({
      clientHeight: element.clientHeight,
      clientWidth: element.clientWidth,
      lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
      scrollHeight: element.scrollHeight,
      scrollWidth: element.scrollWidth
    }))
  ));
  if (previewStates.some((state) => state.clientHeight > state.lineHeight + 1
    || state.scrollHeight > state.clientHeight + 1
    || state.scrollWidth > state.clientWidth + 1)) {
    throw new Error(`第 ${roundNumber} 回合选项说明没有完整保持单行：${JSON.stringify(previewStates)}`);
  }
}

async function assertShortViewportChoices(page, roundNumber) {
  const viewport = page.viewportSize();
  if (!viewport || viewport.width !== 375 || viewport.height !== 667) {
    return;
  }

  const state = await page.locator(".ms-fixed-choice").evaluateAll((elements) => ({
    boxes: elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { bottom: box.bottom, height: box.height, left: box.left, right: box.right, top: box.top, width: box.width };
    }),
    scrollY: window.scrollY
  }));

  if (Math.abs(state.scrollY) > 1
    || state.boxes.length !== 3
    || state.boxes.some((box) => box.top < 0 || box.bottom > viewport.height || box.height < 44 || box.width < 44)) {
    throw new Error(`第 ${roundNumber} 回合 375x667 三选项首屏或触控尺寸错误：${JSON.stringify({ state, viewport })}`);
  }
}

async function assertPerformanceMeterDirection(performanceBar, value, description) {
  const segments = await performanceBar.locator("span").evaluateAll((elements) => (
    elements.map((element) => element.getAttribute("data-meter-segment") ?? "")
  ));
  const expectedDirection = value < 0 ? "negative" : value > 0 ? "positive" : "zero";
  const actualDirection = await performanceBar.getAttribute("data-performance-direction");
  const negativeIndexes = segments.flatMap((segment, index) => segment === "negative" ? [index] : []);
  const positiveIndexes = segments.flatMap((segment, index) => segment === "positive" ? [index] : []);

  if (segments.length !== 7
    || segments[3] !== "zero"
    || actualDirection !== expectedDirection
    || negativeIndexes.some((index) => index >= 3)
    || positiveIndexes.some((index) => index <= 3)
    || (value < 0 && negativeIndexes.length === 0)
    || (value > 0 && positiveIndexes.length === 0)
    || (value === 0 && (negativeIndexes.length > 0 || positiveIndexes.length > 0))) {
    throw new Error(`${description}绩效中心刻度方向错误：${JSON.stringify({ actualDirection, segments, value })}`);
  }
}

async function assertDeltaDisclosure(page, roundNumber) {
  const revealedDeltas = page.locator(".ms-fixed-feedback-stat__delta");
  if ((await revealedDeltas.count()) !== 3) {
    throw new Error(`第 ${roundNumber} 回合反馈页没有恰好公布 3 项变化`);
  }

  const states = await revealedDeltas.evaluateAll((elements) => elements.map((element) => ({
    kind: element.getAttribute("data-delta-kind") ?? "",
    text: element.textContent?.trim() ?? ""
  })));

  if (JSON.stringify(states.map((state) => state.kind)) !== JSON.stringify(expectedRoundStatOrder)
    || states.some((state) => !/^[+-]?\d+$/.test(state.text))) {
    throw new Error(`第 ${roundNumber} 回合变化值内容或顺序错误：${JSON.stringify(states)}`);
  }

  const statusSummary = page.locator('.ms-fixed-feedback-screen [role="status"]');
  const summaryText = (await statusSummary.count()) === 1 ? await statusSummary.innerText() : "";
  if (!summaryText.includes("能量") || !summaryText.includes("心情") || !summaryText.includes("绩效")) {
    throw new Error(`第 ${roundNumber} 回合缺少可访问的变化汇总`);
  }

  const toneStates = await revealedDeltas.evaluateAll((elements) => elements.map((element) => ({
    className: element.className,
    value: Number.parseInt(element.textContent?.trim() ?? "0", 10)
  })));
  if (toneStates.some(({ className, value }) => (
    (value > 0 && !className.includes("is-positive"))
      || (value < 0 && !className.includes("is-negative"))
      || (value === 0 && !className.includes("is-neutral"))
  ))) {
    throw new Error(`第 ${roundNumber} 回合变化值颜色语义错误：${JSON.stringify(toneStates)}`);
  }
}

async function assertCompactStatCards(page, screenLabel, roundNumber, expectDeltas) {
  const screen = page.getByLabel(screenLabel, { exact: true });
  const cards = screen.locator("[data-stat-kind]");
  const states = await cards.evaluateAll((elements) => elements.map((element) => ({
    deltaKind: element.querySelector("[data-delta-kind]")?.getAttribute("data-delta-kind") ?? "",
    kind: element.getAttribute("data-stat-kind") ?? ""
  })));

  if (JSON.stringify(states.map((state) => state.kind)) !== JSON.stringify(expectedRoundStatOrder)) {
    throw new Error(`${screenLabel}第 ${roundNumber} 回合统计卡顺序错误：${JSON.stringify(states)}`);
  }

  const bars = screen.locator(expectDeltas ? ".ms-fixed-feedback-stat__bar" : ".ms-fixed-stat__bar");
  if ((await bars.count()) !== 3) {
    throw new Error(`${screenLabel}第 ${roundNumber} 回合三项状态没有恰好显示 3 条七段进度条`);
  }

  for (let index = 0; index < 3; index += 1) {
    if ((await bars.nth(index).locator("span").count()) !== 7) {
      throw new Error(`${screenLabel}第 ${roundNumber} 回合第 ${index + 1} 张统计卡不是七段进度条`);
    }
  }

  const performanceCard = screen.locator('[data-stat-kind="score"]');
  const performanceLabel = await performanceCard.getAttribute("aria-label");
  const performanceMatch = performanceLabel?.match(/^绩效 ([+-]?\d+)(?:，变化 [+-]?\d+)?$/);
  const expectedPerformance = expectDeltas
    ? expectedPerformanceAfterRound[roundNumber - 1]
    : expectedPerformanceAtRoundStart[roundNumber - 1];
  const performanceValue = performanceMatch ? Number.parseInt(performanceMatch[1], 10) : Number.NaN;
  const performanceBar = performanceCard.locator(expectDeltas ? ".ms-fixed-feedback-stat__bar" : ".ms-fixed-stat__bar");

  if (!performanceMatch
    || performanceLabel?.includes("/100")
    || performanceValue !== expectedPerformance
    || (await performanceBar.locator("span").count()) !== 7) {
    throw new Error(`${screenLabel}第 ${roundNumber} 回合绩效值或七段条错误：${performanceLabel}`);
  }
  await assertPerformanceMeterDirection(performanceBar, performanceValue, `${screenLabel}第 ${roundNumber} 回合`);

  const deltaKinds = states.map((state) => state.deltaKind);
  if (expectDeltas && JSON.stringify(deltaKinds) !== JSON.stringify(expectedRoundStatOrder)) {
    throw new Error(`${screenLabel}第 ${roundNumber} 回合 delta 未附在对应统计卡下：${JSON.stringify(states)}`);
  }

  if (!expectDeltas && deltaKinds.some(Boolean)) {
    throw new Error(`${screenLabel}第 ${roundNumber} 回合选择阶段提前显示 delta：${JSON.stringify(states)}`);
  }
}

async function assertResultStatOrder(page) {
  const resultStats = page.locator(".ms-fixed-result-stats [data-stat-kind]");
  const order = await resultStats.evaluateAll((elements) => (
    elements.map((element) => element.getAttribute("data-stat-kind") ?? "")
  ));

  if (JSON.stringify(order) !== JSON.stringify(expectedResultStatOrder)) {
    throw new Error(`结果页统计顺序被改动：${JSON.stringify(order)}`);
  }

  const performanceLabel = await page.locator('.ms-fixed-result-stat[data-stat-kind="score"]').getAttribute("aria-label");
  if (!performanceLabel?.startsWith("绩效 ") || performanceLabel.includes("/100")) {
    throw new Error(`结果页绩效没有保留真实带符号值：${performanceLabel}`);
  }
}

async function assertChoiceIcons(page, roundNumber) {
  const icons = await page.locator(".ms-fixed-choice").evaluateAll((elements) => (
    elements.map((element) => element.getAttribute("data-fixed-choice-icon") ?? "")
  ));

  const expectedIcons = expectedChoiceIconsByRound[roundNumber - 1];
  if (JSON.stringify(icons) !== JSON.stringify(expectedIcons)) {
    throw new Error(`第 ${roundNumber} 回合（事件池 index ${expectedEventIndexes[roundNumber - 1]}）语义图标错误：${JSON.stringify(icons)}`);
  }

  const renderedIcons = await page.locator(".ms-fixed-choice [data-choice-icon]").evaluateAll((elements) => (
    elements.map((element) => element.getAttribute("data-choice-icon") ?? "")
  ));
  if (JSON.stringify(renderedIcons) !== JSON.stringify(expectedIcons)) {
    throw new Error(`第 ${roundNumber} 回合 Lucide 图标没有按 turns 数据渲染：${JSON.stringify(renderedIcons)}`);
  }

  return icons;
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

async function assertButtonInViewport(page, locator, description) {
  await locator.waitFor({ state: "visible" });
  const viewport = page.viewportSize();
  const box = await locator.boundingBox();

  if (!viewport || !box || box.y < 0 || box.y + box.height > viewport.height) {
    throw new Error(`${description} 初始不在视口内：${JSON.stringify({ box, viewport })}`);
  }
}

async function getVisibleAction(page, originalLabel, fixedLabel) {
  const fixedAction = page.getByLabel(fixedLabel, { exact: true });
  if ((page.viewportSize()?.height ?? 0) <= 700) {
    const fixedVisible = await fixedAction.waitFor({ state: "visible", timeout: 1_000 })
      .then(() => true)
      .catch(() => false);
    if (fixedVisible) {
      return fixedAction;
    }
  }

  return page.getByLabel(originalLabel, { exact: true });
}

async function assertSettlementWithoutNextEvent(page, roundNumber) {
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
  await page.getByLabel(roundNumber === resultPath.length ? "查看结果" : "继续", { exact: true }).waitFor();
}

async function playToResult(page) {
  for (let roundIndex = 0; roundIndex < resultPath.length; roundIndex += 1) {
    await assertScreenReady(page, "当前回合", `进入第 ${roundIndex + 1} 回合`);
    await assertCompactStatCards(page, "当前回合", roundIndex + 1, false);

    const choiceDeltas = page.locator("[data-delta-kind]");
    if ((await choiceDeltas.count()) !== 0) {
      throw new Error(`第 ${roundIndex + 1} 回合选择页提前展示了数值变化`);
    }

    const choiceText = await page.locator(".ms-fixed-choices").innerText();
    if (/[+＋−-]\s*\d/.test(choiceText)) {
      throw new Error(`第 ${roundIndex + 1} 回合选择文案泄露了带符号数值：${choiceText}`);
    }

    await assertChoiceIcons(page, roundIndex + 1);
    await assertNeutralChoices(page, roundIndex + 1);
    await assertShortViewportChoices(page, roundIndex + 1);

    const selectedIndex = resultPath[roundIndex];
    const selectedRoundText = await page.locator(".ms-fixed-choice").nth(selectedIndex).innerText();
    await page.locator(".ms-fixed-choice").nth(selectedIndex).click();
    await assertScreenReady(page, "选择反馈", `第 ${roundIndex + 1} 回合选择反馈`);
    await assertCompactStatCards(page, "选择反馈", roundIndex + 1, true);
    await assertDeltaDisclosure(page, roundIndex + 1);
    await assertSettlementWithoutNextEvent(page, roundIndex + 1);

    const feedbackDescription = (await page.locator(".ms-fixed-feedback-message h2").innerText()).trim();
    if (!feedbackDescription || selectedRoundText.includes(feedbackDescription)) {
      throw new Error(`第 ${roundIndex + 1} 回合没有在反馈页延迟揭示结果文案`);
    }
    const selectedFeedbackIcon = await page.locator("[data-fixed-choice-icon]").getAttribute("data-fixed-choice-icon");
    if (selectedFeedbackIcon !== expectedChoiceIconsByRound[roundIndex][selectedIndex]) {
      throw new Error(`第 ${roundIndex + 1} 回合反馈图标没有跟随 selectedChoice.visual`);
    }

    const continueLabel = roundIndex === resultPath.length - 1 ? "查看结果" : "继续";
    const continueAction = await getVisibleAction(page, continueLabel, `${continueLabel}（固定操作）`);
    await assertButtonInViewport(page, continueAction, `第 ${roundIndex + 1} 回合${continueLabel}按钮`);
    await continueAction.click();

    if (roundIndex === resultPath.length - 1) {
      await assertScreenReady(page, "结果分享卡", "进入结果页");
      await assertResultStatOrder(page);
      await page.getByText("今日结局：体面下班", { exact: true }).waitFor();
      const keyChoice = await page.getByLabel("关键一手", { exact: true }).innerText();
      const resultText = await page.getByLabel("结果分享卡").innerText();
      if (!keyChoice.includes("去露个脸") || /\d+%|玩家/.test(resultText) || resultText.includes("本周")) {
        throw new Error(`结果页关键一手或真实性边界错误：${keyChoice}`);
      }

      const resultCopyLayout = await page.evaluate(() => {
        const subtitle = document.querySelector(".ms-fixed-result-ending__subtitle");
        const quote = document.querySelector(".ms-fixed-result-ending__quote");
        const description = document.querySelector(".ms-fixed-result-ending__description");
        const keyChoiceCopy = document.querySelector(".ms-fixed-result-key-choice p");
        const lineState = (element) => element
          ? {
              clientHeight: element.clientHeight,
              lineHeight: Number.parseFloat(getComputedStyle(element).lineHeight),
              scrollHeight: element.scrollHeight
            }
          : null;

        return {
          description: lineState(description),
          keyChoice: lineState(keyChoiceCopy),
          labelCount: document.querySelectorAll(".ms-fixed-result-ending__label").length,
          quote: lineState(quote),
          quoteGap: subtitle && quote
            ? quote.getBoundingClientRect().top - subtitle.getBoundingClientRect().bottom
            : -1
        };
      });
      const isSingleLine = (state) => state
        && state.clientHeight <= state.lineHeight + 1
        && state.scrollHeight <= state.clientHeight + 1;
      if (resultCopyLayout.labelCount !== 0
        || resultCopyLayout.quoteGap < 23
        || !isSingleLine(resultCopyLayout.quote)
        || !isSingleLine(resultCopyLayout.description)
        || !isSingleLine(resultCopyLayout.keyChoice)) {
        throw new Error(`结果页精简文案没有保持预期布局：${JSON.stringify(resultCopyLayout)}`);
      }
      await assertResultActions(page);
      const saveAction = await getVisibleAction(page, "生成我的周一战报", "生成我的周一战报（固定操作）");
      await assertButtonInViewport(page, saveAction, "结果页生成周一战报按钮");
    }
  }
}

async function checkXhsResult(page) {
  const forbiddenSelector = 'a[target="_blank"], a[download], iframe, object, embed, form';
  if ((await page.locator(forbiddenSelector).count()) !== 0) {
    throw new Error("XHS 页面仍包含新窗口、下载、嵌入或表单入口");
  }

  if ((await page.getByText("挑战一个同事", { exact: true }).count()) !== 0 || (await page.getByText("下载图片", { exact: true }).count()) !== 0) {
    throw new Error("XHS 结果页仍包含分享或下载入口");
  }

  const saveAction = await getVisibleAction(page, "生成我的周一战报", "生成我的周一战报（固定操作）");
  await assertButtonInViewport(page, saveAction, "结果页生成周一战报按钮");
  await saveAction.click();
  const poster = page.getByAltText("可保存的周一战报");
  await poster.waitFor();
  await assertAtTop(page, "打开结果图弹层");

  const posterState = await poster.evaluate((image) => ({
    naturalHeight: image instanceof HTMLImageElement ? image.naturalHeight : 0,
    naturalWidth: image instanceof HTMLImageElement ? image.naturalWidth : 0,
    src: image instanceof HTMLImageElement ? image.src.slice(0, 64) : ""
  }));

  if (!posterState.src.startsWith("data:image/png;base64,iVBORw0K")) {
    throw new Error(`结果海报不是 PNG data URL：${JSON.stringify(posterState)}`);
  }

  if (posterState.naturalWidth !== 853 || posterState.naturalHeight !== 1844) {
    throw new Error(`结果海报尺寸异常：${JSON.stringify(posterState)}`);
  }

  const viewport = page.viewportSize();
  const closeButton = page.getByLabel("关闭周一战报");
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "关闭周一战报");
  const closeBox = await closeButton.boundingBox();
  const posterBox = await poster.boundingBox();

  if (!viewport || !closeBox || closeBox.width < 44 || closeBox.height < 44 || closeBox.y < 0 || closeBox.y + closeBox.height > viewport.height) {
    throw new Error(`结果图关闭按钮不在视口内：${JSON.stringify({ closeBox, viewport })}`);
  }

  if (!viewport || !posterBox || posterBox.y < 0 || posterBox.y >= viewport.height) {
    throw new Error(`结果海报顶部不在视口内：${JSON.stringify({ posterBox, viewport })}`);
  }

  const modalState = await page.evaluate(() => ({
    activeLabel: document.activeElement?.getAttribute("aria-label") ?? "",
    underlayInert: document.querySelector(".ms-fixed-result-underlay")?.hasAttribute("inert") ?? false
  }));
  if (modalState.activeLabel !== "关闭周一战报" || !modalState.underlayInert) {
    throw new Error(`XHS 战报弹层焦点或 inert 错误：${JSON.stringify(modalState)}`);
  }

  await page.getByText("周一战报已生成，请长按图片或使用系统截图保存。", { exact: true }).waitFor();
  await page.getByText("长按图片或使用系统截图保存", { exact: true }).waitFor();

  if ((await page.locator(forbiddenSelector).count()) !== 0
    || (await page.getByText("挑战一个同事", { exact: true }).count()) !== 0
    || (await page.getByText("下载图片", { exact: true }).count()) !== 0) {
    throw new Error("XHS 海报弹层暴露了下载或分享入口");
  }

  await page.keyboard.press("Escape");
  await poster.waitFor({ state: "hidden" });
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "生成我的周一战报");
  const focusAfterEscape = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? "");
  if (focusAfterEscape !== "生成我的周一战报") {
    throw new Error(`Escape 关闭后焦点未恢复：${focusAfterEscape}`);
  }

  await saveAction.click();
  await poster.waitFor();
  await page.locator(".ms-fixed-result-poster-modal").click({ position: { x: 4, y: 4 } });
  await poster.waitFor({ state: "hidden" });
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "生成我的周一战报");
  const focusAfterBackdrop = await page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? "");
  if (focusAfterBackdrop !== "生成我的周一战报") {
    throw new Error(`遮罩关闭后焦点未恢复：${focusAfterBackdrop}`);
  }

  await saveAction.click();
  await poster.waitFor();
  await closeButton.click();
  await poster.waitFor({ state: "hidden" });
  await assertAtTop(page, "关闭周一战报弹层");

  if ((await page.getByText("周一战报已生成，请长按图片或使用系统截图保存。", { exact: true }).count()) !== 0) {
    throw new Error("关闭周一战报后仍残留已生成状态");
  }

  const restartAction = await getVisibleAction(page, "换条路线再试一次", "换条路线再试一次（固定操作）");
  await assertButtonInViewport(page, restartAction, "结果页再玩一次按钮");
  await restartAction.click();
  await assertScreenReady(page, "当前回合", "重新开始");
  if ((await page.getByRole("dialog", { name: introCopy.title, exact: true }).count()) !== 0) {
    throw new Error("换路线重玩后重复出现首次引导");
  }
}

async function launchBrowser() {
  return chromium.launch({ headless: true });
}

async function checkStaticIntro(browser) {
  const context = await createTestContext(browser, { viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const introURL = new URL(baseURL);
  introURL.searchParams.set("screen", "intro");

  try {
    await page.goto(introURL.href, { waitUntil: "load" });
    await assertIntroCopy(page);
    await page.getByRole("button", { name: introCopy.start, exact: true }).click();
    await assertScreenReady(page, "当前回合", "静态 intro 入口开始");

    const marker = await page.evaluate((key) => localStorage.getItem(key), introStorageKey);
    if (marker !== null) {
      throw new Error(`静态 intro 入口不应写入首次访问标记：${marker}`);
    }
  } finally {
    await context.close();
  }
}

async function checkStorageFailureFallback(browser) {
  const context = await createTestContext(browser, { viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error("simulated localStorage read failure");
    };
    Storage.prototype.setItem = () => {
      throw new Error("simulated localStorage write failure");
    };
  });
  const page = await context.newPage();

  try {
    await page.goto(baseURL, { waitUntil: "load" });
    await assertIntroCopy(page);
    await page.getByRole("button", { name: introCopy.start, exact: true }).click();
    await assertScreenReady(page, "当前回合", "localStorage 异常降级");
  } finally {
    await context.close();
  }
}

async function checkNegativePerformanceDirection(browser) {
  const context = await createTestContext(browser, { viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  try {
    await page.goto(baseURL, { waitUntil: "load" });
    await assertIntroCopy(page);
    await page.getByRole("button", { name: introCopy.start, exact: true }).click();
    await page.locator(".ms-fixed-choice").nth(1).click();
    await assertScreenReady(page, "选择反馈", "负绩效选择反馈");

    const performanceCard = page.locator('.ms-fixed-feedback-stat[data-stat-kind="score"]');
    const performanceLabel = await performanceCard.getAttribute("aria-label");
    if (!performanceLabel?.startsWith("绩效 -18")) {
      throw new Error(`负绩效选择没有保留真实数值：${performanceLabel}`);
    }
    await assertPerformanceMeterDirection(
      performanceCard.locator(".ms-fixed-feedback-stat__bar"),
      -18,
      "负绩效反馈"
    );
  } finally {
    await context.close();
  }
}

async function run() {
  const server = await ensureServer();
  let browser;
  const failures = [];

  try {
    browser = await launchBrowser();
    await checkStaticIntro(browser);
    await checkStorageFailureFallback(browser);
    await checkNegativePerformanceDirection(browser);

    for (const viewport of viewports) {
      const context = await createTestContext(browser, {
        deviceScaleFactor: 1,
        hasTouch: true,
        isMobile: true,
        serviceWorkers: "block",
        viewport: { width: viewport.width, height: viewport.height }
      });
      const page = await context.newPage();
      const runtimeErrors = [];
      const externalRequests = [];
      const failedResponses = [];
      const sameOriginRequests = [];

      page.on("console", (message) => {
        if (message.type() === "error") {
          runtimeErrors.push(message.text());
        }
      });
      page.on("pageerror", (error) => runtimeErrors.push(error.message));
      page.on("request", (request) => {
        const requestUrl = request.url();

        if (requestUrl.startsWith("data:") || requestUrl.startsWith("blob:")) {
          return;
        }

        if (new URL(requestUrl).origin !== base.origin) {
          externalRequests.push(requestUrl);
        } else {
          sameOriginRequests.push(requestUrl);
        }
      });
      page.on("response", (response) => {
        if (response.status() >= 400) {
          failedResponses.push(`${response.status()} ${response.url()}`);
        }
      });

      try {
        await page.goto(baseURL, { waitUntil: "load" });
        await startFirstVisit(page);
        await assertNoViewportOverflow(page, viewport.name);
        await playToResult(page);
        await assertNoViewportOverflow(page, viewport.name);
        await checkXhsResult(page);

        if (runtimeErrors.length > 0) {
          failures.push(
            `${viewport.name} 控制台错误：\n${runtimeErrors.join("\n")}\n同源请求清单：\n${sameOriginRequests.join("\n") || "（无）"}`
          );
        }
        if (externalRequests.length > 0) {
          failures.push(`${viewport.name} 外部请求：\n${externalRequests.join("\n")}`);
        }
        if (failedResponses.length > 0) {
          failures.push(`${viewport.name} HTTP 失败响应：\n${failedResponses.join("\n")}`);
        }

        console.log(`通过 ${viewport.name}：5 回合、结果页与 853x1844 海报`);
      } finally {
        await context.close();
      }
    }
  } finally {
    try {
      await browser?.close();
    } finally {
      await stopServer(server);
    }
  }

  if (failures.length > 0) {
    throw new Error(failures.join("\n\n"));
  }

  if (await isServerReady()) {
    throw new Error("验收结束后 preview 服务仍在运行");
  }

  console.log("XHS H5 检查通过；3 个移动视口串行完成，preview 服务已清理并确认退出。");
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
