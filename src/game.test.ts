import { describe, expect, it } from "vitest";
import {
  calculateMondayResult,
  chooseMondayAction,
  createMondayRun,
  isMondayRunComplete,
  mondayTurns
} from "./game";
import { formatPerformance, getStatSegmentCount, toStatViewModels } from "./gameViewModels";
import { createResultShareText, toResultShareData } from "./resultShare";

describe("monday-survival", () => {
  it("can complete a full run", () => {
    const strongPath = [0, 2, 0, 1, 0];
    const progress = mondayTurns.reduce((current, turn, index) => {
      return chooseMondayAction(current, turn.choices[strongPath[index]]);
    }, createMondayRun());

    expect(isMondayRunComplete(progress)).toBe(true);
    expect(calculateMondayResult(progress).outcome).toBe("win");
  });

  it("can fail when bad choices drain the player", () => {
    const failPath = [1, 1, 2, 2, 2];
    const progress = mondayTurns.reduce((current, turn, index) => {
      return chooseMondayAction(current, turn.choices[failPath[index]]);
    }, createMondayRun());

    expect(calculateMondayResult(progress).outcome).toBe("fail");
  });

  it("keeps outcome distribution playable after balance changes", () => {
    const outcomes = {
      fail: 0,
      survive: 0,
      win: 0
    };
    const failReasons = {
      energy: 0,
      mood: 0,
      score: 0
    };

    function walk(turnIndex: number, progress: ReturnType<typeof createMondayRun>) {
      if (turnIndex >= mondayTurns.length || progress.energy <= 0 || progress.mood <= 0) {
        const result = calculateMondayResult(progress);
        outcomes[result.outcome] += 1;

        if (result.outcome === "fail") {
          if (progress.energy <= 0) {
            failReasons.energy += 1;
          }
          if (progress.mood <= 0) {
            failReasons.mood += 1;
          }
          if (progress.score < -10) {
            failReasons.score += 1;
          }
        }

        return;
      }

      for (const choice of mondayTurns[turnIndex].choices) {
        walk(turnIndex + 1, chooseMondayAction(progress, choice));
      }
    }

    walk(0, createMondayRun());

    const total = outcomes.win + outcomes.survive + outcomes.fail;

    expect(outcomes.win / total).toBeGreaterThanOrEqual(0.2);
    expect(outcomes.win / total).toBeLessThanOrEqual(0.25);
    expect(outcomes.survive / total).toBeGreaterThanOrEqual(0.45);
    expect(outcomes.survive / total).toBeLessThanOrEqual(0.55);
    expect(outcomes.fail / total).toBeGreaterThanOrEqual(0.25);
    expect(outcomes.fail / total).toBeLessThanOrEqual(0.3);
    expect(failReasons.energy).toBeGreaterThanOrEqual(10);
    expect(failReasons.mood).toBeGreaterThanOrEqual(20);
    expect(failReasons.score).toBeGreaterThanOrEqual(20);
  });

  it("keeps every turn free of Pareto-dominated choices", () => {
    for (const turn of mondayTurns) {
      for (const choice of turn.choices) {
        const values = [choice.effect.scoreDelta, choice.effect.energyDelta ?? 0, choice.effect.moodDelta ?? 0];
        const isDominated = turn.choices.some((candidate) => {
          if (candidate.id === choice.id) {
            return false;
          }

          const candidateValues = [
            candidate.effect.scoreDelta,
            candidate.effect.energyDelta ?? 0,
            candidate.effect.moodDelta ?? 0
          ];

          return candidateValues.every((value, index) => value >= values[index])
            && candidateValues.some((value, index) => value > values[index]);
        });

        expect(isDominated, `${turn.id}/${choice.id} must keep a real advantage`).toBe(false);
      }
    }
  });

  it("provides complete preview, outcome, and distinct semantic choice icons", () => {
    const expectedIcons = [
      "shower-head",
      "smartphone",
      "coffee",
      "message-square-reply",
      "eye-off",
      "notebook-pen",
      "notebook-text",
      "message-circle-warning",
      "power",
      "panels-top-left",
      "sandwich",
      "list-filter",
      "calendar-clock",
      "laptop",
      "door-open"
    ];
    const actualIcons = mondayTurns.flatMap((turn) => turn.choices.map((choice) => choice.visual));

    expect(actualIcons).toEqual(expectedIcons);
    expect(new Set(actualIcons).size).toBe(15);
    expect(actualIcons).not.toContain("check");

    for (const turn of mondayTurns) {
      for (const choice of turn.choices) {
        expect(choice.preview.trim().length).toBeGreaterThan(0);
        expect(choice.description.trim().length).toBeGreaterThan(0);
        expect(choice.preview).not.toBe(choice.description);
        expect(choice.visual.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps all three stats visible as seven segments without clamping performance text", () => {
    expect(getStatSegmentCount("energy", 78)).toBe(6);
    expect(getStatSegmentCount("mood", 64)).toBe(5);
    expect(getStatSegmentCount("score", -18)).toBe(0);
    expect(getStatSegmentCount("score", 0)).toBe(0);
    expect(getStatSegmentCount("score", 12)).toBe(2);
    expect(getStatSegmentCount("score", 130)).toBe(7);
    expect(formatPerformance(12)).toBe("+12");
    expect(formatPerformance(0)).toBe("0");
    expect(formatPerformance(-18)).toBe("-18");
  });

  it("creates share and poster data from dynamic result values", () => {
    const result = {
      description: "你下班时还记得自己叫什么。",
      personaLabel: "边界感幸存者",
      personaQuote: "不是每个会都值得你燃烧。",
      title: "体面下班"
    };
    const stats = [
      { kind: "energy" as const, label: "能量", value: 52 },
      { kind: "mood" as const, label: "心情", value: 76 },
      { kind: "score" as const, label: "绩效", value: 88 }
    ];

    expect(toStatViewModels({ energy: 52, mood: 76, score: 88 }).map((stat) => stat.kind)).toEqual([
      "score",
      "energy",
      "mood"
    ]);

    expect(toResultShareData(result, stats)).toMatchObject({
      description: result.description,
      energy: 52,
      mood: 76,
      personaLabel: result.personaLabel,
      score: 88,
      title: result.title
    });
    expect(createResultShareText(result, stats)).toContain("我的周一求生结果：体面下班");
    expect(createResultShareText(result, stats)).toContain("绩效 +88 · 能量 52/100 · 心情 76/100");

    const negativeStats = stats.map((stat) => stat.kind === "score" ? { ...stat, value: -18 } : stat);
    expect(createResultShareText(result, negativeStats)).toContain("绩效 -18 · 能量 52/100 · 心情 76/100");
  });
});
