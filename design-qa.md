# Monday Survival Fixed UI QA

## 当前实现

- 默认 `/`：使用 Fixed 选择、反馈和结果三页承载真实五回合流程。
- 静态对照入口：`/?screen=round`、`/?screen=feedback`、`/?screen=result`。
- 选择页展示 `choice.preview`；反馈页再展示 `choice.description` 和能量、心情、绩效变化。
- 选择/反馈页状态顺序为能量、心情、绩效；三项都有七段条，绩效文字保留真实带符号值且不显示 `/100`。
- 普通反馈页在下方纸卡用“结果说明”标记影响文案，不显示额外结算提示，也不得出现下一事件时间、标题、正文或插画；结束时显示“本周结算”。
- 结果页状态顺序为绩效、能量、心情，海报与分享文案沿用同一份真实绩效值。
- 结果页通过 Canvas 生成 `853 × 1844` PNG；小红书构建仅保留长按或系统截图提示，不提供下载和分享入口。

## 当前视觉基准

- `reference/current-round.png`
- `reference/choice-feedback.png`
- `reference/result-card.png`

`pnpm visual:check` 会重新生成：

- `visual-report/current/round.png`
- `visual-report/current/feedback.png`
- `visual-report/current/result.png`
- `visual-report/index.html`

## 验收入口

- 类型检查：`pnpm typecheck`
- 单元测试：`pnpm test`
- 生产构建：`pnpm build`
- 小红书离线五回合验收：`pnpm xhs:check`
- Fixed 三页截图与报告：`pnpm visual:check`
- 微信 H5 海报、下载与分享验收：`pnpm wechat:check`

浏览器验收应使用项目脚本启动的 Playwright 隔离 Chromium，并在结束后确认浏览器和 Vite 服务均已退出。

## 本次源码清理验证（2026-08-25）

- `pnpm typecheck`：通过。
- `pnpm test`：通过，1 个测试文件、7 项测试全部通过。
- `pnpm build`：通过，Vite 转换 60 个模块；产物只包含 Fixed 三张背景、木纹、favicon、CSS 和应用脚本。
- `pnpm xhs:check`：通过；375×667、390×844、426×922 三档视口均完成五回合、结果页、`853 × 1844` 海报和重开，零外部请求，preview 服务退出已确认。
- `pnpm wechat:check`：通过；三档移动视口完成普通 H5 海报、下载和分享文案验收。
- `pnpm visual:check`：通过；三张当前截图和 `visual-report/index.html` 已重新生成，人工查看未发现缺图、裁切或横向溢出。
- Game Lab 根 `pnpm test`：通过，4 个测试文件、12 项测试全部通过。
- Game Lab 根 `pnpm build`：通过，Monday Survival 及两个源码消费 app 均完成生产构建。
- Game Lab 根 Monday E2E：桌面 Chromium 与 mobile-chrome 2/2 通过。
- CloudBase 线上 `pnpm wechat:check:cloudbase`：通过；三档视口进入 Fixed 页面，目标视口完成五回合、结果图与分享状态，确认提示后的干净 reload 无控制台错误。
- CloudBase 发布文件：当前普通 H5 的 9 个文件均与本地 `dist/` 字节一致；远端旧项目资源已清理，平台管理文件保留。
- 端口 postflight：5180、5321、5322、5323 均无监听，未残留本轮 Vite、Playwright 或 Chromium 进程。
