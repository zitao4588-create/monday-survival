# 今天你能熬过周一吗

一个独立 H5 小游戏项目。玩家通过一组周一生存选择，在能量、心情和绩效之间做取舍，尝试撑到下班。

默认入口 `/` 使用获批的 Fixed 三页视觉框架承载真实五回合流程。选择页只展示行动预览，反馈页再揭示结果文案和数值变化；结局、人格、海报内容仍由现有游戏数据和结算逻辑动态生成。

## 本地运行

在仓库根目录运行：

```bash
pnpm install
pnpm dev
```

## 构建

```bash
pnpm build
```

构建产物会生成在 `dist/` 中，可以作为独立 H5 发布。

## 测试与验收

类型检查与普通 H5 构建：

```bash
pnpm typecheck
pnpm build
```

运行单元测试：

```bash
pnpm test
```

运行微信 H5 自动验收：

```bash
pnpm wechat:check
```

这个检查会自动启动本地 Vite 服务，并验证：

- 375x667、390x844、426x922 三档移动视口没有横向溢出。
- 玩家可以从当前回合一路选择到结果页。
- 结果页可以生成 `853 x 1844` 的 PNG 结果图。
- 结果图弹层里有下载图片入口，且分享文案按钮可以触发成功状态。

运行小红书离线五回合验收：

```bash
pnpm xhs:check
```

这个检查会生成独立的 `dist-xhs/`，并使用 Playwright 隔离 Chromium 串行验证 375x667、390x844、426x922 三档视口：

- 五回合选择、反馈、本周结算和重开流程；普通反馈将结果说明放在下方纸卡，不显示额外结算提示，也不泄露下一事件。
- 选择页不提前展示数值，反馈页才展示结果与 delta。
- 选择页和反馈页的三项状态都保留七段条；绩效文字显示真实带符号值，不显示 `/100`。
- 结果页生成 `853 x 1844` PNG 海报。
- 小红书版本不出现下载图片或分享文案入口，只提示长按图片或系统截图。
- 零外部请求、零运行错误、无横向溢出，且本轮 preview 服务退出。

生成视觉报告：

```bash
pnpm visual:check
```

报告输出在：

```txt
visual-report/index.html
visual-report/current/
```

视觉报告固定捕获三个静态对照入口：

- `/?screen=round`
- `/?screen=feedback`
- `/?screen=result`

这些入口只用于截图对照；默认 `/` 始终运行真实五回合流程。

## 结果页分享

当前结果页支持两条路径：

- 点击底部保存按钮生成结果图，微信里可长按图片保存。
- 在结果图弹层里点击“分享文案”，优先调用系统分享，不支持时退回复制文案。

这套实现是纯前端 Canvas，不需要后端、数据库或云函数。

## 微信 H5 部署

国内微信环境建议部署到腾讯云 CloudBase 静态网站托管。

CloudBase 构建配置：

- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`
- Output directory: `dist`

CLI 部署：

```bash
pnpm install --frozen-lockfile
pnpm deploy:cloudbase
pnpm wechat:check:cloudbase
```

当前命令固定部署到既有环境 `cloud1-d3g4v0ms8ee56bd94`。正式入口为 `https://monday.playgamelab.cn`；CloudBase 默认域名仅保留作部署诊断地址。首次使用或凭证过期时，先运行 `tcb login` 完成浏览器授权。

CloudBase 默认测试域名会先显示带倒计时的“页面访问提示”；线上验收会确认提示、进入游戏，再干净刷新一次，以区分平台提示页错误与游戏自身错误。

更多说明见 [CloudBase WeChat H5 Deployment](./docs/cloudbase-wechat-h5.md)。

部署后建议用手机微信真机检查：

- iOS 微信能否打开、游玩、结算。
- Android 微信能否打开、游玩、结算。
- 结果图是否能长按保存。
- 分享文案是否能复制或调起系统分享。
- 正式入口 `https://monday.playgamelab.cn` 是否能直接打开且不出现 CloudBase 默认域名提示。

正式传播准备见 [WeChat Release Prep](./docs/wechat-release-prep.md)。

正式域名、ICP 与 HTTPS 的完成状态见 [Domain, ICP, and HTTPS Status](./docs/domain-icp-action-plan.md)。

微信分享卡片规格见 [WeChat Share Card Spec](./docs/wechat-share-card-spec.md)。

找人内测时可以使用 [Inner Test Feedback Template](./docs/inner-test-feedback-template.md)。

## 当前边界

- 不接后端。
- 不接数据库。
- 不做登录。
- 不做支付。
- 先保持移动端优先。
