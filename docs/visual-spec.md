# Monday Survival Visual Spec

## 目标

本轮视觉还原以 Product Design 的三张手机端参考图为准：

- `outputs/product-design/monday-survival-paper-triage/active-round.png`
- `outputs/product-design/monday-survival-paper-triage/choice-feedback.png`
- `outputs/product-design/monday-survival-paper-triage/result-share-card.png`

目标不是做普通网页卡片，而是做一个 426px x 922px 的手机游戏舞台。桌面端预览时，手机舞台居中显示，最大宽度固定为 426px。

## 视觉关键词

- 深色木桌背景
- 米色旧纸张
- 档案袋、票据和纸张分层
- 胶带、回形针、咖啡渍
- 剪角票据卡片
- 暗绿色主按钮
- 左侧编号色条
- 印刷线性图标
- 多层投影和压痕
- 强中文标题层级

## 页面状态

先做三个静态预览入口：

- `/?screen=round`
- `/?screen=feedback`
- `/?screen=result`

静态预览用于对照视觉图，不依赖真实游戏状态。当前阶段暂停真实游戏状态接入，默认入口 `/` 也展示 round 静态稿。视觉还原确认后，再把真实 `energy`、`mood`、`score`、回合、选项和结算接回同一组组件。

## 资产层

本轮开始引入明确的视觉资产层，避免继续用 CSS 假画全部质感。

- `src/assets/textures/wood.webp`：手机舞台和桌面背景。
- `src/assets/textures/paper-noise.png`：旧纸张颗粒。
- `src/assets/textures/paper-lines.svg`：纸张横线和印刷底纹。
- `src/assets/textures/coffee-stain.svg`：事件纸和结果卡上的咖啡渍。
- `src/assets/textures/tape.svg`：胶带装饰。
- `src/assets/props/clip.svg`：纸张回形针。
- `src/assets/props/binder-clip.svg`：桌面夹子道具。
- `src/assets/props/pen.webp`：桌面笔道具。
- `src/assets/icons/*.svg`：正式线性图标，包括水杯、闹钟、咖啡、通勤、能量、心情和得分。

## 组件分层

- `components/visual/GameStage`：页面桌面背景、手机舞台外壳、桌面道具和舞台约束。类名分层为 `ms-page`、`ms-stage-shell`、`ms-stage-content`，避免把舞台外壳和内容网格混在同一个 `.ms-stage` 上。
- `PaperHeader`：顶部纸质档案标题条。
- `StatGrid`：状态卡片网格，负责普通、反馈和结果三种排列修饰。
- `StatCard`：能量、心情、得分三张纸质状态卡。
- `EventPaper`：当前事件或反馈详情纸张。
- `ChoiceList`：选择票据列表。
- `ChoiceTicket`：三张选择票据，包含左侧编号色条和影响值。
- `TipNote`：回合页底部小贴士纸条。
- `SelectedReceipt`、`FeedbackPaper`、`NextEventPreview`、`ContinueButton`：选择反馈页的收据、反馈纸张、下一事件预告和继续按钮。
- `ResultFolder`、`ResultIllustration`、`EndingTitle`、`FinalStats`、`PersonaTag`、`ResultActions`：结果页档案、插图、结局标题、最终状态、人格标签和操作区。
- `RoundScreen`：主回合页编排层。
- `ChoiceFeedbackScreen`：选择反馈页编排层。
- `ResultScreen`：结果分享卡页编排层。
- `styles/paper-texture.css`：统一封装纸张质感和道具类。纸面使用 `ms-paper` / `ms-paper--light`，剪角使用 `ms-cut-corner`，票据阴影使用 `ms-ticket`，不要在单个组件里重复写纸纹背景。

## 实现约束

- 不改 `src/game.ts`、`src/data/*` 的游戏规则和数据结构。
- 不引入后端、数据库、复杂动画库。
- 不把参考图作为背景图。
- 正式图标优先使用 `src/assets/icons`，少量缺失的印章和勾选图标可暂时保留 inline SVG fallback。
- 视觉颜色、阴影和圆角统一从 `src/styles/visual-tokens.css` 取值；组件样式里不要直接散落 `#hex` 或 `rgba()` 随机颜色。
- 每个阶段完成后运行 `pnpm build`。
