# Monday Survival 对抗性审查报告

> 状态：执行完成；ZR-001 与 ZR-002 已修复并通过全量复验
> 审查工具：ZCode GLM-5.3 max（前段）+ Codex 主会话接手（后段）
> 隔离 workspace：`/private/tmp/monday-survival-zcode-review-20260828-9vgOqL`
> 开始/结束时间：2026-08-28 23:26:02 +0800 / 2026-08-29 00:11:43 +0800

## 1. 执行摘要

- 原始发现：P0 0、P1 1、P2 1
- 当前未关闭：P0 0、P1 0、P2 0
- Hypothesis：0
- 审查结论：15 个攻击面均已执行或完成证据边界核对；原始审查发现的首次引导焦点 P1 和事件去重 P2 已完成最小修复，并通过专用回归与最终全量门。产品自动化范围内的对抗性审查关闭门已通过。
- 产品源码 before/after manifest：72/72 完全一致，`cmp` exit 0。
- 5180/5321/5322/5323 postflight：均无监听。
- 是否实施修复：是；仅修改首次引导焦点管理、继续动作防重入和对应回归断言，未扩大产品范围。

## 2. 证据覆盖

| 攻击面 | 状态 | 运行证据 | 证据缺口 |
|---|---|---|---|
| AR-01 内容与 schema | 通过 | `zr-mutations-run.log`：47 套件中的 5 项内容/schema 检查；15 事件、45 选择、ID/字段/长度/标签均合法 | 无 |
| AR-02 周种子与时间 | 通过 | 固定时钟、ISO 年界、Asia/Shanghai 周切换、156 周单调与回拨检查 | 未做实体设备手动改时钟 |
| AR-03 跨回合回响 | 通过 | 三组回响、冲突优先级、源对象不可变和跨局不残留检查 | 无 |
| AR-04 59,049 验证器 | 通过 | `zr-path-independence-run.log` 9/9；独立枚举、2,000 随机路径+243 基线路径、13 人格及报告三方一致 | 无 |
| AR-05 本地历史 | 通过 | 损坏 JSON、版本、6 条、敏感字段白名单、存储异常、清除/重复保存/刷新检查 | 多标签页脚本中的直接旧快照覆盖不是当前产品写入路径，已排除为 finding |
| AR-06 隐私边界 | 通过 | 历史只保留 7 个白名单字段；事件 payload 为基础类型；源码无统计 SDK/远端发送能力 | 普通 H5 构建含 Vite 自带 modulepreload polyfill，见排除项 |
| AR-07 声音 | 浏览器/单元通过 | AudioContext 缺失、构造失败、resume reject、复用及默认关闭；三档 opt-in 通过 | 实体 Safari/微信实际听感未验证 |
| AR-08 动效 | 通过 | Stage 8 三档浏览器脚本验证 1 秒强调时序及 reduced-motion 无残留动画；视觉检查 exit 0 | 实体设备感知未验证 |
| AR-09 事件合同 | 修复通过 | 最终反馈同步双击现在只产生 1 个 `feedback_continue`；其余分享与事件合同保持通过 | 实体设备真实快速连点仍属于真机边界 |
| AR-10 离线与外部能力 | 通过 | XHS 两轮三档 exit 0；产物无 fetch/XHR/Beacon/WebSocket/share/clipboard；浏览器请求监听无非 loopback 请求 | React 错误链接及 SVG namespace 为不可执行字符串 |
| AR-11 结果一致性 | 通过 | 固定路线页面/战报/分享/历史共用 presentation；853x1844 PNG、提前结束关键一手及重载历史一致 | 无 |
| AR-12 可访问性 | 修复通过 | 首次引导挂载后主动聚焦“开始上班”，Tab/Shift+Tab 均保持在唯一操作按钮；原有 inert、档案/战报焦点、Esc、44px 和三档溢出继续通过 | 实体 VoiceOver/TalkBack 仍未验证 |
| AR-13 可玩性与恢复 | 通过并发现事件 P2 | 双击最终按钮仍只产生 1 个结果页和 1 条历史；海报双击只生成 1 次；刷新回到可玩回合并保留历史；无控制台错误 | 浏览器返回键无路由状态可恢复，未单列 finding |
| AR-14 测试确定性 | 通过 | XHS 两轮及普通 H5 两轮均 exit 0；XHS 文件名/大小一致，仅构建耗时不同；所有端口释放 | 无 |
| AR-15 真机证据边界 | 边界完成 | 仅引用既有 iPhone Safari/微信记录；浏览器证据未冒充真机 | Android、朋友圈、相册最终资产、声音听感、刷新/完全重开及 8–12 份反馈仍未验证 |

## 3. Findings

### ZR-001 — 首次引导 modal 未将焦点移入且未形成焦点循环

- 严重级别：P1
- 状态：fixed_verified
- 置信度：high
- 当前文件与行号：`src/components/fixed-intro/FixedIntroOverlay.tsx:8-31`；`src/MondaySurvivalGame.tsx:94-106`
- 前置条件：首次进入普通 H5，键盘或辅助技术导航，390×844。
- 复现命令：`node review-output/codex-browser-adversarial.mjs`
- exit code：0
- 预期：modal 打开后焦点位于对话框内；Tab/Shift+Tab 不离开 modal。
- 原始实际：初始焦点为 `BODY`；第一次 Tab 才到“开始上班”，第二次 Tab 又回到 `BODY`。背景 inert、按钮 279.2×51.3px 和横向溢出为 0 均正常。
- 证据：`codex-browser-adversarial-evidence.json#introFocus`、`codex-intro-focus.png`。
- 用户影响：键盘/屏幕阅读器用户缺少明确的 modal 进入上下文，焦点可越出对话框。
- 最小修复方向：挂载后聚焦开始按钮，并在 dialog 内处理 Tab/Shift+Tab 循环。
- 已实施修复：`FixedIntroOverlay` 为开始按钮增加 ref，挂载后使用 `focus({ preventScroll: true })`，并在 dialog 内拦截 Tab/Shift+Tab 后将焦点保持在唯一操作按钮。
- 修复证据：`scripts/xhs-h5-check.mjs` 增加初始焦点、Tab、Shift+Tab 三项断言；专用 Stage 8 三档浏览器脚本与 `pnpm xhs:check` 均通过。
- 未验证边界：未在实体 VoiceOver/TalkBack 复现。

### ZR-002 — 最终反馈按钮快速双击会重复发出 feedback_continue

- 严重级别：P2
- 状态：fixed_verified
- 置信度：high
- 当前文件与行号：`src/MondaySurvivalGame.tsx:185,308,326-343`；`src/components/fixed-feedback/FixedFeedbackScreen.tsx:214-231`
- 前置条件：第五回合最终反馈；React 提交下一屏前同步触发两次可见按钮 click。
- 复现命令：`node review-output/codex-browser-adversarial.mjs`
- exit code：0
- 预期：一次逻辑操作只发一个 `feedback_continue`。
- 原始实际：产生两个相同的 `round=5, screen=result` 事件；`result_view` 和历史仍各为 1。
- 证据：`codex-browser-adversarial-evidence.json#doubleFinal`。
- 用户影响：当前不破坏主流程；若未来接入统计，会高估最终继续次数。
- 最小修复方向：为 `continueRun` 增加同步 ref/过渡锁，页面内与固定按钮共用。
- 已实施修复：`continueRun` 在任何状态更新和事件发送前取得同步 ref 锁；每次进入新反馈页时重置该锁。
- 修复证据：专用 Stage 8 脚本对最终可见按钮同步执行两次 `click()`，事件合同仍严格得到 `feedback_continue=5`、`result_view=1`、历史条目 1，三个移动视口全部通过。
- 未验证边界：尚未在实体设备上通过真实快速连点复现。

## 4. 被证据排除的高风险假设

| 假设 | 排除证据 | 命令/产物 |
|---|---|---|
| 普通构建唯一的 `fetch(` 是产品远端发送能力 | 精确片段与 Vite 6.4.3 `modulepreload` polyfill 源码一致，只对同页 `link[rel=modulepreload]` 的 `href` 请求；XHS 配置明确关闭该 polyfill | `vite.config.ts:9-12`；`node_modules/vite/dist/node/chunks/dep-Dm0c1Wj2.js:36098-36135`；`zr-network-scan-dist.txt` |
| 分享取消/失败会误发 `share_completed` | 5 次 attempted 中仅 native 成功、fallback clipboard 成功和并发 native 成功产生 3 次 completed；取消与无 API 不产生 completed | `codex-browser-adversarial-evidence.json#shareSummary` |
| 最终按钮双击会重复保存历史或重复结果页 | 同一复现中 `result_view=1`、`historyEntryCount=1`；海报双击 `generatedCount=1` | `codex-browser-adversarial-evidence.json#doubleFinal`、`#doublePoster` |
| 多标签页会由当前保存函数稳定丢记录 | 产品 `saveLocalHistoryEntry` 每次写入前重新读取存储；变异脚本的丢失结果来自直接手工写入旧快照，当前 UI 没有该路径 | `src/localHistory.ts:103-123`；`zr-mutations.checks.ts:543-564` |
| 59,049 验证器与产品共享同一错误 oracle | 独立实现覆盖 59,049、2,243 条逐路径抽样、报告分布、提前结束、人格与事件口径均一致 | `zr-path-independence-run.log` |

## 5. 未验证项

- 实体 Safari/微信中的声音实际听感、静音状态和用户手势限制。
- iPhone 微信相册最终资产、刷新与完全重开。
- Android 微信聊天、朋友圈、Android Chrome。
- iPhone 朋友圈。
- 8–12 份真实内测反馈。
- 既有 UX-IOS-01（Safari 反馈页同名继续按钮重叠/一次未响应）尚未在阶段 8 当前代码上真机复测。

## 6. 命令与环境摘要

- 完整命令日志：`review-output/command-log.txt`
- 机器可读 findings：`review-output/adversarial-review-findings.json`
- before manifest：`review-input/source-manifest-before.sha256`
- after manifest：`review-output/source-manifest-after.sha256`
- 两份 manifest：72 行逐字节一致。
- 端口 postflight：5180、5321、5322、5323 均无监听。
- 外部网络请求：对抗脚本监听到 0 个非 loopback 请求；XHS 产物无主动网络 API。

## 7. 修复复验

- `pnpm typecheck`：exit 0。
- `pnpm test`：18/18 通过。
- `pnpm build`：exit 0，1860 modules transformed。
- `pnpm stage7:path-check`：59,049 路径、13 种人格与全部分布门槛通过。
- `node tmp/design-qa/stage8-qa-20260828/stage8-browser-check.mjs`：三档通过；初始焦点与同步双击回归断言通过；零外部请求；5323 已释放。
- `pnpm xhs:check`：8 文件离线产物及三档五回合/853×1844 战报通过；新增焦点断言通过。
- `pnpm wechat:check`：三个移动视口通过。
- `pnpm visual:check`：round、feedback、result 捕获与报告生成通过；三张全图人工复核未发现视觉回归。
- `git diff --check`：exit 0。
- 5180、5321、5322、5323 postflight：均无监听。

## 8. 最终声明

- [x] 所有 finding 均引用真实存在的文件和行号。
- [x] P0/P1 均有真实复现或直接源码闭环。
- [x] 浏览器模拟未冒充实体设备证据。
- [x] 原只读审查阶段的产品源码 before/after manifest 一致；后续修复由用户另行授权并已记录。
- [x] 5180、5321、5322、5323 均已释放。
- [x] ZR-001 与 ZR-002 均已修复并通过受影响套件及最终全量门。
- [x] 真机声音、Android、朋友圈、相册最终资产与真实内测仍明确保留为未验证项。
