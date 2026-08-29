# Monday Survival 阶段 9 发布就绪核对

> 状态：产品提交、GitHub 推送、CloudBase 部署与自动化 postflight 已完成；公开传播及新的部署后真机测试未执行
> 核对日期：2026-08-29（Asia/Shanghai）
> 项目根：`/Users/qzt/Developer/Game Lab/games/monday-survival`

## 1. 结论

阶段 9 的产品提交、GitHub 推送、CloudBase 部署与自动化 postflight 已完成。用户精确授权的产品提交为 `9a4ecfb`，目标仓库 `https://github.com/zitao4588-create/monday-survival.git` 的 `main` 已核对匹配；目标环境 `cloud1-d3g4v0ms8ee56bd94` 上传 9/9 文件、0 失败。默认域名与正式域名的三视口及满档案验收均通过，正式域名 `index.html` 指纹与本地构建一致。Android 未验证、有效反馈 0/8–12 等风险豁免仍保持原事实，不能描述为验证通过。

## 2. Git 发布基线

- 分支：`main`。
- 部署产品提交：`9a4ecfbc4ec3aa60f0c5e353c588bac4a205178c`（`Finalize viewport UI review`）。
- 部署时 `origin/main`：`9a4ecfbc4ec3aa60f0c5e353c588bac4a205178c`；`git ls-remote` 已独立核对。
- `9a4ecfb` 包含 9 个产品/验收文件与 3 份收尾文档；本报告的发布结果更新属于后续纯文档记录，不改变部署产物。
- `tmp/` 为未跟踪的本地取证目录，继续排除；不覆盖或清理用户现有取证文件。
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
- `pnpm deploy:cloudbase`：重新构建 1857 modules，CloudBase 9/9 文件上传、0 失败。
- `pnpm wechat:check:cloudbase`：默认域名 small iPhone、modern iPhone、目标舞台与满 5 条档案通过。
- 正式域名 `MS_WECHAT_BASE_URL=... pnpm wechat:check`：同一四组场景通过。
- 结果页人工批注闭环：小字位于虚线下方、人格标签移除、关键一手摘要尽量单行；853×1844 战报的小字固定两行并按海报中轴居中，三项指标保持在线框中央。
- iPhone 微信复测使用的 RC 构建时间与指纹是本轮 UI 审查前的历史证据，不替代部署版本的新真机验证。
- 完整复验摘要：`reports/adversarial-review-20260829/adversarial-review-report.md`。

## 4. 线上部署结果

- CloudBase 环境：`cloud1-d3g4v0ms8ee56bd94`。
- `tcb hosting detail`：静态托管状态 `online`，默认入口 `index.html`。
- `tcb hosting list`：部署后共 25 个对象；5 个 `__auth/` 对象与 `cloud-admin/index.html` 保留，未执行清理。
- 部署完成时间点：2026-08-29 23:06:57 +0800；9/9 文件上传、0 失败。
- CloudBase `index.html` ETag：`c630b090f64c2390273ebfbc18c90539`，与本地 MD5 一致。
- 正式域名 `https://monday.playgamelab.cn/index.html` SHA-256：`9a80ec81c3bbacc1fee8b88baa5b42fb950ca896706a29464b341788b9bb1bf9`，与本地一致。
- 默认域名自动化全流程通过；额外直接 `curl` 在 TLS 握手处失败，因此空内容哈希被明确丢弃，不作为成功证据。
- `tcb domains ls` 对该域名没有返回新的 HTTP Access Service 绑定记录；由于正式域名仍返回 CloudBase/COS 200，该空结果只记录为 CLI 证据边界，不推断域名失效。
- CloudBase CLI 已登录且可读取目标环境；版本为 `3.5.6-beta.0`。

部署前线上 ETag 为 `cb600787b1bd1e758d1de6e6ac194284`、对象数为 23；部署后两者分别更新为 `c630b090f64c2390273ebfbc18c90539` 与 25，形成可核对的前后证据。

## 5. 回滚基线

- 线上回滚 Git 目标：`6e3faedc6ca7b712d7fdbc2e76f121ac7666b6b9`（发布前稳定提交）。
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
| 产品 commit、GitHub push、CloudBase deploy 精确授权 | 用户已点名仓库、`main` 分支与 CloudBase 环境，三项均已执行并 postflight | 通过 |
| 公开传播、正式 QR | 未授权、未执行 | 待确认 |

## 7. 敏感与安全检查

- 对当前 11 个变更文本文件执行路径级 secret-shape 扫描：未命中 `sk-`、`mkt_` 或 Tencent `AKID` 形态。
- 未读取、输出或修改真实凭据。
- 未删除托管文件、未生成正式 QR、未向任何联系人或平台外发。
- 本轮本地预览 PID 39517 已以普通 SIGTERM 精确停止；4182、5180、5321、5322、5323 均无监听。

## 8. 下一决策

本次产品提交、推送与部署已经完成，无阻断性的自动化 postflight 遗留。若需要公开传播、生成正式 QR，或在部署版本上补做 iOS/Android 微信、朋友圈与相册验证，仍须按具体范围单独授权。

两项风险豁免不改变阶段 6 的历史状态：Android 仍是未验证，有效反馈仍是 0/8–12，也不能描述为“内测完成”或“阶段级 P0 清零”。此前 iPhone 微信证据见 `reports/stage9-release-20260829/rc-20260829-01.md`；该 RC 早于最后一轮 UI 调整和本次部署，因此不替代部署版本的新真机验证。
