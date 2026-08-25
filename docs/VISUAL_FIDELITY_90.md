# Monday Survival Visual Fidelity Goal

> 2026-08-25 状态注记：90% 目标已收敛为获批的 Fixed 三页静态框架 + React 动态内容实现。默认 `/` 是真实五回合流程，`?screen=round|feedback|result` 只用于静态截图。以下内容保留为历史目标与评分依据，不再要求回到旧组件实现。

## Objective

Improve the visual fidelity of games/monday-survival from the current 68%-72% level to a perceived 90%+ match against the Product Design references.

This is a visual fidelity task, not a gameplay refactor.

## References

Use these files as the visual source of truth:

- games/monday-survival/reference/current-round.png
- games/monday-survival/reference/choice-feedback.png
- games/monday-survival/reference/result-card.png

The implemented pages to compare:

- Round Screen
- Feedback Screen
- Result Screen

## Target Viewport

- Logical width: 426px
- Logical height: 922px
- Mobile-first
- Desktop preview should center the 426px stage
- Do not optimize for wide desktop layout

## Hard Constraints

- Do not rewrite game logic.
- Do not change event data shape unless necessary.
- The approved Fixed implementation may use cleaned reference imagery as a static frame, while all gameplay copy, values, choices, deltas, persona, result, and controls remain React-rendered.
- Do not use emoji as final icons.
- Do not introduce backend logic.
- Do not introduce large animation libraries.
- Keep React-rendered dynamic content.
- Keep the UI maintainable.

## Visual Direction

The target style is:

- warm wooden desk
- paper dossier
- old office survival report
- kraft paper
- paper texture
- cut-corner tickets
- tape
- paper clips
- binder clips
- pen
- coffee stains
- muted olive green
- warm yellow
- rust red
- heavy black Chinese headings
- printed line icons

## Scoring Rubric

Score each item from 0 to 10.

1. Mobile stage proportion
2. Wood desk background and prop layering
3. Main paper material quality
4. Header ticket fidelity
5. StatCard fidelity
6. EventPaper fidelity
7. ChoiceTicket fidelity
8. FeedbackScreen ritual feeling
9. ResultScreen share-card feeling
10. Typography, color, and shadow consistency

## Done When

- Total perceived visual score is at least 90/100.
- No single category is below 8/10.
- Round, Feedback, and Result screens all have updated screenshots.
- A side-by-side visual report is generated.
- pnpm build passes.
- Existing game state still works.
- The implementation remains componentized and maintainable.

## Priority Order

1. Improve shared visual tokens and paper texture.
2. Improve GameStage background and props.
3. Improve PaperHeader.
4. Improve StatCard.
5. Improve ChoiceTicket.
6. Improve FeedbackScreen.
7. Improve ResultScreen.
8. Reconnect and verify dynamic state.
9. Generate screenshots and visual report.
10. Self-review against the scoring rubric.
