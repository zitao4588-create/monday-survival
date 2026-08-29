# Monday Survival 阶段 9 发布就绪核对

> 状态：发布前核对、当前候选 iPhone 微信复测和本轮 UI 审查完成；本地 `main` 有 2 个未推送提交，最新 UI 批次仍未提交；等待当前批次 commit 及 push/deploy/传播的分别授权
> 核对日期：2026-08-29（Asia/Shanghai）
> 项目根：`/Users/qzt/Developer/Game Lab/games/monday-survival`

## 1. 结论

阶段 9 的发布前核对、当前候选 iPhone 微信复测和本轮 UI 审查已经完成，但当前不能自动进入外部发布动作。用户于 2026-08-29 明确豁免 Android 真机与 8–12 人内测门槛，并接受 Android 未验证、有效反馈为 0/8–12 的风险。iPhone 微信关键路径无 P0；本地已有两个未推送提交，之后的最新 9 文件 UI 批次仍未提交。下一步须先取得该批次 commit 的精确授权；push、deploy 和传播范围仍分别授权。

## 2. Git 发布基线

- 分支：`main`。
- `HEAD`：`bbd0b0c`（`Fit UI to viewport and refine result layouts`）。
- `origin/main`：`6e3faedc6ca7b712d7fdbc2e76f121ac7666b6b9`。
- 本地与远端分歧：`0 2`；`d9a643b` 与 `bbd0b0c` 已在本地形成，但尚未 push。
- `bbd0b0c` 之后仍有 9 个产品/验收文件的未提交 UI 批次：`scripts/xhs-h5-check.mjs`、6 个 `src/` 文件、`src/styles/fixed-result.css` 与 `visual-report/current/result.png`；本次收尾另更新 3 份状态文档。
- `tmp/` 为未跟踪的本地取证目录，继续排除；不覆盖或清理用户现有取证文件。
- 当前最终 release commit 尚未冻结；只有取得当前批次 commit 授权后才冻结精确 allowlist。
- `git diff --check`：exit 0。

## 3. 自动化与构建证据

当前 UI 收尾批次的最终复验：

- `pnpm typecheck`：exit 0。
- `pnpm test`：18/18 通过。
- `pnpm build`：exit 0，1857 modules transformed。
- `pnpm stage7:path-check`：59,049 路径、13 种人格与全部门槛通过。
- Stage 8 专用三档浏览器回归：焦点、同步双击去重、事件、历史、声音、零外部请求通过。
- `pnpm xhs:check`：8 文件离线包、三档五回合和 853×1844 战报通过。
- `pnpm wechat:check`：small iPhone、modern iPhone、目标舞台与 small iPhone 满 5 条档案通过。
- `pnpm visual:check`：三页截图生成；全图人工检查无视觉回归。
- 结果页人工批注闭环：小字位于虚线下方、人格标签移除、关键一手摘要尽量单行；853×1844 战报的小字固定两行并按海报中轴居中，三项指标保持在线框中央。
- iPhone 微信复测使用的 RC 构建时间与指纹是本轮 UI 审查前的历史证据，不代表当前未提交 UI 批次。
- 完整复验摘要：`reports/adversarial-review-20260829/adversarial-review-report.md`。

## 4. 线上部署前快照

- CloudBase 环境：`cloud1-d3g4v0ms8ee56bd94`。
- `tcb hosting detail`：静态托管状态 `online`，默认入口 `index.html`。
- `tcb hosting list`：当前共 23 个对象；包含 5 个 `__auth/` 对象、`cloud-admin/index.html`、当前产品文件和多代哈希 bundle。
- 正式域名 `https://monday.playgamelab.cn/`：只读请求返回 HTTP 200。
- 线上 `index.html`：ETag `cb600787b1bd1e758d1de6e6ac194284`，Last-Modified `2026-08-26T12:49:45Z`，Content-Length 1043。
- 当前本地 `dist/index.html` 与线上 ETag 不一致，说明最新本地候选尚未部署。
- `tcb domains ls` 对该域名没有返回新的 HTTP Access Service 绑定记录；由于正式域名仍返回 CloudBase/COS 200，该空结果只记录为 CLI 证据边界，不推断域名失效。
- CloudBase CLI 已登录且可读取目标环境；版本为 `3.5.6-beta.0`。

以上线上证据是阶段 9 早前取得的时间点快照，本轮收尾未重新访问 CloudBase 或正式域名；不得把它描述为收尾时的实时状态。

## 5. 回滚基线

- 线上回滚 Git 目标：`6e3faedc6ca7b712d7fdbc2e76f121ac7666b6b9`（`origin/main` 当前指向；本地 `main` 已领先 2 个提交）。
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
| 当前 UI 批次 commit、push/deploy/公开传播精确授权 | 门槛豁免不自动授权外部动作；本地已有 2 个未推送提交，最新 UI 批次仍须单独授权 commit | 待确认 |

## 7. 敏感与安全检查

- 对当前 11 个变更文本文件执行路径级 secret-shape 扫描：未命中 `sk-`、`mkt_` 或 Tencent `AKID` 形态。
- 未读取、输出或修改真实凭据。
- 未删除托管文件、未生成正式 QR、未向任何联系人或平台外发。
- 本轮本地预览 PID 39517 已以普通 SIGTERM 精确停止；4182、5180、5321、5322、5323 均无监听。

## 8. 下一决策

Android 与内测门槛的风险覆盖已经记录。下一步先在用户精确授权后提交当前 9 文件 UI 批次；随后仍须分别授权，才能 push 到 GitHub、部署到 `cloud1-d3g4v0ms8ee56bd94`，以及在指定范围传播链接或 QR。

两项风险豁免不改变阶段 6 的历史状态：Android 仍是未验证，有效反馈仍是 0/8–12，也不能描述为“内测完成”或“阶段级 P0 清零”。当前候选 iPhone 微信证据见 `reports/stage9-release-20260829/rc-20260829-01.md`；该 RC 早于最后一轮 UI 调整。取得外部动作授权前，阶段 9 保持“发布前核对、iPhone 微信复测与 UI 审查完成，当前批次未提交”。
