import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import path from "node:path";

const baseURL = process.env.MS_XHS_BASE_URL ?? "http://127.0.0.1:5322";
const base = new URL(baseURL);
const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
const viewports = [
  { width: 375, height: 667, name: "small-iphone" },
  { width: 390, height: 844, name: "modern-iphone" },
  { width: 426, height: 922, name: "target-stage" }
];
const resultPath = [0, 2, 0, 1, 0];
const expectedPerformanceAtRoundStart = [0, 12, 32, 50, 54];
const expectedPerformanceAfterRound = [12, 32, 50, 54, 72];
const forbiddenFutureEventTextByRound = [
  ["09:11", "通勤路上", "地铁很挤，老板发来一句：到了聊一下。门关上，你的灵魂先迟到了。"],
  ["10:30", "周会突然加长", "每个人都说“我简单讲两句”。投影仪都开始怀疑人生。"],
  ["15:07", "下午低电量", "三个需求、两个催促和一份“很快就好”的文档同时敲门。"],
  ["18:46", "下班前最后一击", "有人说：这个能不能今天顺手改一下？顺手两个字最不顺手。"]
];
const expectedRoundStatOrder = ["energy", "mood", "score"];
const expectedResultStatOrder = ["score", "energy", "mood"];
const expectedChoiceIconsByRound = [
  ["shower-head", "smartphone", "coffee"],
  ["message-square-reply", "eye-off", "notebook-pen"],
  ["notebook-text", "message-circle-warning", "power"],
  ["panels-top-left", "sandwich", "list-filter"],
  ["calendar-clock", "laptop", "door-open"]
];

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

async function assertNoHorizontalOverflow(page, viewportName) {
  const metrics = await page.evaluate(() => ({
    bodyScrollWidth: document.body.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    docScrollWidth: document.documentElement.scrollWidth
  }));
  const overflow = Math.max(metrics.bodyScrollWidth, metrics.docScrollWidth) - metrics.clientWidth;

  if (overflow > 1) {
    throw new Error(`${viewportName} 存在横向溢出：${JSON.stringify(metrics)}`);
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

  const statusSummary = page.locator('.ms-fixed-feedback-message [role="status"]');
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
  const expectedFilledCount = performanceValue <= 0
    ? 0
    : Math.max(2, Math.ceil((Math.min(100, performanceValue) / 100) * 7));
  const performanceBar = performanceCard.locator(expectDeltas ? ".ms-fixed-feedback-stat__bar" : ".ms-fixed-stat__bar");

  if (!performanceMatch
    || performanceLabel?.includes("/100")
    || performanceValue !== expectedPerformance
    || (await performanceBar.locator("span").count()) !== 7
    || (await performanceBar.locator(".is-filled").count()) !== expectedFilledCount) {
    throw new Error(`${screenLabel}第 ${roundNumber} 回合绩效值或七段条错误：${performanceLabel}`);
  }

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
    throw new Error(`第 ${roundNumber} 回合语义图标错误：${JSON.stringify(icons)}`);
  }

  const renderedIcons = await page.locator(".ms-fixed-choice [data-choice-icon]").evaluateAll((elements) => (
    elements.map((element) => element.getAttribute("data-choice-icon") ?? "")
  ));
  if (JSON.stringify(renderedIcons) !== JSON.stringify(expectedIcons)) {
    throw new Error(`第 ${roundNumber} 回合 Lucide 图标没有按 turns 数据渲染：${JSON.stringify(renderedIcons)}`);
  }

  return icons;
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

  if (roundNumber < resultPath.length) {
    await page.getByLabel("本回合结算", { exact: true }).waitFor();
    await page.getByText("状态已更新", { exact: true }).waitFor();
    if ((await feedbackScreen.locator(".ms-fixed-feedback-next time, .ms-fixed-feedback-next__visual").count()) !== 0) {
      throw new Error(`第 ${roundNumber} 回合结算仍包含下一事件时间或插画`);
    }
    await page.getByLabel("继续", { exact: true }).waitFor();
    return;
  }

  await page.getByText("本周结算", { exact: true }).waitFor();
  await page.getByLabel("查看结果", { exact: true }).waitFor();
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

    if (page.viewportSize()?.height === 667) {
      const hint = page.getByText("上滑查看全部选项 ↑", { exact: true });
      await hint.waitFor({ state: "visible" });
      await page.evaluate(() => window.scrollTo(0, 20));
      await hint.waitFor({ state: "hidden" });
      await page.evaluate(() => window.scrollTo(0, 0));
    }

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
      const saveAction = await getVisibleAction(page, "生成结果图", "保存结果图（固定操作）");
      await assertButtonInViewport(page, saveAction, "结果页保存结果图按钮");
    }
  }
}

async function checkXhsResult(page) {
  const forbiddenSelector = 'a[target="_blank"], a[download], iframe, object, embed, form';
  if ((await page.locator(forbiddenSelector).count()) !== 0) {
    throw new Error("XHS 页面仍包含新窗口、下载、嵌入或表单入口");
  }

  if ((await page.getByText("分享文案", { exact: true }).count()) !== 0 || (await page.getByText("下载图片", { exact: true }).count()) !== 0) {
    throw new Error("XHS 结果页仍包含分享文案或下载图片入口");
  }

  const saveAction = await getVisibleAction(page, "生成结果图", "保存结果图（固定操作）");
  await assertButtonInViewport(page, saveAction, "结果页保存结果图按钮");
  await saveAction.click();
  const poster = page.getByAltText("可保存的周一结果图");
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
  const closeBox = await page.getByLabel("关闭结果图").boundingBox();
  const posterBox = await poster.boundingBox();

  if (!viewport || !closeBox || closeBox.y < 0 || closeBox.y + closeBox.height > viewport.height) {
    throw new Error(`结果图关闭按钮不在视口内：${JSON.stringify({ closeBox, viewport })}`);
  }

  if (!viewport || !posterBox || posterBox.y < 0 || posterBox.y >= viewport.height) {
    throw new Error(`结果海报顶部不在视口内：${JSON.stringify({ posterBox, viewport })}`);
  }

  await page.getByText("结果图已生成，请长按图片或使用系统截图保存。", { exact: true }).waitFor();
  await page.getByText("长按图片或使用系统截图保存", { exact: true }).waitFor();

  if ((await page.locator(forbiddenSelector).count()) !== 0
    || (await page.getByText("分享文案", { exact: true }).count()) !== 0
    || (await page.getByText("下载图片", { exact: true }).count()) !== 0) {
    throw new Error("XHS 海报弹层暴露了下载或分享入口");
  }

  await page.getByLabel("关闭结果图", { exact: true }).click();
  await poster.waitFor({ state: "hidden" });
  await assertAtTop(page, "关闭结果图弹层");

  if ((await page.getByText("结果图已生成，请长按图片或使用系统截图保存。", { exact: true }).count()) !== 0) {
    throw new Error("关闭结果图后仍残留已生成状态");
  }

  const restartAction = await getVisibleAction(page, "再活一次周一", "再活一次周一（固定操作）");
  await assertButtonInViewport(page, restartAction, "结果页再玩一次按钮");
  await restartAction.click();
  await assertScreenReady(page, "当前回合", "重新开始");
}

async function launchBrowser() {
  return chromium.launch({ headless: true });
}

async function run() {
  const server = await ensureServer();
  let browser;
  const failures = [];

  try {
    browser = await launchBrowser();

    for (const viewport of viewports) {
      const context = await browser.newContext({
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
        await page.getByLabel("当前回合").waitFor();
        await assertNoHorizontalOverflow(page, viewport.name);
        await playToResult(page);
        await assertNoHorizontalOverflow(page, viewport.name);
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
