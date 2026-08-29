// ZCode 对抗性审查 —— AR-04：59,049 路径验证器独立重算。
// 不复用 gameCore 的 oracle：从数据层重新实现规则（初始值、clamp、结局判定、提前结束、
// 人格决策树），独立枚举 9^5 路径，与产品验证器 runStage7PathValidation 及
// reports/stage7-path-validation.json 三方对照。
import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mondayTurnPeriods, mondayTurnPools } from "../src/data/turns";
import { runStage7PathValidation } from "../src/stage7PathValidation";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportJsonPath = path.join(projectRoot, "reports/stage7-path-validation.json");

// ---- 独立规则实现（不 import gameCore） -----------------------------------
type Outcome = "win" | "survive" | "fail";

function independentOutcome(score: number, energy: number, mood: number): Outcome {
  if (energy <= 0 || mood <= 0 || score < -10) return "fail";
  if (score >= 38 && energy >= 25 && mood >= 25) return "win";
  return "survive";
}

function independentClamp(value: number, min: number, max: number) {
  return value < min ? min : value > max ? max : value;
}

// 人格决策树：按 gameViewModels 的分支语义独立复写（同样的产品规则，独立代码路径）
function independentPersona(outcome: Outcome, score: number, energy: number, mood: number): string {
  if (outcome === "win") {
    if (score >= 60 && energy >= 25) return "会议防火墙型";
    if (energy < 35) return "燃尽通关者";
    if (mood >= 80) return "情绪避险大师";
    return "边界感幸存者";
  }
  if (outcome === "fail") {
    if (energy <= 0 && mood <= 0) return "急需补给者";
    if (energy <= 0) return "电量清零型";
    if (mood <= 0) return "情绪停机型";
    if (score < -10) return "绩效滑坡型";
    return "急需补给者";
  }
  if (energy < 25) return "低电量幸存者";
  if (mood < 25) return "微笑崩盘型";
  if (score < 20) return "摸鱼边缘人";
  if (energy >= 70 || mood >= 75) return "自救优先型";
  return "缓存型打工人";
}

interface IndependentResult {
  outcome: Outcome;
  turnIndex: number; // 实际完成的选择数
  earlyEnded: boolean;
  earlyResource: "energy" | "mood" | "both" | null;
  energy: number;
  mood: number;
  score: number;
  playedEventIds: string[];
}

function independentRun(actionIndexesByPeriod: number[]): IndependentResult {
  let score = 0;
  let energy = 70;
  let mood = 60;
  let turnIndex = 0;
  let earlyEnded = false;
  let earlyResource: IndependentResult["earlyResource"] = null;
  const playedEventIds: string[] = [];
  for (let periodIndex = 0; periodIndex < 5; periodIndex += 1) {
    if (earlyEnded) break;
    const pool = mondayTurnPools[mondayTurnPeriods[periodIndex]];
    const actionIndex = actionIndexesByPeriod[periodIndex];
    const turn = pool[Math.floor(actionIndex / 3)];
    const choice = turn.choices[actionIndex % 3];
    playedEventIds.push(turn.id);
    score += choice.effect.scoreDelta;
    energy = independentClamp(energy + (choice.effect.energyDelta ?? 0), 0, 100);
    mood = independentClamp(mood + (choice.effect.moodDelta ?? 0), 0, 100);
    turnIndex += 1;
    if ((energy <= 0 || mood <= 0) && turnIndex < 5) {
      earlyEnded = true;
      earlyResource = energy <= 0 && mood <= 0 ? "both" : energy <= 0 ? "energy" : "mood";
    }
  }
  return {
    outcome: independentOutcome(score, energy, mood),
    turnIndex,
    earlyEnded,
    earlyResource,
    energy,
    mood,
    score,
    playedEventIds
  };
}

function enumerateAll(): Map<string, { result: IndependentResult; actionIndexes: number[] }> {
  const results = new Map<string, { result: IndependentResult; actionIndexes: number[] }>();
  for (let pathNumber = 0; pathNumber < 9 ** 5; pathNumber += 1) {
    let encoded = pathNumber;
    const actionIndexes: number[] = [];
    for (let period = 0; period < 5; period += 1) {
      actionIndexes.push(encoded % 9);
      encoded = Math.floor(encoded / 9);
    }
    const key = actionIndexes.join(",");
    const result = independentRun(actionIndexes);
    results.set(key, { result, actionIndexes });
  }
  return results;
}

// ---- 三方对照 ---------------------------------------------------------------
describe("AR-04 59,049 验证器独立重算", () => {
  const all = enumerateAll();
  const outcomeCounts = { fail: 0, survive: 0, win: 0 };
  const earlyByResource = { energy: 0, mood: 0, both: 0 };
  let earlyTotal = 0;
  const reachablePersonas = new Set<string>();
  const eventPlayed = new Map<string, number>();
  const eventFailures = new Map<string, number>();
  for (const { result } of all.values()) {
    outcomeCounts[result.outcome] += 1;
    if (result.earlyEnded) {
      earlyTotal += 1;
      if (result.earlyResource === "energy") earlyByResource.energy += 1;
      else if (result.earlyResource === "mood") earlyByResource.mood += 1;
      else earlyByResource.both += 1;
    }
    reachablePersonas.add(independentPersona(result.outcome, result.score, result.energy, result.mood));
    for (const eventId of result.playedEventIds) {
      eventPlayed.set(eventId, (eventPlayed.get(eventId) ?? 0) + 1);
      if (result.outcome === "fail") {
        eventFailures.set(eventId, (eventFailures.get(eventId) ?? 0) + 1);
      }
    }
  }

  it("独立枚举覆盖全部 59,049 条路径且无重复", () => {
    expect(all.size).toBe(9 ** 5);
    expect(9 ** 5).toBe(59_049);
  });

  it("独立重算的结局分布与产品验证器及落盘报告一致", async () => {
    const fresh = runStage7PathValidation(new Date("2026-08-28T00:00:00.000Z"));
    const reportPath = reportJsonPath;
    const report = JSON.parse(await readFile(reportPath, "utf8"));

    // 独立 vs 产品验证器（新鲜运行）
    expect(fresh.metrics.outcomes).toEqual(outcomeCounts);
    expect(fresh.metrics.outcomeRatios.win).toBeCloseTo(outcomeCounts.win / 59_049, 12);
    expect(fresh.metrics.outcomeRatios.survive).toBeCloseTo(outcomeCounts.survive / 59_049, 12);
    expect(fresh.metrics.outcomeRatios.fail).toBeCloseTo(outcomeCounts.fail / 59_049, 12);

    // 产品验证器（新鲜运行）vs 落盘报告（阶段 7 交付物）
    expect(report.metrics.outcomes).toEqual(fresh.metrics.outcomes);
    expect(report.metrics.pathCount).toBe(59_049);
    expect(report.metrics.reachablePersonas.length).toBe(fresh.metrics.reachablePersonas.length);
    expect(report.metrics.earlyEndings.total).toBe(fresh.metrics.earlyEndings.total);
    expect(report.passed).toBe(true);
    expect(fresh.passed).toBe(true);

    // 独立 vs 落盘报告
    expect(report.metrics.outcomes).toEqual(outcomeCounts);
  });

  it("独立重算的提前结束与资源分布与产品验证器一致", async () => {
    const fresh = runStage7PathValidation(new Date("2026-08-28T00:00:00.000Z"));
    const report = JSON.parse(await readFile(reportJsonPath, "utf8"));

    // 产品口径：earlyByResource.energy 计数含 both（energy<=0 即计数），mood 同理
    const productEnergy = fresh.metrics.earlyEndings.byResource.energy;
    const productMood = fresh.metrics.earlyEndings.byResource.mood;
    expect(productEnergy).toBe(earlyByResource.energy + earlyByResource.both);
    expect(productMood).toBe(earlyByResource.mood + earlyByResource.both);
    expect(fresh.metrics.earlyEndings.total).toBe(earlyTotal);
    expect(report.metrics.earlyEndings.byResource).toEqual({ energy: productEnergy, mood: productMood });
  });

  it("独立重算：13 人格全部可达", () => {
    expect(reachablePersonas.size).toBe(13);
    expect([...reachablePersonas].sort()).toEqual([
      "边界感幸存者", "会议防火墙型", "燃尽通关者", "情绪避险大师", "急需补给者",
      "电量清零型", "情绪停机型", "绩效滑坡型", "缓存型打工人", "低电量幸存者",
      "微笑崩盘型", "摸鱼边缘人", "自救优先型"
    ].sort());
  });

  it("独立重算：单事件条件失败率 ≤ 50%（与产品检查项同门槛）", () => {
    const rates = [...eventPlayed.entries()].map(([eventId, played]) => ({
      eventId,
      failRate: (eventFailures.get(eventId) ?? 0) / played
    }));
    for (const rate of rates) {
      expect(rate.failRate, `${rate.eventId} 条件失败率`).toBeLessThanOrEqual(0.5);
    }
    const worst = rates.reduce((a, b) => (a.failRate > b.failRate ? a : b));
    expect(worst.failRate).toBeCloseTo(0.2769, 3);
  });

  it("独立支配检查：45 个选择（全部 15 事件）无任何选择被另一选择全面支配", () => {
    const turns = mondayTurnPeriods.flatMap((period) => mondayTurnPools[period]);
    const dominated: string[] = [];
    for (const turn of turns) {
      for (const choice of turn.choices) {
        const mine = [choice.effect.scoreDelta, choice.effect.energyDelta ?? 0, choice.effect.moodDelta ?? 0];
        for (const candidate of turn.choices) {
          if (candidate.id === choice.id) continue;
          const theirs = [candidate.effect.scoreDelta, candidate.effect.energyDelta ?? 0, candidate.effect.moodDelta ?? 0];
          const weakOrEqual = theirs.every((value, index) => value >= mine[index]);
          const strictlyBetterSomewhere = theirs.some((value, index) => value > mine[index]);
          if (weakOrEqual && strictlyBetterSomewhere) {
            dominated.push(`${turn.id}/${choice.id}<${candidate.id}`);
          }
        }
      }
    }
    expect(dominated).toEqual([]);
  });

  it("抽样逐路径对照：独立 oracle 与产品 gameCore 在 2,000 条随机路径 + 全部 243 条基线路径上一致", async () => {
    // 注意：这里引入产品 oracle 仅做"对照"，独立结果不依赖它。
    const { applyChoice, createGameProgress, getOutcome } = await import("../src/gameCore");
    const baselineTurns = mondayTurnPeriods.map((period) => mondayTurnPools[period][0]);

    // 全部 243 条基线路径（产品单测所用 mondayTurns）
    for (let pathNumber = 0; pathNumber < 3 ** 5; pathNumber += 1) {
      let encoded = pathNumber;
      const choiceIndexes: number[] = [];
      for (let period = 0; period < 5; period += 1) {
        choiceIndexes.push(encoded % 3);
        encoded = Math.floor(encoded / 3);
      }
      let progress = createGameProgress();
      let stopped = false;
      for (let period = 0; period < 5; period += 1) {
        if (stopped) break;
        progress = applyChoice(progress, baselineTurns[period].choices[choiceIndexes[period]]);
        if ((progress.energy <= 0 || progress.mood <= 0) && progress.turnIndex < 5) {
          stopped = true;
        }
      }
      const productOutcome = getOutcome(progress);
      // 映射到独立枚举的 key：基线事件是每个池的第 0 个 → actionIndex = 0*3 + choiceIndex
      const actionIndexes = choiceIndexes.map((choiceIndex) => choiceIndex);
      const mine = independentRun(actionIndexes);
      expect(mine.outcome, `baseline path ${actionIndexes.join(",")}`).toBe(productOutcome);
      expect(mine.energy).toBe(progress.energy);
      expect(mine.mood).toBe(progress.mood);
      expect(mine.score).toBe(progress.score);
      expect(mine.turnIndex).toBe(progress.turnIndex);
      expect(mine.earlyEnded).toBe(stopped);
    }

    // 2,000 条伪随机全池路径
    let seed = 987654321;
    const random = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let trial = 0; trial < 2000; trial += 1) {
      const actionIndexes = Array.from({ length: 5 }, () => Math.floor(random() * 9));
      let progress = createGameProgress();
      let stopped = false;
      for (let period = 0; period < 5; period += 1) {
        if (stopped) break;
        const pool = mondayTurnPools[mondayTurnPeriods[period]];
        const actionIndex = actionIndexes[period];
        const turn = pool[Math.floor(actionIndex / 3)];
        const choice = turn.choices[actionIndex % 3];
        progress = applyChoice(progress, choice);
        if ((progress.energy <= 0 || progress.mood <= 0) && progress.turnIndex < 5) {
          stopped = true;
        }
      }
      const productOutcome = getOutcome(progress);
      const mine = independentRun(actionIndexes);
      expect(mine.outcome, `random path ${actionIndexes.join(",")}`).toBe(productOutcome);
      expect(mine.energy).toBe(progress.energy);
      expect(mine.mood).toBe(progress.mood);
      expect(mine.score).toBe(progress.score);
      expect(mine.turnIndex).toBe(progress.turnIndex);
      expect(mine.earlyEnded).toBe(stopped);
    }
  });

  it("产品验证器与 UI 的提前结束语义一致（isMondayRunComplete）", async () => {
    const { chooseMondayAction, createMondayRun, isMondayRunComplete } = await import("../src/game");
    // 逐语义对照：模拟 UI 流程——每次选择后 UI 用 isMondayRunComplete 判断是否进入结果页
    const baselineTurns = mondayTurnPeriods.map((period) => mondayTurnPools[period][0]);
    for (let pathNumber = 0; pathNumber < 3 ** 5; pathNumber += 1) {
      let encoded = pathNumber;
      const choiceIndexes: number[] = [];
      for (let period = 0; period < 5; period += 1) {
        choiceIndexes.push(encoded % 3);
        encoded = Math.floor(encoded / 3);
      }
      let progress = createMondayRun();
      for (let period = 0; period < 5; period += 1) {
        if (isMondayRunComplete(progress)) {
          break;
        }
        progress = chooseMondayAction(progress, baselineTurns[period].choices[choiceIndexes[period]]);
      }
      const uiEndedEarly = progress.turnIndex < 5;
      const mine = independentRun(choiceIndexes);
      expect(mine.earlyEnded, `UI/validator early-end mismatch path ${choiceIndexes.join(",")}`).toBe(uiEndedEarly);
      expect(mine.turnIndex, `UI/validator turnIndex mismatch path ${choiceIndexes.join(",")}`).toBe(progress.turnIndex);
    }
  });

  it("事件指标口径：playedEventIds 与产品 eventMetrics.paths 一致（15 事件各自总数）", async () => {
    const fresh = runStage7PathValidation(new Date("2026-08-28T00:00:00.000Z"));
    for (const [eventId, played] of eventPlayed) {
      expect(fresh.metrics.eventMetrics[eventId].paths, `event ${eventId} paths`).toBe(played);
    }
  });
});
