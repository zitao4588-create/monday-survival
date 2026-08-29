import type { GameOutcome } from "./gameCore.ts";
import { applyChoice, createGameProgress, getOutcome } from "./gameCore.ts";
import { mondayTurnPeriods, mondayTurnPools } from "./data/turns.ts";
import { mondayPersonaLabels, toResultViewModel } from "./gameViewModels.ts";

const EXPECTED_PATHS = 59_049;

interface ValidationCheck {
  detail: string;
  id: string;
  passed: boolean;
}

interface EventMetric {
  failRate: number;
  failures: number;
  paths: number;
}

export interface Stage7PathValidationReport {
  checks: ValidationCheck[];
  generatedAt: string;
  metrics: {
    earlyEndings: {
      byEvent: Record<string, number>;
      byPeriod: Record<string, number>;
      byResource: Record<string, number>;
      total: number;
    };
    eventMetrics: Record<string, EventMetric>;
    outcomes: Record<GameOutcome, number>;
    outcomeRatios: Record<GameOutcome, number>;
    pathCount: number;
    reachablePersonas: string[];
  };
  passed: boolean;
  schemaVersion: 1;
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateContent() {
  const turns = mondayTurnPeriods.flatMap((period) => mondayTurnPools[period]);
  const choiceIds = turns.flatMap((turn) => turn.choices.map((choice) => choice.id));
  const complete = turns.length === 15
    && choiceIds.length === 45
    && new Set(turns.map((turn) => turn.id)).size === 15
    && new Set(choiceIds).size === 45
    && turns.every((turn) => hasText(turn.id)
      && hasText(turn.period)
      && hasText(turn.title)
      && hasText(turn.body)
      && turn.choices.length === 3
      && turn.choices.every((choice) => hasText(choice.id)
        && hasText(choice.label)
        && hasText(choice.preview)
        && hasText(choice.description)
        && hasText(choice.impactSummary)
        && hasText(choice.visual)
        && Number.isFinite(choice.effect.scoreDelta)
        && Number.isFinite(choice.effect.energyDelta)
        && Number.isFinite(choice.effect.moodDelta)
        && choice.tags.length > 0
        && choice.tags.every(hasText)));

  return { choiceCount: choiceIds.length, complete, turnCount: turns.length };
}

function findDominatedChoices() {
  return mondayTurnPeriods.flatMap((period) => mondayTurnPools[period]).flatMap((turn) => {
    return turn.choices.flatMap((choice) => {
      const values = [choice.effect.scoreDelta, choice.effect.energyDelta ?? 0, choice.effect.moodDelta ?? 0];
      const dominator = turn.choices.find((candidate) => {
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

      return dominator ? [`${turn.id}/${choice.id}<${dominator.id}`] : [];
    });
  });
}

function validateResourceInfluence() {
  const turns = mondayTurnPeriods.flatMap((period) => mondayTurnPools[period]);
  const choices = turns.flatMap((turn) => turn.choices);
  const dimensions = ["scoreDelta", "energyDelta", "moodDelta"] as const;
  const choiceCoverage = dimensions.every((dimension) => {
    const values = choices.map((choice) => choice.effect[dimension] ?? 0);
    return values.some((value) => value > 0) && values.some((value) => value < 0);
  });
  const boundaryFlips = {
    energy: getOutcome({ ...createGameProgress(), energy: 0 }) !== getOutcome({ ...createGameProgress(), energy: 1 }),
    mood: getOutcome({ ...createGameProgress(), mood: 0 }) !== getOutcome({ ...createGameProgress(), mood: 1 }),
    score: getOutcome({ ...createGameProgress(), score: -11 }) !== getOutcome({ ...createGameProgress(), score: -10 })
  };

  return {
    boundaryFlips,
    passed: choiceCoverage && Object.values(boundaryFlips).every(Boolean)
  };
}

export function runStage7PathValidation(now = new Date()): Stage7PathValidationReport {
  const actionsByPeriod = mondayTurnPeriods.map((period) => {
    return mondayTurnPools[period].flatMap((turn) => turn.choices.map((choice) => ({ choice, turn })));
  });
  const outcomes: Record<GameOutcome, number> = { fail: 0, survive: 0, win: 0 };
  const earlyByPeriod = Object.fromEntries(mondayTurnPeriods.map((period) => [period, 0]));
  const earlyByEvent = Object.fromEntries(
    mondayTurnPeriods.flatMap((period) => mondayTurnPools[period]).map((turn) => [turn.id, 0])
  );
  const earlyByResource = { energy: 0, mood: 0 };
  const eventMetrics = Object.fromEntries(
    mondayTurnPeriods.flatMap((period) => mondayTurnPools[period]).map((turn) => [turn.id, { failures: 0, paths: 0 }])
  ) as Record<string, { failures: number; paths: number }>;
  const reachablePersonas = new Set<string>();

  for (let pathNumber = 0; pathNumber < EXPECTED_PATHS; pathNumber += 1) {
    let encodedPath = pathNumber;
    const actionIndexes = actionsByPeriod.map(() => {
      const index = encodedPath % 9;
      encodedPath = Math.floor(encodedPath / 9);
      return index;
    });
    let progress = createGameProgress();
    let ended = false;

    for (let periodIndex = 0; periodIndex < actionIndexes.length; periodIndex += 1) {
      const action = actionsByPeriod[periodIndex][actionIndexes[periodIndex]];

      if (ended) {
        continue;
      }

      eventMetrics[action.turn.id].paths += 1;
      progress = applyChoice(progress, action.choice);
      if ((progress.energy <= 0 || progress.mood <= 0) && progress.turnIndex < mondayTurnPeriods.length) {
        ended = true;
        earlyByPeriod[action.turn.period] += 1;
        earlyByEvent[action.turn.id] += 1;
        if (progress.energy <= 0) earlyByResource.energy += 1;
        if (progress.mood <= 0) earlyByResource.mood += 1;
      }
    }

    const outcome = getOutcome(progress);
    const result = { outcome, title: outcome, description: outcome };
    outcomes[outcome] += 1;
    reachablePersonas.add(toResultViewModel(result, progress).personaLabel);

    for (let periodIndex = 0; periodIndex < actionIndexes.length; periodIndex += 1) {
      const action = actionsByPeriod[periodIndex][actionIndexes[periodIndex]];
      if (outcome === "fail" && periodIndex < progress.turnIndex) {
        eventMetrics[action.turn.id].failures += 1;
      }
    }
  }

  const content = validateContent();
  const dominatedChoices = findDominatedChoices();
  const resourceInfluence = validateResourceInfluence();
  const outcomeRatios = {
    fail: outcomes.fail / EXPECTED_PATHS,
    survive: outcomes.survive / EXPECTED_PATHS,
    win: outcomes.win / EXPECTED_PATHS
  };
  const normalizedEventMetrics = Object.fromEntries(Object.entries(eventMetrics).map(([eventId, metric]) => [
    eventId,
    { ...metric, failRate: metric.failures / metric.paths }
  ]));
  const earlyTotal = Object.values(earlyByPeriod).reduce((sum, count) => sum + count, 0);
  const maxEarlyEventShare = earlyTotal === 0
    ? 0
    : Math.max(...Object.values(earlyByEvent)) / earlyTotal;
  const earlyResourceTotal = Object.values(earlyByResource).reduce((sum, count) => sum + count, 0);
  const maxEarlyResourceShare = earlyResourceTotal === 0
    ? 0
    : Math.max(...Object.values(earlyByResource)) / earlyResourceTotal;
  const maxEventFailRate = Math.max(...Object.values(normalizedEventMetrics).map((metric) => metric.failRate));
  const unreachablePersonas = mondayPersonaLabels.filter((label) => !reachablePersonas.has(label));
  const checks: ValidationCheck[] = [
    { id: "path-count", passed: EXPECTED_PATHS === 9 ** 5, detail: `枚举 ${EXPECTED_PATHS} 条，目标 ${9 ** 5} 条` },
    { id: "content-fields", passed: content.complete, detail: `${content.turnCount} 事件，${content.choiceCount} 选择，ID 与必填字段完整` },
    { id: "no-pareto-dominance", passed: dominatedChoices.length === 0, detail: dominatedChoices.length === 0 ? "未发现全面支配" : dominatedChoices.join(", ") },
    { id: "three-resource-influence", passed: resourceInfluence.passed, detail: `选择正负影响完整；结局边界 ${JSON.stringify(resourceInfluence.boundaryFlips)}` },
    { id: "no-single-event-mass-loss", passed: maxEventFailRate <= 0.5, detail: `单事件条件失败率最高 ${(maxEventFailRate * 100).toFixed(2)}%（门槛 50%）` },
    { id: "outcome-distribution", passed: outcomeRatios.win >= 0.2 && outcomeRatios.win <= 0.25 && outcomeRatios.survive >= 0.45 && outcomeRatios.survive <= 0.55 && outcomeRatios.fail >= 0.25 && outcomeRatios.fail <= 0.3, detail: `赢 ${(outcomeRatios.win * 100).toFixed(2)}%，存活 ${(outcomeRatios.survive * 100).toFixed(2)}%，失败 ${(outcomeRatios.fail * 100).toFixed(2)}%` },
    { id: "early-ending-spread", passed: earlyTotal > 0 && earlyByResource.energy > 0 && earlyByResource.mood > 0 && maxEarlyResourceShare <= 0.85 && maxEarlyEventShare <= 0.5, detail: `提前结束 ${earlyTotal}；资源最大占比 ${(maxEarlyResourceShare * 100).toFixed(2)}%，事件最大占比 ${(maxEarlyEventShare * 100).toFixed(2)}%` },
    { id: "persona-reachability", passed: unreachablePersonas.length === 0, detail: unreachablePersonas.length === 0 ? `${reachablePersonas.size} 种人格全部可达` : `不可达：${unreachablePersonas.join("、")}` }
  ];

  return {
    checks,
    generatedAt: now.toISOString(),
    metrics: {
      earlyEndings: { byEvent: earlyByEvent, byPeriod: earlyByPeriod, byResource: earlyByResource, total: earlyTotal },
      eventMetrics: normalizedEventMetrics,
      outcomes,
      outcomeRatios,
      pathCount: EXPECTED_PATHS,
      reachablePersonas: [...reachablePersonas].sort()
    },
    passed: checks.every((check) => check.passed),
    schemaVersion: 1
  };
}

export function formatStage7PathValidationSummary(report: Stage7PathValidationReport) {
  const lines = [
    "# 阶段 7 路径验证摘要",
    "",
    `- 总结：${report.passed ? "通过" : "未通过"}`,
    `- 枚举路径：${report.metrics.pathCount.toLocaleString("en-US")}`,
    `- 结局：赢 ${report.metrics.outcomes.win} / 存活 ${report.metrics.outcomes.survive} / 失败 ${report.metrics.outcomes.fail}`,
    `- 可达人格：${report.metrics.reachablePersonas.length}`,
    "",
    "## 检查项",
    ""
  ];

  for (const check of report.checks) {
    lines.push(`- [${check.passed ? "x" : " "}] ${check.id}：${check.detail}`);
  }

  return `${lines.join("\n")}\n`;
}
