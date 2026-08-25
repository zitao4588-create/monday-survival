# Monday Survival 协作补充规则

继承 `/Users/qzt/Developer/Game Lab/AGENTS.md`，并追加以下项目级约束。

## 浏览器验收稳定性

- 默认禁止使用 Codex 的外部 Chrome 控制、Computer Use Chrome 或应用内 Browser 会话执行本项目的自动化验收；除非用户明确要求现场操作某个可见浏览器窗口。
- 功能与移动端流程验收优先运行项目自带的无界面脚本：`pnpm xhs:check`。静态三页截图优先运行：`pnpm visual:check`，随后用本地图片查看工具检查产物。两者默认使用 Playwright 隔离 Chromium，不调用系统 Chrome。
- 同一时间只允许一套 Monday Survival 浏览器验收运行；不要让主会话和子代理并行启动浏览器或占用同一端口。
- 启动验收前先确认目标端口未被旧服务占用；验收结束后必须确认本轮浏览器和本轮启动的 Vite 服务均已退出。
- 浏览器工具调用完成后，如果任务连续两次状态快照都没有新命令或新消息，应判定为僵尸 `active`；停止在旧任务继续写入，改用新任务只完成已授权的剩余范围。

## 验收入口

- 类型检查：`pnpm typecheck`
- 生产构建：`pnpm build`
- 小红书离线五回合验收：`pnpm xhs:check`
- 三个固定页面截图与报告：`pnpm visual:check`
