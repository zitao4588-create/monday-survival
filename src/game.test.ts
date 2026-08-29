import { describe, expect, it } from "vitest";
import {
  calculateMondayResult,
  chooseMondayAction,
  createMondayRun,
  isMondayRunComplete,
  mondayTurns
} from "./game";
import {
  formatPerformance,
  getPerformanceMeterSegments,
  getStatSegmentCount,
  toResultViewModel,
  toStatViewModels
} from "./gameViewModels";
import {
  hasSeenIntro,
  INTRO_STORAGE_KEY,
  INTRO_STORAGE_VALUE,
  markIntroSeen
} from "./introState";
import { RESULT_POSTER_HEIGHT, RESULT_POSTER_WIDTH } from "./resultPoster";
import { toResultPresentation } from "./resultPresentation";
import { createResultShareText } from "./resultShare";
import { applyTurnEcho } from "./gameCore";
import { mondayTurnPeriods, mondayTurnPools } from "./data/turns";
import { runStage7PathValidation } from "./stage7PathValidation";
import { getNaturalWeekSelection } from "./weeklyTurns";
import {
  LOCAL_HISTORY_LIMIT,
  LOCAL_HISTORY_STORAGE_KEY,
  SOUND_SETTING_STORAGE_KEY,
  clearLocalHistory,
  formatLocalHistoryDate,
  readLocalHistory,
  readSoundEnabled,
  saveLocalHistoryEntry,
  writeSoundEnabled,
  type LocalHistoryEntry,
  type LocalStorageLike
} from "./localHistory";
import { PRODUCT_EVENT_NAMES, emitProductEvent } from "./productEvents";
import { createSoundPlayer } from "./sound";

describe("monday-survival", () => {
  it("keeps the stage-8 event contract local and exhaustive", () => {
    expect(PRODUCT_EVENT_NAMES).toEqual([
      "game_open",
      "intro_view",
      "game_start",
      "round_view",
      "choice_selected",
      "feedback_continue",
      "result_view",
      "result_image_generated",
      "share_attempted",
      "share_completed",
      "restart"
    ]);

    const emitted: string[] = [];
    emitProductEvent((name) => emitted.push(name), "game_open");
    expect(emitted).toEqual(["game_open"]);
    expect(() => createSoundPlayer().play("choice")).not.toThrow();
  });

  it("keeps only five versioned, privacy-minimal local results", () => {
    const values = new Map<string, string>();
    const storage: LocalStorageLike = {
      getItem: (key) => values.get(key) ?? null,
      removeItem: (key) => {
        values.delete(key);
      },
      setItem: (key, value) => {
        values.set(key, value);
      }
    };

    let entries: LocalHistoryEntry[] = [];
    for (let index = 0; index < 7; index += 1) {
      entries = saveLocalHistoryEntry({
        date: `2026-08-${String(20 + index).padStart(2, "0")}`,
        energy: 70 - index,
        mood: 60 - index,
        outcome: "体面下班",
        persona: `人格 ${index}`,
        score: index,
        weekKey: "2026-W35"
      }, storage);
    }

    expect(entries).toHaveLength(LOCAL_HISTORY_LIMIT);
    expect(readLocalHistory(storage).map((entry) => entry.persona)).toEqual([
      "人格 6", "人格 5", "人格 4", "人格 3", "人格 2"
    ]);
    expect(Object.keys(entries[0]).sort()).toEqual([
      "date", "energy", "mood", "outcome", "persona", "score", "weekKey"
    ]);
    expect(values.get(LOCAL_HISTORY_STORAGE_KEY)).toContain('"version":1');
    expect(formatLocalHistoryDate(new Date("2026-08-28T03:00:00.000Z"), "Asia/Shanghai")).toBe("2026-08-28");

    expect(readSoundEnabled(storage)).toBe(false);
    expect(writeSoundEnabled(true, storage)).toBe(true);
    expect(values.get(SOUND_SETTING_STORAGE_KEY)).toBe("on");
    expect(readSoundEnabled(storage)).toBe(true);
    expect(clearLocalHistory(storage)).toBe(true);
    expect(readLocalHistory(storage)).toEqual([]);

    values.set(LOCAL_HISTORY_STORAGE_KEY, JSON.stringify({
      entries: [{ ...entries[0], account: "must-not-survive" }],
      version: 1
    }));
    expect(Object.keys(readLocalHistory(storage)[0]).sort()).toEqual([
      "date", "energy", "mood", "outcome", "persona", "score", "weekKey"
    ]);
  });

  it("silently drops corrupt or unavailable stage-8 local storage", () => {
    const values = new Map([[LOCAL_HISTORY_STORAGE_KEY, "{broken"]]);
    const corruptStorage: LocalStorageLike = {
      getItem: (key) => values.get(key) ?? null,
      removeItem: (key) => {
        values.delete(key);
      },
      setItem: (key, value) => {
        values.set(key, value);
      }
    };
    const unavailableStorage: LocalStorageLike = {
      getItem: () => {
        throw new Error("unavailable");
      },
      removeItem: () => {
        throw new Error("unavailable");
      },
      setItem: () => {
        throw new Error("unavailable");
      }
    };

    expect(readLocalHistory(corruptStorage)).toEqual([]);
    expect(readLocalHistory(unavailableStorage)).toEqual([]);
    expect(readSoundEnabled(unavailableStorage)).toBe(false);
    expect(writeSoundEnabled(true, unavailableStorage)).toBe(false);
    expect(clearLocalHistory(unavailableStorage)).toBe(false);
  });

  it("provides 15 complete events and 45 tagged choices", () => {
    const turns = mondayTurnPeriods.flatMap((period) => mondayTurnPools[period]);
    const choices = turns.flatMap((turn) => turn.choices);

    expect(turns).toHaveLength(15);
    expect(choices).toHaveLength(45);
    expect(new Set(turns.map((turn) => turn.id)).size).toBe(15);
    expect(new Set(choices.map((choice) => choice.id)).size).toBe(45);

    for (const choice of choices) {
      expect(choice).toMatchObject({
        effect: {
          energyDelta: expect.any(Number),
          moodDelta: expect.any(Number),
          scoreDelta: expect.any(Number)
        },
        id: expect.any(String),
        label: expect.any(String),
        preview: expect.any(String),
        description: expect.any(String),
        impactSummary: expect.any(String),
        visual: expect.any(String)
      });
      expect(choice.tags.length).toBeGreaterThan(0);
    }
  });

  it("keeps a deterministic natural-week selection and rotates across weeks", () => {
    const monday = getNaturalWeekSelection(new Date("2026-08-24T01:00:00.000Z"), "Asia/Shanghai");
    const sunday = getNaturalWeekSelection(new Date("2026-08-30T15:59:59.000Z"), "Asia/Shanghai");
    const nextMonday = getNaturalWeekSelection(new Date("2026-08-30T16:00:00.000Z"), "Asia/Shanghai");

    expect(monday.weekKey).toBe("2026-W35");
    expect(sunday).toMatchObject({ eventIndexes: monday.eventIndexes, weekKey: monday.weekKey });
    expect(nextMonday.weekKey).toBe("2026-W36");
    expect(nextMonday.eventIndexes.every((index, position) => index !== monday.eventIndexes[position])).toBe(true);
  });

  it("handles timezone and ISO week-year boundaries", () => {
    const boundaryInstant = new Date("2026-01-04T16:30:00.000Z");

    expect(getNaturalWeekSelection(boundaryInstant, "Asia/Shanghai").weekKey).toBe("2026-W02");
    expect(getNaturalWeekSelection(boundaryInstant, "America/Los_Angeles").weekKey).toBe("2026-W01");
    expect(getNaturalWeekSelection(new Date("2021-01-01T12:00:00.000Z"), "UTC")).toMatchObject({
      weekKey: "2020-W53",
      weekStart: "2020-12-28"
    });
  });

  it("writes choice tags to history and applies all three lightweight echoes", () => {
    const commute = mondayTurnPools.commute[0];
    const morning = mondayTurnPools.morning[0];
    const afternoon = mondayTurnPools.afternoon[0];
    const closing = mondayTurnPools.closing[0];
    const afterCommute = chooseMondayAction(createMondayRun(), commute.choices[0]);

    expect(afterCommute.tags).toContain("boss-replied");
    expect(applyTurnEcho(morning, afterCommute.tags).body).toContain("路上的回复");
    expect(applyTurnEcho(afternoon, ["meeting-firm"]).body).toContain("强硬回应");
    expect(applyTurnEcho(closing, ["afternoon-refuel"]).body).toContain("补给");
    expect(morning.body).not.toBe(applyTurnEcho(morning, ["boss-ignored"]).body);
  });

  it("passes all 59,049 stage-7 event-choice paths", () => {
    const report = runStage7PathValidation(new Date("2026-08-28T00:00:00.000Z"));

    expect(report.metrics.pathCount).toBe(59_049);
    expect(report.passed, report.checks.filter((check) => !check.passed).map((check) => check.detail).join("; ")).toBe(true);
  });

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
        expect(choice.impactSummary.trim().length).toBeGreaterThan(0);
        expect(choice.preview).not.toBe(choice.description);
        expect(choice.impactSummary).not.toBe(choice.description);
        expect(choice.visual.trim().length).toBeGreaterThan(0);
      }
    }

    const impactSummaries = mondayTurns.flatMap((turn) => turn.choices.map((choice) => choice.impactSummary));
    expect(impactSummaries).toHaveLength(15);
    expect(new Set(impactSummaries).size).toBe(15);
  });

  it("keeps energy and mood on seven segments without clamping performance text", () => {
    expect(getStatSegmentCount("energy", 78)).toBe(6);
    expect(getStatSegmentCount("mood", 64)).toBe(5);
    expect(formatPerformance(12)).toBe("+12");
    expect(formatPerformance(0)).toBe("0");
    expect(formatPerformance(-18)).toBe("-18");
  });

  it("maps performance to three negative segments, a zero point, and three positive segments", () => {
    expect(getPerformanceMeterSegments(-18)).toEqual([
      "empty", "empty", "negative", "zero", "empty", "empty", "empty"
    ]);
    expect(getPerformanceMeterSegments(0)).toEqual([
      "empty", "empty", "empty", "zero", "empty", "empty", "empty"
    ]);
    expect(getPerformanceMeterSegments(12)).toEqual([
      "empty", "empty", "empty", "zero", "positive", "empty", "empty"
    ]);
    expect(getPerformanceMeterSegments(-100)).toEqual([
      "negative", "negative", "negative", "zero", "empty", "empty", "empty"
    ]);
    expect(getPerformanceMeterSegments(130)).toEqual([
      "empty", "empty", "empty", "zero", "positive", "positive", "positive"
    ]);
  });

  it("persists the versioned intro marker and silently tolerates storage failures", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value)
    };

    expect(hasSeenIntro(storage)).toBe(false);
    expect(markIntroSeen(storage)).toBe(true);
    expect(values.get(INTRO_STORAGE_KEY)).toBe(INTRO_STORAGE_VALUE);
    expect(hasSeenIntro(storage)).toBe(true);

    const unavailableStorage = {
      getItem: () => {
        throw new Error("storage unavailable");
      },
      setItem: () => {
        throw new Error("storage unavailable");
      }
    };

    expect(hasSeenIntro(unavailableStorage)).toBe(false);
    expect(markIntroSeen(unavailableStorage)).toBe(false);
    expect(hasSeenIntro(null)).toBe(false);
    expect(markIntroSeen(null)).toBe(false);
  });

  it("creates one result presentation from real progress for page, poster, and share", () => {
    const strongPath = [0, 2, 0, 1, 0];
    const progress = mondayTurns.reduce((current, turn, index) => {
      return chooseMondayAction(current, turn.choices[strongPath[index]]);
    }, createMondayRun());
    const result = calculateMondayResult(progress);
    const stats = toStatViewModels(progress);
    const presentation = toResultPresentation(toResultViewModel(result, progress), stats, progress, mondayTurns);

    expect(stats.map((stat) => stat.kind)).toEqual([
      "score",
      "energy",
      "mood"
    ]);

    expect(presentation).toMatchObject({
      description: result.description,
      energy: progress.energy,
      keyChoice: {
        id: "closing-boundary",
        impactSummary: mondayTurns[4].choices[0].impactSummary,
        label: "说明明早处理"
      },
      mood: progress.mood,
      score: progress.score,
      todayEnding: result.title
    });
    expect(createResultShareText(presentation).split("\n")[0]).toBe(`我的今日周一人格：${presentation.personaLabel}`);
    expect(createResultShareText(presentation)).toContain(`“${presentation.personaQuote}”`);
    expect(createResultShareText(presentation)).toContain("今日结局：体面下班");
    expect(createResultShareText(presentation)).toContain("关键一手：说明明早处理");
    expect(createResultShareText(presentation)).toContain(
      `绩效 ${formatPerformance(progress.score)} · 能量 ${progress.energy}/100 · 心情 ${progress.mood}/100`
    );
    expect(createResultShareText({ ...presentation, score: -18 })).toContain(
      `绩效 -18 · 能量 ${progress.energy}/100 · 心情 ${progress.mood}/100`
    );
    expect(RESULT_POSTER_WIDTH).toBe(853);
    expect(RESULT_POSTER_HEIGHT).toBe(1844);
  });

  it("uses the last real choice before an early ending as the key choice", () => {
    const earlyPath = [2, 2, 1, 0];
    const progress = earlyPath.reduce((current, choiceIndex, turnIndex) => {
      return chooseMondayAction(current, mondayTurns[turnIndex].choices[choiceIndex]);
    }, createMondayRun());

    expect(isMondayRunComplete(progress)).toBe(true);
    expect(progress.turnIndex).toBeLessThan(mondayTurns.length);

    const result = calculateMondayResult(progress);
    const presentation = toResultPresentation(
      toResultViewModel(result, progress),
      toStatViewModels(progress),
      progress,
      mondayTurns
    );

    expect(progress.history.at(-1)).toBe("afternoon-triage");
    expect(presentation.keyChoice).toEqual({
      id: "afternoon-triage",
      impactSummary: mondayTurns[3].choices[0].impactSummary,
      label: "全部同时打开"
    });
  });
});
