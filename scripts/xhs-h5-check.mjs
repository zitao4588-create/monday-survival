import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import path from "node:path";

const baseURL = process.env.MS_XHS_BASE_URL ?? "http://127.0.0.1:5322";
const base = new URL(baseURL);
const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
const viewports = [
  { width: 375, height: 667, name: "small-iphone" },
  { width: 390, height: 844, name: "modern-iphone" },
  { width: 426, height: 922, name: "target-stage" },
  { width: 616, height: 740, name: "codex-sidebar", hasTouch: false, isMobile: false }
];
const resultPath = [0, 2, 0, 1, 0];
const eventTitles = ["闹钟第三次响起", "通勤路上", "周会突然加长", "下午低电量", "下班前最后一击"];
const expectedRoundStatOrder = ["energy", "mood", "score"];
const expectedResultStatOrder = ["score", "energy", "mood"];

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
    return undefined;
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

  await waitForServer(true);
  return server;
}

async function stopServer(server) {
  if (!server) {
    return;
  }

  server.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Vite preview 进程未能及时退出")), 5_000))
  ]);
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

  const background = screen.locator(".ms-claude-bg").first();
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
  const revealedDeltas = page.locator(".ms-claude-delta-tag");
  if ((await revealedDeltas.count()) !== 3) {
    throw new Error(`第 ${roundNumber} 回合反馈页没有恰好公布 3 项变化`);
  }

  const states = await revealedDeltas.evaluateAll((elements) => elements.map((element) => ({
    label: element.getAttribute("aria-label") ?? "",
    text: element.textContent?.trim() ?? ""
  })));

  for (const state of states) {
    const value = state.text.slice(1);
    const isAccessibleIncrease = state.text.startsWith("+") && state.label.includes("增加") && state.label.endsWith(value);
    const isAccessibleDecrease = state.text.startsWith("-") && state.label.includes("减少") && state.label.endsWith(value);
    const isAccessibleNoChange = state.text === "0" && state.label.endsWith("不变");

    if (!isAccessibleIncrease && !isAccessibleDecrease && !isAccessibleNoChange) {
      throw new Error(`第 ${roundNumber} 回合变化值缺少一致的方向与辅助说明：${JSON.stringify(state)}`);
    }
  }

  const statusSummary = page.locator('[role="status"]');
  if ((await statusSummary.count()) !== 1 || !(await statusSummary.innerText()).includes("能量")) {
    throw new Error(`第 ${roundNumber} 回合缺少可访问的变化汇总`);
  }

  const visualStates = await revealedDeltas.evaluateAll((elements) => elements.map((element) => ({
    className: element.className,
    text: element.textContent?.trim() ?? ""
  })));

  for (const state of visualStates) {
    const expectedTone = state.text.startsWith("+")
      ? "ms-claude-delta-tag--positive"
      : state.text.startsWith("-")
        ? "ms-claude-delta-tag--negative"
        : "ms-claude-delta-tag--neutral";

    if (!state.className.includes(expectedTone)) {
      throw new Error(`第 ${roundNumber} 回合变化值颜色类错误：${JSON.stringify(state)}`);
    }
  }
}

async function assertCompactStatCards(page, screenLabel, roundNumber, expectDeltas) {
  const screen = page.getByLabel(screenLabel, { exact: true });
  const cards = screen.locator(".ms-claude-stat-card");
  const states = await cards.evaluateAll((elements) => elements.map((element) => ({
    deltaKind: element.querySelector("[data-delta-kind]")?.getAttribute("data-delta-kind") ?? "",
    kind: element.getAttribute("data-stat-kind") ?? ""
  })));

  if (JSON.stringify(states.map((state) => state.kind)) !== JSON.stringify(expectedRoundStatOrder)) {
    throw new Error(`${screenLabel}第 ${roundNumber} 回合统计卡顺序错误：${JSON.stringify(states)}`);
  }

  const bars = screen.locator(".ms-claude-stat-bar");
  if ((await bars.count()) !== 3) {
    throw new Error(`${screenLabel}第 ${roundNumber} 回合没有恰好显示 3 条七段进度条`);
  }

  for (let index = 0; index < 3; index += 1) {
    if ((await bars.nth(index).locator("img").count()) !== 7) {
      throw new Error(`${screenLabel}第 ${roundNumber} 回合第 ${index + 1} 张统计卡不是七段进度条`);
    }
  }

  const scoreTwelve = screen.locator('.ms-claude-stat-card[data-stat-kind="score"][aria-label="得分 12/100"]');
  if ((await scoreTwelve.count()) === 1
    && (await scoreTwelve.locator(".ms-claude-stat-bar img.is-filled").count()) !== 2) {
    throw new Error(`${screenLabel}第 ${roundNumber} 回合得分 12 没有显示为 2/7 段`);
  }

  const deltaKinds = states.map((state) => state.deltaKind);
  if (expectDeltas && JSON.stringify(deltaKinds) !== JSON.stringify(expectedRoundStatOrder)) {
    throw new Error(`${screenLabel}第 ${roundNumber} 回合 delta 未附在对应统计卡下：${JSON.stringify(states)}`);
  }

  if (!expectDeltas && deltaKinds.some(Boolean)) {
    throw new Error(`${screenLabel}第 ${roundNumber} 回合选择阶段提前显示 delta：${JSON.stringify(states)}`);
  }
}

async function assertRoundTwoRulesFlow(page) {
  const metrics = await page.evaluate(() => {
    const body = document.querySelector(".ms-claude-event-body")?.getBoundingClientRect();
    const rules = document.querySelector(".ms-claude-event-rules")?.getBoundingClientRect();
    const choices = document.querySelector(".ms-claude-choice-list")?.getBoundingClientRect();

    return body && rules && choices
      ? {
          bodyBottom: body.bottom,
          choicesTop: choices.top,
          rulesBottom: rules.bottom,
          rulesTop: rules.top
        }
      : null;
  });

  if (!metrics
    || !(metrics.bodyBottom < metrics.rulesTop
      && metrics.rulesTop < metrics.rulesBottom
      && metrics.rulesBottom < metrics.choicesTop)) {
    throw new Error(`第二回合正文、横杠与选项顺序错误：${JSON.stringify(metrics)}`);
  }
}

async function assertOriginalFeedbackButton(page, roundNumber) {
  const result = await page.evaluate(() => {
    const stage = document.querySelector(".ms-claude-stage")?.getBoundingClientRect();
    const buttonElement = document.querySelector(".ms-claude-feedback-button");
    const button = buttonElement?.getBoundingClientRect();
    const backgrounds = [...document.querySelectorAll(".ms-claude-screen--feedback .ms-claude-bg")];
    const cover = document.querySelector(".ms-claude-bg--feedback-preview-cover");

    if (!stage || !button || !(buttonElement instanceof HTMLButtonElement) || !(cover instanceof HTMLImageElement)) {
      return null;
    }

    const scale = stage.width / 426.5;
    return {
      backgroundSizes: backgrounds.map((background) => background instanceof HTMLImageElement
        ? [background.naturalWidth, background.naturalHeight]
        : [0, 0]),
      backgroundSources: backgrounds.map((background) => background instanceof HTMLImageElement
        ? background.currentSrc
        : ""),
      buttonChildImages: buttonElement.querySelectorAll("img").length,
      coverClipPath: getComputedStyle(cover).clipPath,
      height: button.height / scale,
      left: (button.left - stage.left) / scale,
      top: (button.top - stage.top) / scale,
      width: button.width / scale
    };
  });

  const closeTo = (value, expected) => Math.abs(value - expected) <= 1.5;
  if (!result
    || result.buttonChildImages !== 0
    || result.backgroundSizes.length !== 2
    || result.backgroundSizes.some(([width, height]) => width !== 853 || height !== 1844)
    || !result.backgroundSources.some((source) => source.includes("bg-feedback-clean-2x"))
    || !result.backgroundSources.some((source) => source.includes("bg-feedback-no-preview-2x"))
    || result.coverClipPath !== "inset(594px 0px 154px)"
    || !closeTo(result.left, 62.5)
    || !closeTo(result.top, 770)
    || !closeTo(result.width, 300)
    || !closeTo(result.height, 82)) {
    throw new Error(`第 ${roundNumber} 回合继续按钮点击热区位置错误：${JSON.stringify(result)}`);
  }
}

async function assertResultStatOrder(page) {
  const order = await page.locator(".ms-claude-result-num").evaluateAll((elements) => elements.map((element) => {
    if (element.classList.contains("ms-claude-result-num--score")) return "score";
    if (element.classList.contains("ms-claude-result-num--energy")) return "energy";
    if (element.classList.contains("ms-claude-result-num--mood")) return "mood";
    return "";
  }));

  if (JSON.stringify(order) !== JSON.stringify(expectedResultStatOrder)) {
    throw new Error(`结果页统计顺序被改动：${JSON.stringify(order)}`);
  }
}

async function assertChoiceIcons(page, roundNumber) {
  const icons = await page.locator(".ms-claude-choice-ticket [data-choice-icon]").evaluateAll((elements) => (
    elements.map((element) => element.getAttribute("data-choice-icon") ?? "")
  ));

  if (icons.length !== 3 || new Set(icons).size !== 3 || icons.includes("check") || icons.some((icon) => !icon)) {
    throw new Error(`第 ${roundNumber} 回合选项图标不完整、重复或含对勾：${JSON.stringify(icons)}`);
  }

  return icons;
}

async function assertNoNextEventPreview(page, roundNumber) {
  if ((await page.getByText("下一事件预告", { exact: true }).count()) !== 0) {
    throw new Error(`第 ${roundNumber} 回合仍展示下一事件预告标题`);
  }

  if ((await page.locator(".ms-claude-next-chip, .ms-claude-next-title, .ms-claude-next-body").count()) !== 0) {
    throw new Error(`第 ${roundNumber} 回合仍包含旧下一事件 DOM`);
  }

  const nextTitle = eventTitles[roundNumber];
  if (nextTitle && (await page.getByText(nextTitle, { exact: true }).count()) !== 0) {
    throw new Error(`第 ${roundNumber} 回合提前泄露下一事件内容：${nextTitle}`);
  }

  await page.getByLabel(roundNumber === resultPath.length ? "本局结算" : "本回合结算", { exact: true }).waitFor();
}

async function playToResult(page) {
  const observedChoiceIcons = [];

  for (let roundIndex = 0; roundIndex < resultPath.length; roundIndex += 1) {
    await assertScreenReady(page, "当前回合", `进入第 ${roundIndex + 1} 回合`);
    await assertCompactStatCards(page, "当前回合", roundIndex + 1, false);

    if (roundIndex === 1) {
      await assertRoundTwoRulesFlow(page);
    }

    const choiceDeltas = page.locator(".ms-claude-choice-delta, .ms-claude-choice-ticket__deltas");
    if ((await choiceDeltas.count()) !== 0) {
      throw new Error(`第 ${roundIndex + 1} 回合选择页提前展示了数值变化`);
    }

    const choiceText = await page.locator(".ms-claude-choice-list").innerText();
    if (/[+＋−-]\s*\d/.test(choiceText)) {
      throw new Error(`第 ${roundIndex + 1} 回合选择文案泄露了带符号数值：${choiceText}`);
    }

    observedChoiceIcons.push(...await assertChoiceIcons(page, roundIndex + 1));

    await page.locator(".ms-claude-choice-ticket").nth(resultPath[roundIndex]).click();
    await assertScreenReady(page, "选择反馈", `第 ${roundIndex + 1} 回合选择反馈`);
    await assertCompactStatCards(page, "选择反馈", roundIndex + 1, true);
    await assertDeltaDisclosure(page, roundIndex + 1);
    await assertOriginalFeedbackButton(page, roundIndex + 1);
    await assertNoNextEventPreview(page, roundIndex + 1);

    if (roundIndex === resultPath.length - 1) {
      await page.getByText("本局结算", { exact: true }).waitFor();
    }

    await page.getByLabel("继续").click();

    if (roundIndex === resultPath.length - 1) {
      await assertScreenReady(page, "结果分享卡", "进入结果页");
      await assertResultStatOrder(page);
    }
  }

  if (observedChoiceIcons.length !== 15 || new Set(observedChoiceIcons).size !== 15) {
    throw new Error(`完整流程没有展示 15 个互不重复的语义图标：${JSON.stringify(observedChoiceIcons)}`);
  }
}

async function checkXhsResult(page) {
  if ((await page.locator('a[target="_blank"], a[download], iframe').count()) !== 0) {
    throw new Error("XHS 页面仍包含新窗口链接、下载入口或 iframe");
  }

  if ((await page.getByText("分享文案", { exact: true }).count()) !== 0 || (await page.getByText("下载图片", { exact: true }).count()) !== 0) {
    throw new Error("XHS 结果页仍包含分享文案或下载图片入口");
  }

  await page.getByLabel("生成结果图").click();
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

  await page.getByText("结果图已生成，请长按图片或使用系统截图保存。").waitFor();
  await page.getByText("长按图片或使用系统截图保存", { exact: true }).waitFor();

  await page.getByLabel("关闭结果图").click();
  await poster.waitFor({ state: "hidden" });
  await assertAtTop(page, "关闭结果图弹层");

  await page.getByLabel("再活一次周一").click();
  await assertScreenReady(page, "当前回合", "重新开始");
}

async function launchBrowser() {
  try {
    return await chromium.launch();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!/executable doesn't exist/i.test(message)) {
      throw error;
    }

    return chromium.launch({ channel: "chrome" });
  }
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
        hasTouch: viewport.hasTouch ?? true,
        isMobile: viewport.isMobile ?? true,
        serviceWorkers: "block",
        viewport
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
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
