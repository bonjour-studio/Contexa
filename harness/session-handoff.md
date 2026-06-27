# 会话交接

## 当前已验证

- 现在明确可用的部分：v1 多项目 Git 上下文控制台的全部 5 个模块（`ctx-101`~`ctx-105`）均 passing。两级导航（Projects / Profiles / Settings）；Projects 多项目列表 + 持久化 + 重启恢复；项目工作台 Overview（状态条、本地 git 配置 matched/drift、关联 Profile、本项目历史）与 Git Identity（preflight / diff / apply / ssh+remote 连接测试）；不绑定项目的 Profiles 复用库；按客户端方式自适应的窗口（最小尺寸 + 记忆几何）。
- 这轮实际跑过的验证：
  - `cd desktop && bun run build`（72 模块）通过。
  - `cd desktop/src-tauri && cargo test` 5 项全过（含新增 `loads_storage_without_project_fields` 旧存储兼容性测试）。
  - `cd desktop && bun run tauri build` 通过两次（M1/M3/M5），生成 macOS `.app` 与 `.dmg`。
  - `./harness/init.sh` 通过（bun install + bun run build + cargo check）。

## 本轮改动（Session 004）

- M0：把 sessions 002/003 已验证的重构落为两个本地提交（desktop 拆分 + harness 证据）。
- M1 `ctx-101`：`tauri.conf.json` 默认 1120×760 / minWidth 880 / minHeight 620 / center；加 `tauri-plugin-window-state`；`workbench.css` 改为 fill-height 外壳 + 内部滚动 + auto-fit 网格 + `@container`，去掉全部 `@media` 视口断点。
- M2 `ctx-102`：两级导航 `AppShell` + `PageHeader`；`ProfilesPanel` 移入 `features/profiles` 由 `ProfilesSection` 包装；新增 `SettingsSection`。
- M3 `ctx-103`：Rust `Project` 模型 + 5 个命令，`AppStorage` 加 `#[serde(default)]`；前端 `useGitScopeWorkspace`→`useWorkspace` store；`ProjectsList` + `ProjectWorkbench`；重启恢复上次打开项目。
- M4 `ctx-104`：Rust `link_profile_to_project`；`ProjectOverview`（matched/drift + 关联 Profile）；store 增 history/applyPlan/identityState。
- M5 `ctx-105`（纯前端）：workbench 加 Overview/Git Identity 标签页；`GitIdentityPanel` 跑 preflight/diff/apply/连接测试；store 增 preflight/connectionResult + applyIdentity/runConnectionTest。
- 提交：本会话每个模块一个本地提交，全部在 `main`，未 push。
- 结构：`features/projects`（list / workbench / overview / git-identity）、`features/profiles`、`features/settings`；旧 `features/workspace/` 已清空。

## 仍损坏或未验证

- 已知缺陷：无已知缺陷（构建 / 类型 / 单测 / 打包全绿）。
- 未验证路径（需 `bun run tauri dev` 人工走查）：窗口几何记忆与最小尺寸约束；导航点击；加 2 仓库→重启→列表恢复；关联 Profile→matched/drift；真实仓库 + ssh key 的完整 apply 端到端。底层 Rust apply 命令自早期会话起未变。
- 风险：本地 `main` 相对 `origin/main` 仍分叉（早期历史重写），按要求只在本地提交、未 push；`gitscope.json` 存储文件名暂未改为 `contexa.json`（避免迁移）。

## 下一步最佳动作

- v1 已完成。下一阶段进入 README roadmap Phase 2：`ctx-002` 扫描项目规则 / MCP / env 上下文文件（在工作台加新标签页或区块），随后是 `ctx-004` 规则与 MCP 原地编辑、`ctx-005` 通用 policy/diff、`ctx-006` 启动器。
- 开新功能前：建议先做一次 dev run 人工端到端走查（见“未验证路径”），并保持每个小模块单独验证 + 本地提交的节奏。
- 不要动的红线：不改全局 Git/SSH/shell 配置；不读取或展示私钥 / token / `.env` 明文；保持 Bun；写入仅限项目目录内。

## 命令

- 启动命令：`cd desktop && bun run tauri dev`
- 验证命令：`./harness/init.sh`
- 定向调试命令：`cd desktop && bun run build`；`cd desktop/src-tauri && cargo check`；`cd desktop/src-tauri && cargo test`
