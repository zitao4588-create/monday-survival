# 今天你能活过周一吗

一个独立 H5 小游戏项目。玩家通过一组周一生存选择，在能量、心情和得分之间做取舍，尝试撑到下班。

## 本地运行

在仓库根目录运行：

```bash
pnpm dev
```

## 构建

```bash
pnpm build
```

构建产物会生成在 `dist/` 中，可以作为独立 H5 发布。

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

## 当前边界

- 不接后端。
- 不接数据库。
- 不做登录。
- 不做支付。
- 先保持移动端优先。
