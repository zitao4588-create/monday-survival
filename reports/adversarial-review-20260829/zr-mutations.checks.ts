// ZCode 对抗性审查 —— 变异用例 1/2/4/6/7（localStorage 变异、存储异常、AudioContext 变异、
// ISO 周年界与周切矩阵、回响多标签冲突）+ AR-01 内容 schema 深检 + AR-11 单元级一致性。
// 只读验证：不修改任何产品文件；结论写入审查报告。
import { describe, expect, it } from "vitest";
import { mondayTurnPeriods, mondayTurnPools } from "../src/data/turns";
import { applyChoice, applyTurnEcho, createGameProgress, getOutcome } from "../src/gameCore";
import { getNaturalWeekSelection } from "../src/weeklyTurns";
import {
  LOCAL_HISTORY_LIMIT,
  LOCAL_HISTORY_STORAGE_KEY,
  clearLocalHistory,
  formatLocalHistoryDate,
  readLocalHistory,
  readSoundEnabled,
  saveLocalHistoryEntry,
  writeSoundEnabled,
  type LocalHistoryEntry,
  type LocalStorageLike
} from "../src/localHistory";
import { createSoundPlayer, type SoundCue } from "../src/sound";
import { PRODUCT_EVENT_NAMES, emitProductEvent } from "../src/productEvents";
import { toResultPresentation } from "../src/resultPresentation";
import { createResultShareText } from "../src/resultShare";
import { mondayPersonaLabels, toResultViewModel } from "../src/gameViewModels";
import { calculateMondayResult, chooseMondayAction, createMondayRun, isMondayRunComplete, mondayTurns } from "../src/game";

const ALLOWED_ICONS = new Set([
  "calendar-clock", "coffee", "door-open", "eye-off", "laptop", "list-filter",
  "message-circle-warning", "message-square-reply", "notebook-pen", "notebook-text",
  "panels-top-left", "power", "sandwich", "shower-head", "smartphone"
]);

function memoryStorage(initial: Map<string, string> = new Map()): LocalStorageLike & { values: Map<string, string> } {
  const values = initial;
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    }
  };
}

function throwingStorage(mode: "getItem" | "setItem" | "removeItem" | "all"): LocalStorageLike {
  const boom = () => {
    throw new Error(`simulated ${mode} failure`);
  };
  return {
    getItem: mode === "getItem" || mode === "all" ? boom : () => null,
    removeItem: mode === "removeItem" || mode === "all" ? boom : () => undefined,
    setItem: mode === "setItem" || mode === "all" ? boom : () => undefined
  };
}

function entry(overrides: Partial<LocalHistoryEntry> = {}): LocalHistoryEntry {
  return {
    date: "2026-08-28",
    energy: 60,
    mood: 98,
    outcome: "体面下班",
    persona: "情绪避险大师",
    score: 56,
    weekKey: "2026-W35",
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// AR-01 内容与 schema（超出产品验证器的深度检查）
// ---------------------------------------------------------------------------
describe("AR-01 内容与 schema 深检", () => {
  const turns = mondayTurnPeriods.flatMap((period) => mondayTurnPools[period]);
  const choices = turns.flatMap((turn) => turn.choices);

  it("15 事件 / 45 选择 / 全局唯一 ID / 每事件恰好 3 选择", () => {
    expect(turns).toHaveLength(15);
    expect(choices).toHaveLength(45);
    expect(new Set(turns.map((t) => t.id)).size).toBe(15);
    expect(new Set(choices.map((c) => c.id)).size).toBe(45);
    for (const turn of turns) {
      expect(turn.choices, turn.id).toHaveLength(3);
      expect(turn.period, turn.id).toBeTruthy();
    }
  });

  it("文本字段非空且长度在安全范围内（记录最大长度）", () => {
    const maxima = {
      body: 0, description: 0, echoBody: 0, impactSummary: 0, label: 0, preview: 0, title: 0
    };
    for (const turn of turns) {
      expect(turn.title.trim().length, `${turn.id}.title`).toBeGreaterThan(0);
      expect(turn.body.trim().length, `${turn.id}.body`).toBeGreaterThan(0);
      maxima.title = Math.max(maxima.title, [...turn.title].length);
      maxima.body = Math.max(maxima.body, [...turn.body].length);
      for (const echoText of Object.values(turn.echoes ?? {})) {
        expect(echoText.trim().length, `${turn.id} echo`).toBeGreaterThan(0);
        maxima.echoBody = Math.max(maxima.echoBody, [...echoText].length);
      }
      for (const choice of turn.choices) {
        for (const field of ["label", "preview", "description", "impactSummary"] as const) {
          expect(choice[field].trim().length, `${choice.id}.${field}`).toBeGreaterThan(0);
          maxima[field] = Math.max(maxima[field], [...choice[field]].length);
        }
      }
    }
    // 记录实际最大长度，供布局风险评估（不作为失败断言，除非异常巨大）
    expect(maxima.label).toBeLessThanOrEqual(12);
    expect(maxima.title).toBeLessThanOrEqual(24);
    expect(maxima.body).toBeLessThanOrEqual(60);
    expect(maxima.impactSummary).toBeLessThanOrEqual(50);
    expect(maxima.echoBody).toBeLessThanOrEqual(60);
  });

  it("effect 数值有限、icons 全部在受支持集合内、tags 非空且无重复", () => {
    for (const choice of choices) {
      expect(Number.isFinite(choice.effect.scoreDelta), `${choice.id} scoreDelta`).toBe(true);
      expect(Number.isFinite(choice.effect.energyDelta ?? 0), `${choice.id} energyDelta`).toBe(true);
      expect(Number.isFinite(choice.effect.moodDelta ?? 0), `${choice.id} moodDelta`).toBe(true);
      expect(ALLOWED_ICONS.has(choice.visual), `${choice.id} visual ${choice.visual}`).toBe(true);
      expect(choice.tags.length, `${choice.id} tags`).toBeGreaterThan(0);
      expect(new Set(choice.tags).size, `${choice.id} dup tags`).toBe(choice.tags.length);
      for (const tag of choice.tags) {
        expect(tag.trim().length, `${choice.id} tag`).toBeGreaterThan(0);
      }
    }
  });

  it("choice 对象没有 schema 之外的额外字段（运行时对象键白名单）", () => {
    const expectedKeys = ["id", "label", "preview", "description", "impactSummary", "visual", "effect", "tags"].sort();
    for (const choice of choices) {
      expect(Object.keys(choice).sort(), `${choice.id} extra fields`).toEqual(expectedKeys);
      expect(Object.keys(choice.effect).sort(), `${choice.id} effect fields`).toEqual(["energyDelta", "moodDelta", "scoreDelta"]);
    }
  });

  it("echo 键都能由更早时段的真实选择产生，且回响键对在任一前置选择中互斥", () => {
    const periodIndex = new Map(mondayTurnPeriods.map((p, i) => [p, i]));
    const tagsProduced = new Map<string, string[]>(); // tag -> choice ids
    for (const turn of turns) {
      for (const choice of turn.choices) {
        for (const tag of choice.tags) {
          tagsProduced.set(tag, [...(tagsProduced.get(tag) ?? []), choice.id]);
        }
      }
    }
    for (const turn of turns) {
      const echoKeys = Object.keys(turn.echoes ?? {});
      if (echoKeys.length === 0) continue;
      const turnPeriodIndex = periodIndex.get(turn.period)!;
      for (const key of echoKeys) {
        const producers = tagsProduced.get(key) ?? [];
        expect(producers.length, `echo 键 ${key}（${turn.id}）必须由真实选择产生`).toBeGreaterThan(0);
        for (const producerId of producers) {
          const producer = choices.find((c) => c.id === producerId)!;
          const producerTurn = turns.find((t) => t.choices.includes(producer))!;
          expect(
            periodIndex.get(producerTurn.period)! < turnPeriodIndex,
            `echo 键 ${key} 的生产者 ${producerId}（${producerTurn.period}）必须早于 ${turn.period}`
          ).toBe(true);
        }
      }
      // 互斥：任一前置选择不得同时携带两个回响键（同一回合只能选一次）
      expect(echoKeys.length, `${turn.id} echo 键数量`).toBe(2);
      for (const choice of choices) {
        const both = echoKeys.filter((key) => choice.tags.includes(key));
        expect(both.length, `${choice.id} 同时携带互斥回响键 ${echoKeys.join("/")}`).toBeLessThanOrEqual(1);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// AR-02 周种子与时间（变异用例 6）
// ---------------------------------------------------------------------------
describe("AR-02 周种子与时间矩阵", () => {
  // 独立参考实现：civil date 由 Intl 提取；周界与 ISO 周号用完全不同的算法（纯日历算术）
  function refIsoWeek(date: Date, timeZone: string): { weekKey: string; weekStart: string } {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
      .format(date);
    const [yStr, mStr, dStr] = parts.split("-").map((s) => s.trim());
    const y = Number(yStr); const m = Number(mStr); const d = Number(dStr);
    const isLeap = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const daysBefore = (year: number) => (isLeap(year) ? 366 : 365);
    function dayOfYear(year: number, month: number, day: number) {
      const cum = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
      let doy = cum[month - 1] + day;
      if (month > 2 && isLeap(year)) doy += 1;
      return doy;
    }
    // 1970-01-01 是周四；用 (doy + 年首星期) 推星期几
    function weekday(year: number, month: number, day: number) {
      // days since 1970-01-01
      let days = 0;
      if (year >= 1970) {
        for (let yy = 1970; yy < year; yy += 1) days += daysBefore(yy);
      } else {
        for (let yy = 1969; yy >= year; yy -= 1) days -= daysBefore(yy);
      }
      days += dayOfYear(year, month, day) - 1;
      return ((days % 7) + 7 + 4) % 7; // 0=Sunday
    }
    const wd = weekday(y, m, d);
    const mondayShift = (wd + 6) % 7;
    // 回退到本周一（可能跨年，用日历运算）
    let my = y; let mm = m; let md = d - mondayShift;
    const mdays = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();
    while (md < 1) {
      mm -= 1;
      if (mm < 1) { mm = 12; my -= 1; }
      md += mdays(my, mm);
    }
    while (md > mdays(my, mm)) {
      md -= mdays(my, mm);
      mm += 1;
      if (mm > 12) { mm = 1; my += 1; }
    }
    // 周四决定 ISO 周年
    let ty = my; let tm = mm; let td = md + 3;
    while (td > mdays(ty, tm)) {
      td -= mdays(ty, tm);
      tm += 1;
      if (tm > 12) { tm = 1; ty += 1; }
    }
    // ISO W01 = 包含 1 月 4 日的那一周
    const jan4Shift = (weekday(ty, 1, 4) + 6) % 7;
    let w1y = ty; let w1m = 1; let w1d = 4 - jan4Shift;
    while (w1d < 1) {
      w1m -= 1;
      if (w1m < 1) { w1m = 12; w1y -= 1; }
      w1d += mdays(w1y, w1m);
    }
    // 周差
    let weeks = 0;
    // 从 W01 周一数到目标周一
    const toDays = (yy: number, mm2: number, dd: number) => {
      let days = 0;
      for (let yy2 = 1970; yy2 < yy; yy2 += 1) days += daysBefore(yy2);
      days += dayOfYear(yy, mm2, dd) - 1;
      return days;
    };
    weeks = Math.round((toDays(my, mm, md) - toDays(w1y, w1m, w1d)) / 7) + 1;
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
      weekKey: `${ty}-W${pad(weeks)}`,
      weekStart: `${my}-${pad(mm)}-${pad(md)}`
    };
  }

  const matrix: Array<{ instant: string; timeZone: string; note: string }> = [
    { instant: "2026-08-28T12:00:00.000Z", timeZone: "Asia/Shanghai", note: "冻结时钟（既有脚本基准）" },
    { instant: "2026-08-30T15:59:59.999Z", timeZone: "Asia/Shanghai", note: "上海周日 23:59:59.999" },
    { instant: "2026-08-30T16:00:00.000Z", timeZone: "Asia/Shanghai", note: "上海周一 00:00:00" },
    { instant: "2026-08-31T15:59:59.999Z", timeZone: "Asia/Shanghai", note: "次周周日 23:59:59.999" },
    { instant: "2020-12-31T12:00:00.000Z", timeZone: "UTC", note: "2020-12-31 周四（2020-W53）" },
    { instant: "2021-01-01T12:00:00.000Z", timeZone: "UTC", note: "2021-01-01 周五（仍 2020-W53）" },
    { instant: "2021-01-04T00:00:00.000Z", timeZone: "UTC", note: "2021-01-04 周一（2021-W01）" },
    { instant: "2024-12-29T12:00:00.000Z", timeZone: "UTC", note: "2024-12-29 周日（2025-W01 前一天）" },
    { instant: "2024-12-30T00:00:00.000Z", timeZone: "UTC", note: "2024-12-30 周一（2025-W01）" },
    { instant: "2025-12-28T00:00:00.000Z", timeZone: "UTC", note: "2025-12-28 周日（2025-W52）" },
    { instant: "2025-12-29T00:00:00.000Z", timeZone: "UTC", note: "2025-12-29 周一（2026-W01）" },
    { instant: "2026-01-01T00:00:00.000Z", timeZone: "UTC", note: "2026-01-01 周四（2026-W01）" },
    { instant: "2026-12-28T00:00:00.000Z", timeZone: "UTC", note: "2026-12-28 周一（2026-W53，53 周年）" },
    { instant: "2027-01-04T00:00:00.000Z", timeZone: "UTC", note: "2027-01-04 周一（2027-W01）" },
    { instant: "2026-01-04T16:30:00.000Z", timeZone: "Asia/Shanghai", note: "上海已进 1/5（W02）" },
    { instant: "2026-01-04T16:30:00.000Z", timeZone: "America/Los_Angeles", note: "洛杉矶仍是 1/4（W01）" },
    { instant: "2026-01-04T16:30:00.000Z", timeZone: "UTC", note: "UTC 1/4 16:30（W01）" },
    { instant: "2015-12-31T23:59:59.999Z", timeZone: "Pacific/Kiritimati", note: "最东时区 2016-01-01（2016-W01?）" },
    { instant: "2016-01-01T00:00:00.000Z", timeZone: "Pacific/Midway", note: "最西时区仍 2015-12-31（2015-W53）" }
  ];

  it("固定时钟矩阵：weekKey/weekStart 与独立参考实现一致", () => {
    for (const row of matrix) {
      const actual = getNaturalWeekSelection(new Date(row.instant), row.timeZone);
      const expected = refIsoWeek(new Date(row.instant), row.timeZone);
      expect({ weekKey: actual.weekKey, weekStart: actual.weekStart }, `${row.instant} ${row.timeZone} ${row.note}`)
        .toEqual(expected);
    }
  });

  it("关键 ISO 周事实与已知日历事实吻合（独立于两种实现的第三重校验）", () => {
    const known: Array<[string, string, string]> = [
      ["2021-01-01T12:00:00.000Z", "UTC", "2020-W53"],
      ["2024-12-30T00:00:00.000Z", "UTC", "2025-W01"],
      ["2026-12-28T00:00:00.000Z", "UTC", "2026-W53"],
      ["2027-01-04T00:00:00.000Z", "UTC", "2027-W01"],
      ["2026-08-30T16:00:00.000Z", "Asia/Shanghai", "2026-W36"]
    ];
    for (const [instant, timeZone, weekKey] of known) {
      expect(getNaturalWeekSelection(new Date(instant), timeZone).weekKey, `${instant} ${timeZone}`).toBe(weekKey);
    }
  });

  it("周日 23:59:59 与周一 00:00 相邻两周：事件组合稳定且相邻周组合不同", () => {
    const sunday = getNaturalWeekSelection(new Date("2026-08-30T15:59:59.999Z"), "Asia/Shanghai");
    const monday = getNaturalWeekSelection(new Date("2026-08-30T16:00:00.000Z"), "Asia/Shanghai");
    expect(sunday.weekKey).toBe("2026-W35");
    expect(monday.weekKey).toBe("2026-W36");
    expect(monday.eventIndexes.every((index, position) => index !== sunday.eventIndexes[position])).toBe(true);
    // 同一毫秒级重复调用确定性
    for (let i = 0; i < 20; i += 1) {
      expect(getNaturalWeekSelection(new Date("2026-08-30T15:59:59.999Z"), "Asia/Shanghai")).toEqual(sunday);
    }
  });

  it("连续 156 周 weekKey 单调且无碰撞，eventIndexes 始终落在池内", () => {
    const seen = new Set<string>();
    let previousOrdinal = Number.NaN;
    let start = Date.UTC(2024, 0, 1);
    for (let week = 0; week < 156; week += 1) {
      const selection = getNaturalWeekSelection(new Date(start + week * 7 * 86_400_000), "UTC");
      expect(new Set([selection.weekKey]).size).toBe(1);
      expect(seen.has(selection.weekKey), `weekKey 碰撞 ${selection.weekKey}`).toBe(false);
      seen.add(selection.weekKey);
      const ordinal = Math.floor(Date.parse(`${selection.weekStart}T00:00:00Z`) / (7 * 86_400_000));
      if (Number.isFinite(previousOrdinal)) {
        expect(ordinal - previousOrdinal).toBe(1);
      }
      previousOrdinal = ordinal;
      mondayTurnPeriods.forEach((period, index) => {
        const pool = mondayTurnPools[period];
        expect(selection.eventIndexes[index]).toBeGreaterThanOrEqual(0);
        expect(selection.eventIndexes[index]).toBeLessThan(pool.length);
        expect(selection.turns[index].id).toBe(pool[selection.eventIndexes[index]].id);
      });
    }
    expect(seen.size).toBe(156);
  });

  it("观察记录：事件组合向量仅存在 3 种（w, w+2, w+1, w, w+2 模式）", () => {
    const vectors = new Set<string>();
    for (let week = 0; week < 12; week += 1) {
      const selection = getNaturalWeekSelection(new Date(Date.UTC(2026, 0, 5) + week * 7 * 86_400_000), "UTC");
      vectors.add(selection.eventIndexes.join(","));
    }
    // 设计事实：周种子满足"同周固定、跨周变化"，但组合只有 3 周循环。
    expect(vectors.size).toBe(3);
  });

  it("系统时间回拨只改变所选周，不产生崩溃或非法索引", () => {
    const forward = getNaturalWeekSelection(new Date("2026-09-04T12:00:00.000Z"), "Asia/Shanghai");
    const backward = getNaturalWeekSelection(new Date("2026-08-21T12:00:00.000Z"), "Asia/Shanghai");
    expect(forward.eventIndexes.every((v) => v >= 0 && v < 3)).toBe(true);
    expect(backward.eventIndexes.every((v) => v >= 0 && v < 3)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AR-03 跨回合回响（变异用例 7）
// ---------------------------------------------------------------------------
describe("AR-03 跨回合回响", () => {
  const morningEchoEvents = mondayTurnPools.morning.filter((t) => t.echoes);
  const afternoonEchoEvents = mondayTurnPools.afternoon.filter((t) => t.echoes);
  const closingEchoEvents = mondayTurnPools.closing.filter((t) => t.echoes);

  it("三组回响事件全部就位（morning 3 / afternoon 3 / closing 3）", () => {
    expect(morningEchoEvents).toHaveLength(3);
    expect(afternoonEchoEvents).toHaveLength(3);
    expect(closingEchoEvents).toHaveLength(3);
  });

  it("回响只替换正文 body，不改 title/choices/period/id", () => {
    const morning = mondayTurnPools.morning[0];
    const echoed = applyTurnEcho(morning, ["boss-replied"]);
    expect(echoed.body).not.toBe(morning.body);
    expect(echoed.title).toBe(morning.title);
    expect(echoed.id).toBe(morning.id);
    expect(echoed.period).toBe(morning.period);
    expect(echoed.choices).toEqual(morning.choices);
    // 不匹配任何标签时返回原 turn（同一引用）
    expect(applyTurnEcho(morning, ["unrelated-tag"])).toBe(morning);
  });

  it("boss-replied / boss-ignored 分别命中且互斥（对全部 morning 回响事件）", () => {
    for (const event of morningEchoEvents) {
      const keys = Object.keys(event.echoes!);
      expect(keys.sort()).toEqual(["boss-ignored", "boss-replied"]);
      const withReplied = applyTurnEcho(event, ["boss-replied"]);
      const withIgnored = applyTurnEcho(event, ["boss-ignored"]);
      expect(withReplied.body).toBe(event.echoes!["boss-replied"]);
      expect(withIgnored.body).toBe(event.echoes!["boss-ignored"]);
      expect(withReplied.body).not.toBe(withIgnored.body);
      expect(withReplied.body).not.toBe(event.body);
    }
  });

  it("多候选标签同时存在时优先级稳定（Object.keys 插入顺序优先）", () => {
    // 变异用例 7：注入多组回响候选标签 + 冲突标签
    const morning = mondayTurnPools.morning[0];
    const both = applyTurnEcho(morning, ["boss-ignored", "boss-replied"]);
    expect(both.body).toBe(morning.echoes!["boss-replied"]); // 数据中 boss-replied 排在前面
    const reversed = applyTurnEcho(morning, ["boss-replied", "boss-ignored"]);
    expect(reversed.body).toBe(morning.echoes!["boss-replied"]); // 与 tags 顺序无关，稳定
    // 混入后续回合的标签（meeting-firm 等）不影响 morning 回响
    const mixed = applyTurnEcho(morning, ["meeting-firm", "afternoon-push", "boss-ignored"]);
    expect(mixed.body).toBe(morning.echoes!["boss-ignored"]);
    // 三个时段的回响标签同时存在时，各时段各自命中本时段键
    const afternoon = mondayTurnPools.afternoon[0];
    const closing = mondayTurnPools.closing[0];
    const allTags = ["boss-replied", "meeting-firm", "afternoon-refuel", "wake-alert"];
    expect(applyTurnEcho(afternoon, allTags).body).toBe(afternoon.echoes!["meeting-firm"]);
    expect(applyTurnEcho(closing, allTags).body).toBe(closing.echoes!["afternoon-refuel"]);
    expect(applyTurnEcho(morning, allTags).body).toBe(morning.echoes!["boss-replied"]);
  });

  it("回响不污染基础数据（源对象不可变），且跨局标签不残留", () => {
    const morning = mondayTurnPools.morning[0];
    const before = morning.body;
    applyTurnEcho(morning, ["boss-replied"]);
    applyTurnEcho(morning, ["boss-ignored"]);
    expect(morning.body).toBe(before); // 原 turn 未被改写
    // 跨局：restart 后 progress 为全新对象，tags 为空 → 回响不触发
    const run = createMondayRun();
    const commute = mondayTurnPools.commute[0];
    const afterCommute = chooseMondayAction(run, commute.choices[0]);
    expect(afterCommute.tags).toContain("boss-replied");
    const freshRun = createMondayRun(); // restart() 使用的同一入口
    expect(freshRun.tags).toEqual([]);
    expect(applyTurnEcho(morning, freshRun.tags).body).toBe(before);
  });

  it("整局端到端：真实 tags 流经三个回响层且互不串扰", () => {
    // 路线：commute-plan(boss-replied) → meeting-fight(meeting-firm) → afternoon-snack(afternoon-refuel)
    let progress = createMondayRun();
    const commutePlan = mondayTurnPools.commute[0].choices[0];
    const meetingFight = mondayTurnPools.morning[0].choices[1];
    const afternoonSnack = mondayTurnPools.afternoon[0].choices[1];
    progress = chooseMondayAction(progress, commutePlan);
    const morningShown = applyTurnEcho(mondayTurnPools.morning[0], progress.tags);
    expect(morningShown.body).toContain("路上的回复");
    progress = chooseMondayAction(progress, meetingFight);
    const afternoonShown = applyTurnEcho(mondayTurnPools.afternoon[0], progress.tags);
    expect(afternoonShown.body).toContain("强硬回应");
    progress = chooseMondayAction(progress, afternoonSnack);
    const closingShown = applyTurnEcho(mondayTurnPools.closing[0], progress.tags);
    expect(closingShown.body).toContain("补给");
    expect(morningShown.body).not.toContain("强硬回应");
    expect(afternoonShown.body).not.toContain("补给");
  });
});

// ---------------------------------------------------------------------------
// AR-05 本地历史（变异用例 1、2）
// ---------------------------------------------------------------------------
describe("AR-05 本地历史变异", () => {
  const rawCases: Array<{ name: string; raw: string }> = [
    { name: "空字符串", raw: "" },
    { name: "非法 JSON", raw: "{broken" },
    { name: "JSON 字符串而非法 JSON 文档", raw: "\"just a string\"" },
    { name: "错误 version=2", raw: JSON.stringify({ version: 2, entries: [entry()] }) },
    { name: "缺失 version", raw: JSON.stringify({ entries: [entry()] }) },
    { name: "entries 非数组（对象）", raw: JSON.stringify({ version: 1, entries: { a: 1 } }) },
    { name: "entries 非数组（null）", raw: JSON.stringify({ version: 1, entries: null }) },
    { name: "entries 含 null/数字/字符串/布尔", raw: JSON.stringify({ version: 1, entries: [null, 42, "x", true, entry()] }) },
    { name: "entries 含缺失字段与 NaN/Infinity", raw: JSON.stringify({ version: 1, entries: [entry({ score: Number.NaN }), entry({ persona: "" }), entry({ mood: undefined as unknown as number }), entry()] }) },
    { name: "6 条记录（超出上限 1 条）", raw: JSON.stringify({ version: 1, entries: [1, 2, 3, 4, 5, 6].map((i) => entry({ persona: `P${i}` })) }) }
  ];

  it.each(rawCases)("损坏输入 %s 安全降级为合法结果", ({ name, raw }) => {
    const storage = memoryStorage(new Map([[LOCAL_HISTORY_STORAGE_KEY, raw]]));
    const result = readLocalHistory(storage);
    expect(Array.isArray(result)).toBe(true);
    // 6 条记录时截为 5 条；其余损坏场景为 [] 或仅含合法条目
    expect(result.length).toBeLessThanOrEqual(LOCAL_HISTORY_LIMIT);
    for (const item of result) {
      expect(Object.keys(item).sort()).toEqual(["date", "energy", "mood", "outcome", "persona", "score", "weekKey"]);
      expect(Number.isFinite(item.score)).toBe(true);
      expect(Number.isFinite(item.energy)).toBe(true);
      expect(Number.isFinite(item.mood)).toBe(true);
    }
    if (name === "6 条记录（超出上限 1 条）") {
      expect(result.map((e) => e.persona)).toEqual(["P1", "P2", "P3", "P4", "P5"]);
    }
  });

  it("含额外敏感字段（姓名/账号/设备标识/自由文本）被白名单剥离", () => {
    const sensitive = {
      ...entry(),
      account: "must-not-survive",
      deviceId: "device-abc",
      name: "张三",
      rawText: "用户自由输入内容",
      nickname: "nick",
      phone: "13800000000"
    };
    const storage = memoryStorage();
    saveLocalHistoryEntry(sensitive, storage);
    const stored = JSON.parse(storage.values.get(LOCAL_HISTORY_STORAGE_KEY)!);
    expect(Object.keys(stored.entries[0]).sort()).toEqual(["date", "energy", "mood", "outcome", "persona", "score", "weekKey"]);
    // 读回路径同样剥离
    const rereadStorage = memoryStorage(new Map([[LOCAL_HISTORY_STORAGE_KEY, JSON.stringify({ version: 1, entries: [sensitive] })]]));
    expect(Object.keys(readLocalHistory(rereadStorage)[0]).sort()).toEqual(["date", "energy", "mood", "outcome", "persona", "score", "weekKey"]);
  });

  it("连续保存 7 次只保留最近 5 次，最新在前", () => {
    const storage = memoryStorage();
    let entries: LocalHistoryEntry[] = [];
    for (let i = 0; i < 7; i += 1) {
      entries = saveLocalHistoryEntry(entry({ persona: `人格${i}`, score: i }), storage);
    }
    expect(entries).toHaveLength(5);
    expect(entries.map((e) => e.persona)).toEqual(["人格6", "人格5", "人格4", "人格3", "人格2"]);
    expect(readLocalHistory(storage).map((e) => e.persona)).toEqual(["人格6", "人格5", "人格4", "人格3", "人格2"]);
  });

  it("getItem / setItem / removeItem 各自抛异常时全部安全降级（变异用例 2）", () => {
    expect(readLocalHistory(throwingStorage("getItem"))).toEqual([]);
    expect(readLocalHistory(throwingStorage("all"))).toEqual([]);
    expect(readSoundEnabled(throwingStorage("getItem"))).toBe(false);
    expect(writeSoundEnabled(true, throwingStorage("setItem"))).toBe(false);
    expect(clearLocalHistory(throwingStorage("removeItem"))).toBe(false);
    // saveLocalHistoryEntry 在 setItem 抛异常时返回本次结果但不抛出（主流程可继续）
    const saved = saveLocalHistoryEntry(entry(), throwingStorage("setItem"));
    expect(saved).toHaveLength(1);
    expect(saved[0].persona).toBe("情绪避险大师");
    // quota 场景：已有 5 条 + 新条目，setItem 失败 → 返回 6→截断后 5 条但未持久化
    const quota = throwingStorage("setItem");
    const quotaResult = saveLocalHistoryEntry(entry({ persona: "新" }), quota);
    expect(quotaResult).toHaveLength(1);
  });

  it("null storage（window 未定义场景）安全降级", () => {
    expect(readLocalHistory(null)).toEqual([]);
    expect(saveLocalHistoryEntry(entry(), null)).toHaveLength(1);
    expect(clearLocalHistory(null)).toBe(false);
    expect(readSoundEnabled(null)).toBe(false);
    expect(writeSoundEnabled(true, null)).toBe(false);
  });

  it("清除后可重新写入；重复保存同一条目不去重（记录行为）", () => {
    const storage = memoryStorage();
    saveLocalHistoryEntry(entry({ persona: "A" }), storage);
    saveLocalHistoryEntry(entry({ persona: "A" }), storage);
    expect(readLocalHistory(storage)).toHaveLength(2);
    expect(clearLocalHistory(storage)).toBe(true);
    expect(readLocalHistory(storage)).toEqual([]);
    saveLocalHistoryEntry(entry({ persona: "B" }), storage);
    expect(readLocalHistory(storage).map((e) => e.persona)).toEqual(["B"]);
  });

  it("多标签页竞争（lost update）：两个视图同读旧快照先后保存，先保存的条目丢失", () => {
    // 用同一 Map 模拟共享 localStorage；两个"标签页"各自先 read 再 save
    const shared = memoryStorage();
    saveLocalHistoryEntry(entry({ persona: "旧1" }), shared);
    saveLocalHistoryEntry(entry({ persona: "旧2" }), shared);
    // tabA 与 tabB 同时读到的都是 [旧1,旧2]
    const tabAView = readLocalHistory(shared);
    const tabBView = readLocalHistory(shared);
    expect(tabAView.map((e) => e.persona)).toEqual(["旧2", "旧1"]);
    expect(tabBView.map((e) => e.persona)).toEqual(["旧2", "旧1"]);
    // tabA 先完成一局并保存（写回 [新A,旧2,旧1]）
    const aEntries = saveLocalHistoryEntry(entry({ persona: "新A" }), shared);
    expect(aEntries.map((e) => e.persona)).toEqual(["新A", "旧2", "旧1"]);
    // tabB 随后完成并保存：saveLocalHistoryEntry 内部重新 read（此时已含新A）→ 并不丢失
    const bEntries = saveLocalHistoryEntry(entry({ persona: "新B" }), shared);
    expect(bEntries.map((e) => e.persona)).toEqual(["新B", "新A", "旧2", "旧1"]);
    // 真正的竞争窗口：tabB 用旧快照直接写回（模拟 React state 里的 history 被覆盖写回的场景）
    shared.values.set(LOCAL_HISTORY_STORAGE_KEY, JSON.stringify({ version: 1, entries: [entry({ persona: "新B" }), ...tabBView] }));
    const finalEntries = readLocalHistory(shared);
    expect(finalEntries.map((e) => e.persona)).toEqual(["新B", "旧2", "旧1"]);
    // 新A 丢失 —— 记录为多标签页 lost-update 观察证据（产品代码 saveLocalHistoryEntry 本身每次重读，
    // 只有"另一标签页持旧 state 整体写回"才会丢；当前 UI 的 clearHistory 只写空，不整体写回）
  });

  it("formatLocalHistoryDate 在跨时区边界正确取本地日期", () => {
    expect(formatLocalHistoryDate(new Date("2026-08-28T03:00:00.000Z"), "Asia/Shanghai")).toBe("2026-08-28");
    expect(formatLocalHistoryDate(new Date("2026-08-27T17:00:00.000Z"), "UTC")).toBe("2026-08-27");
    expect(formatLocalHistoryDate(new Date("2026-08-27T17:00:00.000Z"), "Asia/Shanghai")).toBe("2026-08-28");
  });
});

// ---------------------------------------------------------------------------
// AR-07 声音（变异用例 4）
// ---------------------------------------------------------------------------
describe("AR-07 AudioContext 变异", () => {
  interface FakeStats { constructions: number; resumes: number; tones: number; resumeRejects: number }
  function installFakeWindow(options: { constructThrows?: boolean; resumeRejects?: boolean; noContext?: boolean } = {}) {
    const stats: FakeStats = { constructions: 0, resumes: 0, tones: 0, resumeRejects: 0 };
    class FakeAudioParam {
      setValueAtTime() {}
      exponentialRampToValueAtTime() {}
    }
    class FakeOscillator {
      frequency = new FakeAudioParam();
      type = "sine";
      connect() {}
      start() { stats.tones += 1; }
      stop() {}
    }
    class FakeGain {
      gain = new FakeAudioParam();
      connect() {}
    }
    class FakeAudioContext {
      currentTime = 0;
      state = options.resumeRejects ? "suspended" : "running";
      destination = {};
      constructor() {
        stats.constructions += 1;
        if (options.constructThrows) {
          throw new Error("AudioContext construction blocked");
        }
      }
      createGain() { return new FakeGain(); }
      createOscillator() { return new FakeOscillator(); }
      resume() {
        stats.resumes += 1;
        if (options.resumeRejects) {
          stats.resumeRejects += 1;
          return Promise.reject(new Error("resume rejected"));
        }
        return Promise.resolve();
      }
    }
    const fakeWindow: Record<string, unknown> = {};
    if (!options.noContext) {
      fakeWindow.AudioContext = FakeAudioContext;
    }
    const previousWindow = (globalThis as Record<string, unknown>).window;
    (globalThis as Record<string, unknown>).window = fakeWindow;
    return {
      stats,
      restore() {
        if (previousWindow === undefined) {
          delete (globalThis as Record<string, unknown>).window;
        } else {
          (globalThis as Record<string, unknown>).window = previousWindow;
        }
      }
    };
  }

  const cues: SoundCue[] = ["choice", "danger", "win", "fail"];

  it("window 不存在：play 不抛错、不构造上下文", () => {
    delete (globalThis as Record<string, unknown>).window;
    const player = createSoundPlayer();
    for (const cue of cues) {
      expect(() => player.play(cue)).not.toThrow();
    }
  });

  it("AudioContext 不存在（window 上无该属性）：静默降级", () => {
    const fake = installFakeWindow({ noContext: true });
    try {
      const player = createSoundPlayer();
      for (const cue of cues) {
        expect(() => player.play(cue)).not.toThrow();
      }
      expect(fake.stats.constructions).toBe(0);
    } finally {
      fake.restore();
    }
  });

  it("构造函数抛异常：不抛出、后续调用可重试", () => {
    const fake = installFakeWindow({ constructThrows: true });
    try {
      const player = createSoundPlayer();
      for (const cue of cues) {
        expect(() => player.play(cue)).not.toThrow();
      }
      expect(fake.stats.constructions).toBe(4); // 每次都重试（context 保持 null）
    } finally {
      fake.restore();
    }
  });

  it("resume() reject：吞掉异常、无未处理 rejection、tone 仍被调度、主流程不受影响", async () => {
    const fake = installFakeWindow({ resumeRejects: true });
    try {
      const player = createSoundPlayer();
      const unhandled: unknown[] = [];
      const onUnhandled = (reason: unknown) => unhandled.push(reason);
      process.on("unhandledRejection", onUnhandled);
      try {
        for (const cue of cues) {
          expect(() => player.play(cue)).not.toThrow();
        }
        await new Promise((resolve) => setImmediate(resolve));
        await new Promise((resolve) => setImmediate(resolve));
        expect(unhandled).toEqual([]);
        expect(fake.stats.resumeRejects).toBeGreaterThanOrEqual(4);
        expect(fake.stats.tones).toBeGreaterThanOrEqual(4); // suspended 下 tone 仍被调度（静音等待）
      } finally {
        process.off("unhandledRejection", onUnhandled);
      }
    } finally {
      fake.restore();
    }
  });

  it("正常路径：首次 play 构造一次上下文，后续复用，每次都尝试 resume", () => {
    const fake = installFakeWindow();
    try {
      const player = createSoundPlayer();
      player.play("choice");
      expect(fake.stats.constructions).toBe(1);
      player.play("win");
      player.play("fail");
      player.play("danger");
      expect(fake.stats.constructions).toBe(1);
      expect(fake.stats.resumes).toBe(4);
      expect(fake.stats.tones).toBe(5); // win 播 2 个 tone
    } finally {
      fake.restore();
    }
  });

  it("默认关闭由存储层保证：无存储/异常存储 readSoundEnabled 均为 false", () => {
    expect(readSoundEnabled(memoryStorage())).toBe(false);
    expect(readSoundEnabled(throwingStorage("getItem"))).toBe(false);
    const off = memoryStorage(new Map([["monday-survival:sound:v1", "off"]]));
    expect(readSoundEnabled(off)).toBe(false);
    const on = memoryStorage(new Map([["monday-survival:sound:v1", "on"]]));
    expect(readSoundEnabled(on)).toBe(true);
    const junk = memoryStorage(new Map([["monday-survival:sound:v1", "yes"]]));
    expect(readSoundEnabled(junk)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AR-06 / AR-09 单元级：事件合同与 payload 白名单
// ---------------------------------------------------------------------------
describe("AR-06/AR-09 事件合同（单元级）", () => {
  it("事件名合同与 EXECUTION_PLAN 8.4 完全一致", () => {
    expect([...PRODUCT_EVENT_NAMES]).toEqual([
      "game_open", "intro_view", "game_start", "round_view", "choice_selected",
      "feedback_continue", "result_view", "result_image_generated",
      "share_attempted", "share_completed", "restart"
    ]);
  });

  it("无 handler 时 emit 不抛错；payload 只接受 string/number/boolean 值", () => {
    expect(() => emitProductEvent(undefined, "game_open", { weekKey: "x" })).not.toThrow();
    const seen: Array<[string, Record<string, string | number | boolean> | undefined]> = [];
    emitProductEvent((name, properties) => seen.push([name, properties]), "round_view", { round: 1, weekKey: "2026-W35" });
    expect(seen).toEqual([["round_view", { round: 1, weekKey: "2026-W35" }]]);
  });

  it("历史 envelope 只含 version/entries 且不含任何标识性字段（AR-06）", () => {
    const storage = memoryStorage();
    saveLocalHistoryEntry(entry(), storage);
    const envelope = JSON.parse(storage.values.get(LOCAL_HISTORY_STORAGE_KEY)!);
    expect(Object.keys(envelope).sort()).toEqual(["entries", "version"]);
    const serialized = storage.values.get(LOCAL_HISTORY_STORAGE_KEY)!;
    for (const forbidden of ["account", "device", "name", "phone", "token", "user", "id\":", "ip"]) {
      expect(serialized.includes(forbidden), `历史 JSON 不应包含 ${forbidden}`).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// AR-11 单元级：同一局四份输出一致性（页面/战报/分享/历史 共享 ResultPresentation）
// ---------------------------------------------------------------------------
describe("AR-11 结果一致性（单元级）", () => {
  it("固定路线：presentation 是页面、战报、分享、历史的唯一数据源，字段一致", () => {
    const path = [0, 2, 0, 1, 0];
    const turns = mondayTurns;
    const progress = turns.reduce((current, turn, index) => chooseMondayAction(current, turn.choices[path[index]]), createMondayRun());
    const result = calculateMondayResult(progress);
    const viewModel = toResultViewModel(result, progress);
    const presentation = toResultPresentation(viewModel, [
      { kind: "score", label: "绩效", value: progress.score },
      { kind: "energy", label: "能量", value: progress.energy },
      { kind: "mood", label: "心情", value: progress.mood }
    ], progress, turns);
    const shareText = createResultShareText(presentation);

    expect(presentation.score).toBe(progress.score);
    expect(presentation.energy).toBe(progress.energy);
    expect(presentation.mood).toBe(progress.mood);
    expect(presentation.personaLabel).toBe(viewModel.personaLabel);
    expect(presentation.todayEnding).toBe(result.title);
    expect(presentation.keyChoice.id).toBe(progress.history.at(-1));

    // 分享文案包含与 presentation 相同的字段
    expect(shareText).toContain(`我的今日周一人格：${presentation.personaLabel}`);
    expect(shareText).toContain(`“${presentation.personaQuote}”`);
    expect(shareText).toContain(`今日结局：${presentation.todayEnding}`);
    expect(shareText).toContain(`关键一手：${presentation.keyChoice.label}——${presentation.keyChoice.impactSummary}`);
    expect(shareText).toContain(`绩效 ${presentation.score > 0 ? `+${presentation.score}` : presentation.score} · 能量 ${presentation.energy}/100 · 心情 ${presentation.mood}/100`);

    // 历史条目字段与 presentation 一致（saveLocalHistoryEntry 的输入来自同一 presentation/result）
    expect(presentation.personaLabel).toBe(viewModel.personaLabel);
    expect(result.outcome).toBe(getOutcome(progress));
  });

  it("提前结束路线：关键一手取结束前最后一个真实选择", () => {
    const earlyPath = [2, 2, 1, 0];
    const progress = earlyPath.reduce((current, choiceIndex, turnIndex) => (
      chooseMondayAction(current, mondayTurns[turnIndex].choices[choiceIndex])
    ), createMondayRun());
    expect(isMondayRunComplete(progress)).toBe(true);
    expect(progress.turnIndex).toBeLessThan(mondayTurns.length);
    const result = calculateMondayResult(progress);
    const presentation = toResultPresentation(toResultViewModel(result, progress), [
      { kind: "score", label: "绩效", value: progress.score },
      { kind: "energy", label: "能量", value: progress.energy },
      { kind: "mood", label: "心情", value: progress.mood }
    ], progress, mondayTurns);
    expect(presentation.keyChoice.id).toBe(progress.history.at(-1));
    expect(createResultShareText(presentation)).toContain(presentation.keyChoice.label);
  });

  it("空 history 调用 toResultPresentation 抛错（产品路径不可能出现，记录防御行为）", () => {
    expect(() => toResultPresentation(
      { description: "d", personaLabel: "p", personaQuote: "q", title: "t" },
      [], { history: [] }, mondayTurns
    )).toThrow(/at least one real choice/);
  });

  it("13 人格标签与 gameViewModels 导出一致（人格可达性独立复核的输入）", () => {
    expect(mondayPersonaLabels).toHaveLength(13);
    expect(new Set(mondayPersonaLabels).size).toBe(13);
  });
});
