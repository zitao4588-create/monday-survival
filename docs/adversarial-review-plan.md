# Monday Survival 对抗性审查计划

> 状态：执行完成；原始 1 个 P1、1 个 P2 已修复并通过全量复验，当前未关闭 P0/P1/P2 为 0
> 日期：2026-08-28
> 适用范围：阶段 3–8 的当前 dirty worktree
> 启动条件：已由用户明确授权，并在隔离副本完成

## 1. 审查目标与边界

目标不是重复正常验收，而是主动寻找那些在正常路径看不出来、但会让结果错误、隐私越界、可访问性失效或测试产生假绿的问题。

- 审查员只读，不修改源码、测试、文档、Git、远端或本地存储。
- 不 commit、push、deploy、删除、登录、外发或接入线上统计。
- 不把 Playwright 结果冒充微信或实体设备结论。
- 阶段 6 尚未完成的 Android、朋友圈、相册最终核对和 8–12 份反馈保持原状态。
- 端口 4173 若属于其他工作区，不得停止；Monday Survival 验收仅使用并清理自己的 5321–5323。
- 审查结论只允许三种：有可复现证据的 finding、由证据排除、未验证。推测不得写成缺陷。

## 2. 审查前证据包

启动前由主会话提供以下只读证据；任何缺失项都必须在报告中标为证据缺口：

- `git status --short`、`git diff --stat`、`git diff --check` 和完整 diff。
- `EXECUTION_PLAN.md`，尤其是阶段 6–8 的事实、门槛覆盖和遗留项。
- `reports/stage7-path-validation.json` 与 `reports/stage7-path-validation.md`。
- `src/data/turns.ts`、`src/weeklyTurns.ts`、`src/stage7PathValidation.ts`。
- `src/localHistory.ts`、`src/sound.ts`、`src/productEvents.ts`。
- `src/MondaySurvivalGame.tsx`、结果/反馈组件与对应样式。
- `src/game.test.ts`、`scripts/stage7-path-check.mjs`、`scripts/xhs-h5-check.mjs`、`scripts/wechat-h5-check.mjs`。
- 阶段 7 最长文案截图、阶段 8 检查点、独立三档浏览器截图与 `visual-report/current/`。
- 最终实际运行日志：typecheck、test、build、path-check、xhs、wechat、visual 以及端口 postflight。

## 3. 攻击面与必须回答的问题

| ID | 攻击面 | 对抗性问题 | 最低证据 |
|---|---|---|---|
| AR-01 | 内容与 schema | 缺字段、重复 ID、空文本、超长中文、异常标签是否被静默带入产品或验证器？ | 最小复现数据、实际失败断言或源码路径 |
| AR-02 | 周种子与时间 | 本地时区、ISO 周年界、周日/周一切换、系统时间回拨、刷新后是否选中错误周？ | 固定时钟矩阵及预期/实际 weekKey |
| AR-03 | 跨回合回响 | 多标签同时存在时优先级是否稳定；回响是否污染基础数据或错误跨局继承？ | 至少覆盖三组回响和冲突标签的复现 |
| AR-04 | 59,049 验证器 | 验证器是否与产品共用同一个错误 oracle；被支配判断、人格可达、结果比例是否可能假绿？ | 独立重算一个样本集并核对报告总数/比例 |
| AR-05 | 本地历史 | 损坏 JSON、旧版本、quota/security 异常、重复保存、超过 5 条、清除、刷新、多标签页竞争是否安全降级？ | localStorage 变异测试和白名单字段检查 |
| AR-06 | 隐私边界 | 历史和事件是否含姓名、账号、设备标识、原始自由文本或网络发送能力？ | 源码网络 API 扫描、存储快照和事件 payload 清单 |
| AR-07 | 声音 | 默认关闭是否真实；是否只在用户手势后创建上下文；unsupported/suspended/resume 失败是否破坏主流程？ | AudioContext 假实现与真实设备未验证项分开 |
| AR-08 | 动效 | 数值、危险、继续强调的时序是否符合合同；reduced-motion 下是否仍有动画或位移？ | 计算样式/时序断言和 reduced-motion 对照 |
| AR-09 | 事件合同 | view/change 事件是否重复、乱序、跨局残留；取消/失败分享是否错误产生 `share_completed`？ | 完整事件序列、次数和失败/取消分支 |
| AR-10 | 离线与外部能力 | 小红书构建是否出现外部请求、下载、系统分享或远端统计旁路？ | 请求日志为零及产物扫描 |
| AR-11 | 结果一致性 | 页面、战报、复制分享、本地历史是否来自同一局、同一人格、同一三项数值和关键选择？ | 同一路线四份输出逐字段对照 |
| AR-12 | 可访问性 | 三档视口的触控区、焦点进入/陷阱/返回、Esc、背景 inert、横向溢出和短屏悬浮层是否都成立？ | 每种实际可见入口的浏览器证据 |
| AR-13 | 可玩性与恢复 | 刷新、返回、重玩、重复点击、生成中再点击、存储异常时是否白屏、卡死或重复记录？ | 状态转换复现和控制台记录 |
| AR-14 | 测试确定性 | 测试是否冻结时间/时区；断言是否绑定陈旧单周内容；Vite/Chromium 是否可能残留或假退出？ | 两次独立运行结果与端口/进程 postflight |
| AR-15 | 真机证据边界 | iOS Safari 的 UX-IOS-01、微信保存、Android/朋友圈/声音实际听感有哪些仍未验证？ | 只引用现有真机记录，不以模拟补齐 |

## 4. 强制变异用例

审查员至少挑选下列用例形成可复现证据；不得只做代码风格评论：

1. 将历史存储分别置为空字符串、非法 JSON、错误 version、非数组 entries、含额外敏感字段和 6 条记录。
2. 模拟 `localStorage.getItem/setItem/removeItem` 各自抛出异常，确认游戏主流程仍可完成。
3. 在同一局快速双击最后一回合、重复触发结果渲染和重新挂载，确认历史只保存一次、`result_view` 只发一次。
4. 让 `AudioContext` 不存在、构造失败、`resume()` reject、初始为 suspended，确认默认关闭且主流程不受影响。
5. 覆盖分享成功、拒绝、取消、API 不存在和复制 fallback，确认事件次数与状态文案一致。
6. 固定到 ISO 年交界前后及 Asia/Shanghai 周日 23:59 / 周一 00:00，核对 weekKey、事件组合和刷新稳定性。
7. 为三组回响同时注入多个候选标签，确认优先级稳定且只替换目标正文。
8. 在 375×667、390×844、426×922 分别从当前可见档案入口打开，验证 44px、焦点、清除确认、Esc 返回、无横向溢出。
9. 开启 `prefers-reduced-motion: reduce`，核对所有新增动画、transition 和强调态没有残留位移。
10. 拦截所有非 loopback 请求，并扫描构建产物中的 `fetch`、XHR、Beacon、WebSocket、远端 URL 和统计 SDK 痕迹。
11. 选择一条固定路线，对照结果页、853×1844 战报、分享文本和本地历史的全部结果字段。
12. 连续运行两次 XHS 与普通 H5 关键验收，确认结果相同且 5321–5323 无监听残留。

## 5. 严重级别与处理规则

| 级别 | 定义 | 处理 |
|---|---|---|
| P0 | 白屏、主流程无法完成、错误结果、隐私/网络越界、数据不可控丢失或发布阻断 | 立即停止阶段完成声明；必须修复并全量回归 |
| P1 | 可稳定复现的可访问性、短屏、历史、声音或事件合同错误，存在明确用户影响 | 修复后重跑受影响套件及最终全量门 |
| P2 | 不阻断主流程的局部表现、文案或低概率恢复问题 | 记录影响和建议；由主会话决定本轮修复或进入 backlog |

Finding 必须包含：ID、级别、文件/行号、前置条件、复现步骤、预期、实际、证据、影响范围和最小修复方向。没有复现或直接源码证据的条目只能列为“待验证假设”。

## 6. 当前执行配置

用户先确认由 ZCode 执行、Codex 复核；ZCode 配额中断后，用户进一步明确授权 Codex 主会话接手完成。原始审查执行限定在同一隔离副本且未修改正式产品源码；审查完成后，用户另行授权在正式工作区修复 ZR-001 与 ZR-002。

- 执行工具：ZCode 前段 + Codex 主会话后段。
- 模型：ZCode GLM-5.3 max；切换 GLM-5.3-Flash 时受同一配额限制，未产生后续结果；剩余部分由 Codex 接手。
- reasoning effort：`max`。
- workspace：包含当前 dirty 状态的隔离副本，不直接操作正式工作区。
- 执行提示词：`docs/zcode-adversarial-review-prompt.md`。
- 报告模板：`docs/zcode-adversarial-review-report-template.md`。
- 权限：不得修改产品源码；仅允许在隔离副本运行本地检查，并向 `review-output/` 写报告和最小复现证据。
- 禁止：commit、push、deploy、登录、依赖安装、删除、非 loopback 网络、凭据读取与外发。
- Codex 职责：在用户追加授权后补齐复现、正式报告和主审查；不实施 finding 修复。

### 6.1 2026-08-28—29 执行结果

- 隔离 workspace：`/private/tmp/monday-survival-zcode-review-20260828-9vgOqL`。
- 首段实际模型：GLM-5.3，reasoning effort 为 `max`；约 24 分钟后触发 ZCode 账户每周/月配额上限。
- 已尝试切换至 GLM-5.3-Flash 续审；Flash 与主模型受同一账户配额限制，未能继续生成。
- Codex 接手后重新取得 47/47 与 9/9 的真实 exit 0 和完整 verbose 日志，并完成 AR-08 至 AR-15。
- 正式结果：P0 0、P1 1、P2 1、Hypothesis 0。P1 为首次引导 modal 未主动聚焦且没有焦点循环；P2 为最终反馈同步双击重复发送 `feedback_continue`。
- 普通构建唯一 `fetch(` 已定位为 Vite `modulepreload` polyfill；XHS 关闭该 polyfill，且两轮三档 XHS/普通 H5 均无外部请求并 exit 0。
- `pnpm typecheck`、18/18 项目单测、生产构建、59,049 路径、三页视觉检查均 exit 0；两轮确定性测试仅构建耗时不同。
- 受保护的 72 个产品/文档/根级文件 before/after manifest 完全一致；5180、5321、5322、5323 均无监听。
- 持久化证据：`reports/adversarial-review-20260829/`，含正式报告、findings JSON、命令日志、复现脚本、截图、运行日志和 manifest。
- 截至隔离审查结束时尚未实施修复，因此当时不能宣布“对抗性审查通过”；后续闭环见 6.2。

### 6.2 2026-08-29 Finding 修复闭环

- ZR-001 已修复：首次引导挂载后主动聚焦“开始上班”，Tab/Shift+Tab 均保持在唯一操作按钮；背景 inert 保持不变。
- ZR-002 已修复：`continueRun` 在状态更新与事件发送前取得同步 ref 锁，每次进入新反馈页时重置。
- 回归断言已补入 `scripts/xhs-h5-check.mjs` 与 Stage 8 专用浏览器脚本；后者对最终按钮同步执行两次 `click()`，仍只得到一次逻辑继续事件。
- `pnpm typecheck`、18/18 单测、生产构建、59,049 路径、Stage 8 三档专用回归、XHS、微信 H5 和三页视觉检查全部通过。
- 三张视觉截图完成全图检查，修复属于已确认 Stage 8 视觉合同内的交互修正，未改变布局或视觉方向。
- 5180、5321、5322、5323 postflight 均无监听；没有 commit、push、deploy 或远端操作。
- 当前未关闭 finding：P0 0、P1 0、P2 0；自动化范围内可以标记为“对抗性审查通过”。真机声音、Android、朋友圈、相册最终资产和 8–12 份反馈仍按原证据边界保留。

## 7. Finding 闭环

```text
审查员提出 finding
→ 主会话核验复现与级别
→ 可证伪则用运行证据反驳
→ 有效 finding 交给 worker 最小修复
→ 主会话只重跑失败步骤
→ 再跑最终全量门与端口 postflight
→ 阻断项清零后才能宣布审查通过
```

- reviewer 的阻断 finding 不得静默豁免。
- 修复不得顺手扩大产品范围；触及远端、隐私、后端或发布时重新向用户确认。
- 既有 dirty worktree 原样保留，不执行 reset、clean、checkout 或覆盖。

## 8. 退出条件

对抗性审查只有同时满足以下条件才算完成：

- 所有 P0/P1 已修复，或由主会话用可复现证据反驳。
- 受影响测试与最终全量门通过。
- 所有“未验证”项明确列出，尤其是真机声音、Android、朋友圈和真实内测。
- Monday Survival 本轮端口和浏览器进程已清理；未干扰其他工作区服务。
- 报告明确区分源码事实、浏览器证据、真机事实与推断。
