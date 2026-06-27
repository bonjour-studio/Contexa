# 进度日志

## 当前已验证状态

- 仓库根目录：运行 `pwd` 确认当前仓库根目录；不要把本机 worktree 绝对路径写入仓库文档。
- 标准启动路径：`cd desktop && bun run tauri dev`；也可以用 `RUN_START_COMMAND=1 ./harness/init.sh`
- 标准验证路径：`./harness/init.sh`
- 已批准的产品方案：v1 多项目 Git 上下文控制台；两级导航 Projects/Profiles/Settings；窗口按客户端方式自适应 + 最小尺寸；每个小模块单独验证并本地提交。
- 当前已完成：`ctx-000` 基线整理（passing）；`ctx-101` 原生窗口尺寸与按窗格自适应布局（passing）。
- 当前最高优先级未完成功能：`ctx-102` 两级导航外壳与 Profiles 复用库分区。
- 当前 blocker：无
- 当前分支注意事项：本地 `main` 已重写历史，相对 `origin/main` 仍分叉；按用户要求每个模块在本地 main 提交、不 push。`filter-branch` 留有 `refs/original/refs/heads/main` 本地恢复引用。

## 会话记录

### Session 001

- 日期：2026-06-27
- 本轮目标：建立 Harness Engineering baseline，让后续工程会话能从仓库内状态、功能清单和统一验证入口继续工作。
- 已完成：新增 `harness/` 下的目录说明、进度日志、功能清单、初始化脚本、交接摘要、干净状态清单、评审评分表和质量文档；更新根指令文件指向 harness 工作循环。
- 运行过的验证：`./harness/init.sh`
- 已记录证据：2026-06-27 `./harness/init.sh` 通过：`bun install` 成功；`cd desktop && bun run build` 成功；`cd desktop/src-tauri && cargo check` 成功。
- 提交记录：未提交（用户未要求提交）。
- 更新过的文件或工件：根指令文件；`harness/README.md`；`harness/progress.md`；`harness/feature_list.json`；`harness/init.sh`；`harness/session-handoff.md`；`harness/clean-state-checklist.md`；`harness/evaluator-rubric.md`；`harness/quality-document.md`。
- 已知风险或未解决问题：产品功能仍处于 Tauri scaffold 阶段，尚无自动化测试脚本；当前标准验证使用前端 build 和 Rust `cargo check` 作为 baseline，不等同于完整端到端验证。
- 下一步最佳动作：开始 `ctx-001`，实现项目选择与当前项目状态展示。

### Session 002

- 日期：2026-06-27
- 本轮目标：按 Harness Engineering 流程完成三项维护任务：当前分支提交时间整体后移一天、移除 UI 代码中的真实个人姓名占位、优化桌面 UI 风格并整理前端文件结构。
- 已完成：7 个当前分支提交的 author/committer 时间均整体后移一天；将 profile 表单里的真实姓名占位替换为泛化占位；将原单文件前端拆为 domain 类型、Tauri client、workspace hook、通用组件、feature panels、格式化工具和样式目录；加入 `lucide-react` 用于图标化导航与操作；将页面调整为 Contexa 工作台布局。
- 运行过的验证：`pwd`；`git log --oneline -5`；`./harness/init.sh`（变更前 baseline）；目标姓名关键字 `rg` 搜索；`cd desktop && bun run build`；本地 Vite 浏览器布局检查；`./harness/init.sh`（变更后完整验证）。
- 已记录证据：`git log --reverse --format='%h %aI %cI %s'` 显示 7 个提交时间均为 2026-06-27；目标姓名关键字 `rg` 搜索无输出；2026-06-27 `./harness/init.sh` 通过：`bun install` 成功、`cd desktop && bun run build` 成功、`cd desktop/src-tauri && cargo check` 成功；浏览器检查 1280x720 与 390x820 无水平溢出、页面文本无目标姓名关键字、console warn/error 为空。
- 提交记录：未提交（用户未要求提交）。
- 更新过的文件或工件：`desktop/package.json`；`desktop/bun.lock`；`desktop/src/App.tsx`；`desktop/src/main.tsx`；`desktop/src/services/gitscope.ts`；新增 `desktop/src/components/`、`desktop/src/domain/`、`desktop/src/features/`、`desktop/src/hooks/`、`desktop/src/lib/`、`desktop/src/styles/`；删除旧 `desktop/src/App.css`；更新 `harness/progress.md`、`harness/feature_list.json`、`harness/session-handoff.md`。
- 已知风险或未解决问题：本地 `main` 已重写历史并与 `origin/main` 分叉，且 `filter-branch` 留有 `refs/original/refs/heads/main` 本地恢复引用；未 push。浏览器视觉检查使用 Vite 页面验证布局和样式，未启动完整 Tauri shell 做人工端到端交互。
- 下一步最佳动作：继续 `ctx-001`，实现项目选择与当前项目状态展示；开始前仍先跑 `./harness/init.sh`。

### Session 003

- 日期：2026-06-27
- 本轮目标：检查所有涉及目录的 UI，改为系统选择器，不让用户手输目录路径。
- 已完成：顶部仓库路径控件改为只读显示 + Tauri 目录选择器，选择后立即扫描仓库；SSH key 路径控件也改为只读显示 + Tauri 文件选择器，选择后立即检查文件状态；新增 dialog service；注册 `tauri-plugin-dialog` 并将主窗口 capability 限定为 `dialog:allow-open`；只读路径输入增加视觉样式。
- 运行过的验证：`./harness/init.sh`（变更前 baseline）；路径控件 `rg` 审查；`cd desktop && bun run build`；`cd desktop/src-tauri && cargo check`；`cd desktop && bun run tauri build`。
- 已记录证据：`Repository path` 和 `SSH private key path reference` 的输入框均为 `readOnly`，对应按钮分别调用目录/文件选择器；`tauri build` 通过并生成 macOS `.app` 与 `.dmg`。
- 提交记录：未提交（用户未要求提交）。
- 更新过的文件或工件：`desktop/package.json`；`desktop/bun.lock`；`desktop/src/App.tsx`；`desktop/src/components/AppShell.tsx`；`desktop/src/features/workspace/ProfilesPanel.tsx`；`desktop/src/hooks/useGitScopeWorkspace.ts`；`desktop/src/services/dialog.ts`；`desktop/src/styles/base.css`；`desktop/src-tauri/Cargo.toml`；`desktop/src-tauri/Cargo.lock`；`desktop/src-tauri/src/lib.rs`；`desktop/src-tauri/capabilities/default.json`；`harness/progress.md`；`harness/feature_list.json`；`harness/session-handoff.md`。
- 已知风险或未解决问题：`ctx-001` 仍不能标记 passing，因为关闭并重启后恢复当前项目尚未实现；本轮没有进行完整人工 Tauri UI 点击路径验证，但打包链路已覆盖 dialog 插件与权限配置。
- 下一步最佳动作：继续 `ctx-001` 的项目选择持久化：选择目录后保存为当前项目，重启后恢复或清晰提示重新选择。

### Session 004

- 日期：2026-06-27
- 本轮目标：作为产品规划，把单仓库的 GitScope 重构成 README 愿景里的「多项目上下文控制台」，并按客户端方式做窗口自适应；用 harness 流程拆成小模块逐个验证、逐个本地提交。
- 已批准方案：两级导航（Projects 列表 → 项目工作台 Overview/Git Identity；Profiles 为不绑定项目的复用库；Settings 应用级）；复用库定名 Profiles；窗口最小尺寸 + 按窗格回流。方案存于 `.claude/plans`。
- 已完成模块：
  - M0/`ctx-000b`：把 sessions 002/003 已验证的重构落为两个本地提交（desktop 拆分 + harness 证据），让后续工作从干净树开始。
  - M1/`ctx-101`：`tauri.conf.json` 设默认 1120×760 / minWidth 880 / minHeight 620 / center；新增 `tauri-plugin-window-state` 记忆窗口几何；`base.css` 建立 fill-height 链；`workbench.css` 用 fill-height 外壳 + 内部滚动 + auto-fit 网格 + 单个 `@container` 查询替换全部 `@media` 视口断点。并重排 `feature_list.json` 对齐已批准方案。
- 运行过的验证：`./harness/init.sh`（基线）；`cd desktop && bun run build`；`cd desktop/src-tauri && cargo check`（编译 window-state v2.4.1，build.rs 校验新窗口配置）；`cd desktop && bun run tauri build`（约 1m28s，生成 Contexa.app 与 .dmg）。
- 提交记录：`feat(desktop): split workbench UI, add dialog/tray and path pickers`；`chore(harness): record workbench-split baseline evidence`；`feat(desktop): native window sizing and fluid layout`（含 harness 重排）。本地 main，未 push。
- 已知风险或未解决问题：窗口几何记忆、最小尺寸约束、面板回流为构建级已验证 + Tauri/插件原生行为，未做 GUI 人工点击端到端验证。`gitscope.json` 存储文件名暂不改名（避免迁移）。
- 下一步最佳动作：M2/`ctx-102`，新建两级导航外壳并把 Profiles 提为顶层分区；开始前先跑 `./harness/init.sh`。
