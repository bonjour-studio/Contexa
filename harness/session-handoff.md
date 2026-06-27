# 会话交接

## 当前已验证

- 现在明确可用的部分：根指令文件、desktop 子项目约定、README 产品范围、Tauri/React desktop app、初始 harness 工件、已拆分的前端工作台结构、Tauri dialog 插件。
- 这轮实际跑过的验证：`./harness/init.sh` 通过：`bun install` 成功；`cd desktop && bun run build` 成功；`cd desktop/src-tauri && cargo check` 成功。
- Tauri 插件验证：`cd desktop && bun run tauri build` 通过，生成 macOS `.app` 与 `.dmg`。
- 额外验证：目标姓名关键字 `rg` 搜索无输出；本地 Vite 页面在 1280x720 与 390x820 下无水平溢出，页面文本无目标姓名关键字，浏览器 console warn/error 为空。

## 本轮改动

- 新增了哪些代码或行为：桌面 UI 从旧 GitScope 风格调整为 Contexa 工作台；profile 表单中的真实姓名占位已换成泛化占位；新增 `lucide-react` 图标依赖。
- 前端组织结构：`App.tsx` 只保留页面组合；类型进入 `desktop/src/domain/`；Tauri API client 保留在 `desktop/src/services/`；状态流程进入 `desktop/src/hooks/`；通用 UI 进入 `desktop/src/components/`；三个工作区页面进入 `desktop/src/features/workspace/`；格式化工具进入 `desktop/src/lib/`；样式拆成 `desktop/src/styles/base.css` 和 `desktop/src/styles/workbench.css`。
- 目录/文件路径选择：`Repository path` 改为只读显示 + Tauri 目录选择器；SSH key 路径改为只读显示 + Tauri 文件选择器；主窗口 capability 添加 `dialog:allow-open`。
- 基础设施或 harness 发生了哪些变化：`harness/progress.md` 记录本轮证据与风险。

## 仍损坏或未验证

- 已知缺陷：无已知缺陷。
- 未验证路径：完整 Tauri dev app 人工点击路径尚未验证；`ctx-001` 的重启后项目恢复还未实现。
- 下一轮会话需要注意的风险：没有测试脚本时，不要把 build/check 误认为完整端到端验证。

## 下一步最佳动作

- 最高优先级未完成功能：`ctx-001` 选择并记住当前项目。
- 为什么它是下一步：README roadmap 的 Phase 1 从项目选择、项目扫描和配置仪表盘开始；没有项目选择，后续扫描和编辑都没有稳定输入。
- 什么结果才算 passing：用户能选择项目目录，界面显示当前项目路径和基础状态，重启后能恢复或清晰提示重新选择，并记录验证证据。目录选择器入口已完成，剩余重点是持久化与重启恢复。
- 这一步中哪些东西不要动：不要修改全局 Git/SSH/shell 配置；不要读取或展示私钥、token、密码或 `.env` 明文值；不要引入非 Bun 包管理器。

## 命令

- 启动命令：`cd desktop && bun run tauri dev`
- 验证命令：`./harness/init.sh`
- 定向调试命令：`cd desktop && bun run build`；`cd desktop/src-tauri && cargo check`
