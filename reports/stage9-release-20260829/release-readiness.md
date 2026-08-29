# Monday Survival 阶段 9 发布就绪核对

> 状态：发布前核对与当前候选 iPhone 微信复测完成；Android 与 8–12 人内测门槛均已由用户明确豁免，当前等待外部动作的分别精确授权
> 核对日期：2026-08-29（Asia/Shanghai）
> 项目根：`/Users/qzt/Developer/Game Lab/games/monday-survival`

## 1. 结论

阶段 9 已启动，但当前不能自动进入外部发布动作。自动化门已通过，Git、CloudBase 和正式域名的实时基线也已取得。用户于 2026-08-29 明确豁免阶段 9 的 Android 真机门槛与 8–12 人内测门槛，并接受 Android 未验证、有效反馈为 0/8–12 的风险；当前候选 iPhone 微信已完成首次引导、两局五回合、两种结果、战报生成/保存链路、本地档案、声音听感、完全关闭微信后的状态持久化与重玩复测。当前只剩对 commit、push、deploy 和传播范围的分别精确授权。

## 2. Git 发布基线

- 分支：`main`。
- `HEAD`：`6e3faedc6ca7b712d7fdbc2e76f121ac7666b6b9`。
- `origin/main`：`6e3faedc6ca7b712d7fdbc2e76f121ac7666b6b9`。
- `git fetch origin --prune`：exit 0；本地与远端分歧 `0 0`。
- 当前尚无阶段 3–8 的目标 release commit；它们仍在 dirty worktree。
- 提交前实时盘点：25 个 tracked 文件有修改；145 个 untracked 文件，其中 98 个位于本地 `tmp/` 取证目录并排除，47 个位于候选发布/正式证据范围。
- 提交范围原则：仅在门槛与授权满足后冻结精确 allowlist；默认不提交 `tmp/`，不覆盖或清理用户现有取证文件。
- `git diff --check`：exit 0。

## 3. 自动化与构建证据

当前产品代码在阶段 9 启动前已完成最终复验，此后只更新文档：

- `pnpm typecheck`：exit 0。
- `pnpm test`：18/18 通过。
- `pnpm build`：exit 0，1860 modules transformed。
- `pnpm stage7:path-check`：59,049 路径、13 种人格与全部门槛通过。
- Stage 8 专用三档浏览器回归：焦点、同步双击去重、事件、历史、声音、零外部请求通过。
- `pnpm xhs:check`：8 文件离线包、三档五回合和 853×1844 战报通过。
- `pnpm wechat:check`：三个移动视口通过。
- `pnpm visual:check`：三页截图生成；全图人工检查无视觉回归。
- iPhone 微信复测使用的 RC 构建时间：2026-08-29 20:18:23 +0800。提交前于 21:21:59 再次生产构建，内容指纹保持一致：MD5 `ec8b35df2f8474e702153b6086b41f3b`；SHA-256 `ebe6933044e05a16416e898247dabd496af22e51c642a6b7af09937edaa08772`。
- 提交前复验：`pnpm typecheck`、18/18 单测、生产构建（1860 modules）与 59,049 路径检查均 exit 0。
- 完整复验摘要：`reports/adversarial-review-20260829/adversarial-review-report.md`。

## 4. 线上部署前快照

- CloudBase 环境：`cloud1-d3g4v0ms8ee56bd94`。
- `tcb hosting detail`：静态托管状态 `online`，默认入口 `index.html`。
- `tcb hosting list`：当前共 23 个对象；包含 5 个 `__auth/` 对象、`cloud-admin/index.html`、当前产品文件和多代哈希 bundle。
- 正式域名 `https://monday.playgamelab.cn/`：只读请求返回 HTTP 200。
- 线上 `index.html`：ETag `cb600787b1bd1e758d1de6e6ac194284`，Last-Modified `2026-08-26T12:49:45Z`，Content-Length 1043。
- 当前本地 `dist/index.html` 与线上 ETag 不一致，说明阶段 3–8 当前候选尚未部署。
- `tcb domains ls` 对该域名没有返回新的 HTTP Access Service 绑定记录；由于正式域名仍返回 CloudBase/COS 200，该空结果只记录为 CLI 证据边界，不推断域名失效。
- CloudBase CLI 已登录且可读取目标环境；版本为 `3.5.6-beta.0`。

## 5. 回滚基线

- 上一稳定 Git 目标：`6e3faedc6ca7b712d7fdbc2e76f121ac7666b6b9`（`main` 与 `origin/main` 当前共同指向）。
- 线上发布前指纹：`index.html` ETag `cb600787b1bd1e758d1de6e6ac194284`；托管对象 23 个。
- 回滚方式：在独立临时 worktree 构建 `6e3faed`，重新部署其完整 `dist/`，随后复查正式域名与微信流程；不对当前 dirty worktree 执行 reset、clean 或 checkout。
- 不自动删除历史哈希 bundle；`__auth/` 与 `cloud-admin/` 必须保留。若未来确需清理，必须先列出准确对象并取得单独删除授权。

## 6. 未满足的进入门槛

| 门槛 | 当前事实 | 状态 |
|---|---|---|
| 自动验收全部通过 | 当前候选的类型、单测、构建、路径、XHS、微信 H5、视觉与对抗回归均通过 | 通过 |
| 当前候选 iOS 微信真机 | `RC-20260829-01` 已完成首次引导、两局五回合、结果、战报、本地档案、声音听感、完全重开持久化与重玩；未发现 P0 | 通过 |
| 当前候选 Android 微信真机 | 无记录；用户于 2026-08-29 明确豁免阶段 9 的该门槛 | 豁免，不等于通过 |
| Android Chrome/朋友圈/相册 | 未完成；纳入同一 Android 风险豁免 | 豁免，不等于通过 |
| iOS 朋友圈、相册与完全重开 | 微信完全重开通过；战报 PNG 查看与用户确认保存通过；朋友圈未测，照片图库最终资产未由 Codex 独立打开核对 | 部分未满足，不影响已完成的微信关键路径结论 |
| 8–12 份定向内测 | 当前为 0/8–12；用户于 2026-08-29 明确豁免该进入门槛 | 豁免，不等于完成 |
| 内测无 P0 | 无 8–12 人样本，不能宣称阶段级 P0 清零；用户通过同一豁免接受该证据缺口 | 豁免，不等于清零 |
| commit/push/deploy/公开传播精确授权 | 门槛豁免不自动授权外部动作；四类范围仍需分别明确 | 待确认 |

## 7. 敏感与安全检查

- 对当前变更范围的文本文件执行路径级 secret-shape 扫描：未命中 `sk-`、`mkt_` 或 Tencent `AKID` 形态。
- 未读取、输出或修改真实凭据。
- 未删除托管文件、未生成正式 QR、未向任何联系人或平台外发。

## 8. 下一决策

Android 与内测门槛的风险覆盖已经记录。下一步仅在用户分别明确授权后，才能执行：创建 release commit、push 到 GitHub、部署到 `cloud1-d3g4v0ms8ee56bd94`，以及在指定范围传播链接或 QR。

两项风险豁免不改变阶段 6 的历史状态：Android 仍是未验证，有效反馈仍是 0/8–12，也不能描述为“内测完成”或“阶段级 P0 清零”。当前候选 iPhone 微信证据见 `reports/stage9-release-20260829/rc-20260829-01.md`；取得外部动作授权前，阶段 9 保持“发布前核对与 iPhone 微信复测完成、等待授权”。
