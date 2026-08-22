# 今天你能熬过周一吗

一个独立 H5 小游戏项目。玩家通过一组周一生存选择，在能量、心情和得分之间做取舍，尝试撑到下班。

当前游戏使用响应式组件 UI，Gen2–Gen5 的过程源码和资产仍保留用于回查。完整演进与 Git 历史边界见 [UI History](./docs/UI-HISTORY.md)。

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

生成视觉报告：

```bash
pnpm visual:check
```

报告输出在：

```txt
visual-report/index.html
visual-report/current/
```

## 结果页分享

当前结果页支持两条路径：

- 点击底部保存按钮生成结果图，微信里可长按图片保存。
- 在结果图弹层里点击“分享文案”，优先复制完整文案；剪贴板不可用时再尝试系统分享。

这套实现是纯前端 Canvas，不需要后端、数据库或云函数。

## 小红书离线构建

运行完整检查：

```bash
pnpm xhs:check
```

该命令会从干净输出目录构建 `dist-xhs/`，检查根入口、相对本地资源和禁用能力，并在 375x667、390x844、426x922 三档视口各完成五回合流程。小红书模式不包含下载、剪贴板、系统分享、外部请求或备案跳转，结果页只显示系统截图提示。

生成上传 ZIP 时，应打包 `dist-xhs/` 里面的内容，而不是打包目录本身：

```bash
cd dist-xhs
zip -r ../monday-survival-xhs-upload.zip . -x '.DS_Store' '__MACOSX/*' '._*'
```

完成后应确认 ZIP 根目录直接包含 `index.html`。普通 `dist/` 包含备案页脚和 H5 分享能力，不能替代小红书上传包。

## 微信 H5 部署

国内微信环境建议部署到腾讯云 CloudBase 静态网站托管。

CloudBase 构建配置：

- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`
- Output directory: `dist`

CLI 部署：

```bash
npm i -g @cloudbase/cli
tcb login
pnpm install --frozen-lockfile
pnpm build
tcb hosting deploy dist -e <env-id>
```

更多说明见 [CloudBase WeChat H5 Deployment](./docs/cloudbase-wechat-h5.md)。

部署后建议用手机微信真机检查：

- iOS 微信能否打开、游玩、结算。
- Android 微信能否打开、游玩、结算。
- 结果图是否能长按保存。
- 分享文案是否能复制或调起系统分享。
- CloudBase 默认测试域名的风险提醒页是否影响内测体验。

正式传播准备见 [WeChat Release Prep](./docs/wechat-release-prep.md)。

正式域名和 ICP 执行清单见 [Domain and ICP Action Plan](./docs/domain-icp-action-plan.md)。

微信分享卡片规格见 [WeChat Share Card Spec](./docs/wechat-share-card-spec.md)。

找人内测时可以使用 [Inner Test Feedback Template](./docs/inner-test-feedback-template.md)。

## 当前边界

- 不接后端。
- 不接数据库。
- 不做登录。
- 不做支付。
- 先保持移动端优先。
