import { describe, expect, it } from "vitest";
import {
  calculateMondayResult,
  chooseMondayAction,
  createMondayRun,
  isMondayRunComplete,
  mondayTurns
} from "./game";
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
    const progress = mondayTurns.reduce((current, turn) => {
      return chooseMondayAction(current, turn.choices[1]);
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

    expect(outcomes.win).toBeGreaterThanOrEqual(45);
    expect(outcomes.win).toBeLessThanOrEqual(60);
    expect(outcomes.survive).toBeGreaterThanOrEqual(110);
    expect(outcomes.survive).toBeLessThanOrEqual(135);
    expect(outcomes.fail).toBeGreaterThanOrEqual(55);
    expect(outcomes.fail).toBeLessThanOrEqual(75);
    expect(failReasons.energy).toBeGreaterThanOrEqual(10);
    expect(failReasons.mood).toBeGreaterThanOrEqual(20);
    expect(failReasons.score).toBeGreaterThanOrEqual(20);
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
      { kind: "score" as const, label: "得分", value: 88 }
    ];

    expect(toResultShareData(result, stats)).toMatchObject({
      description: result.description,
      energy: 52,
      mood: 76,
      personaLabel: result.personaLabel,
      score: 88,
      title: result.title
    });
    expect(createResultShareText(result, stats)).toContain("我的周一求生结果：体面下班");
    expect(createResultShareText(result, stats)).toContain("得分 88/100 · 能量 52/100 · 心情 76/100");
  });
});
