import { describe, expect, it } from "vitest";
import {
  calculateMondayResult,
  chooseMondayAction,
  createMondayRun,
  isMondayRunComplete,
  mondayTurns
} from "./game";

describe("monday-survival", () => {
  it("can complete a full run", () => {
    const progress = mondayTurns.reduce((current, turn) => {
      return chooseMondayAction(current, turn.choices[0]);
    }, createMondayRun());

    expect(isMondayRunComplete(progress)).toBe(true);
    expect(calculateMondayResult(progress).outcome).toBe("win");
  });

  it("can fail when bad choices drain the player", () => {
    const progress = mondayTurns.reduce((current, turn) => {
      return chooseMondayAction(current, turn.choices[2]);
    }, createMondayRun());

    expect(calculateMondayResult(progress).outcome).toBe("fail");
  });
});
