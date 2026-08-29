import type { GameTurn } from "./gameCore";
import { mondayTurnPeriods, mondayTurnPools } from "./data/turns";

const DAY_MS = 86_400_000;
const WEEK_MS = DAY_MS * 7;

interface CivilDate {
  day: number;
  month: number;
  year: number;
}

export interface NaturalWeekSelection {
  eventIndexes: number[];
  turns: GameTurn[];
  weekKey: string;
  weekStart: string;
}

function getCivilDate(date: Date, timeZone: string): CivilDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    day: Number(values.day),
    month: Number(values.month),
    year: Number(values.year)
  };
}

function toIsoDate(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function getMondayTimestamp(civilDate: CivilDate) {
  const timestamp = Date.UTC(civilDate.year, civilDate.month - 1, civilDate.day);
  const weekday = new Date(timestamp).getUTCDay();
  const daysSinceMonday = (weekday + 6) % 7;
  return timestamp - daysSinceMonday * DAY_MS;
}

function getIsoWeekKey(mondayTimestamp: number) {
  const thursday = new Date(mondayTimestamp + 3 * DAY_MS);
  const weekYear = thursday.getUTCFullYear();
  const firstWeekMonday = getMondayTimestamp({ year: weekYear, month: 1, day: 4 });
  const weekNumber = Math.floor((mondayTimestamp - firstWeekMonday) / WEEK_MS) + 1;

  return `${weekYear}-W${String(weekNumber).padStart(2, "0")}`;
}

export function getNaturalWeekSelection(
  date = new Date(),
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
): NaturalWeekSelection {
  const mondayTimestamp = getMondayTimestamp(getCivilDate(date, timeZone));
  const weekOrdinal = Math.floor(mondayTimestamp / WEEK_MS);
  const eventIndexes = mondayTurnPeriods.map((period, periodIndex) => {
    const poolSize = mondayTurnPools[period].length;
    return ((weekOrdinal + periodIndex * 2) % poolSize + poolSize) % poolSize;
  });

  return {
    eventIndexes,
    turns: mondayTurnPeriods.map((period, index) => mondayTurnPools[period][eventIndexes[index]]),
    weekKey: getIsoWeekKey(mondayTimestamp),
    weekStart: toIsoDate(mondayTimestamp)
  };
}

export function getMondayTurnsForDate(date = new Date(), timeZone?: string) {
  return getNaturalWeekSelection(date, timeZone).turns;
}
