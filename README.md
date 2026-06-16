# 今天你能活过周一吗

一个独立 H5 小游戏项目。玩家通过一组周一生存选择，在能量、心情和得分之间做取舍，尝试撑到下班。

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

## 当前边界

- 不接后端。
- 不接数据库。
- 不做登录。
- 不做支付。
- 先保持移动端优先。
