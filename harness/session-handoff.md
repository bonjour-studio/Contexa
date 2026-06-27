# 会话交接

## 当前已验证

- 现在明确可用的部分：根指令文件、desktop 子项目约定、README 产品范围、Tauri/React scaffold、初始 harness 工件。
- 这轮实际跑过的验证：`./harness/init.sh` 通过：`bun install` 成功；`cd desktop && bun run build` 成功；`cd desktop/src-tauri && cargo check` 成功。

## 本轮改动

- 新增了哪些代码或行为：未新增产品代码。
- 基础设施或 harness 发生了哪些变化：新增 `harness/` 目录，包含目录说明、进度日志、功能清单、初始化脚本、交接摘要、干净状态清单、评审评分表和质量文档；根指令文件增加 harness 工作循环。

## 仍损坏或未验证

- 已知缺陷：无已知缺陷。
- 未验证路径：完整 Tauri dev app 启动与人工 UI 路径尚未验证；当前只验证 build/check baseline。
- 下一轮会话需要注意的风险：产品仍是 Tauri scaffold；没有测试脚本时，不要把 build/check 误认为完整端到端验证。

## 下一步最佳动作

- 最高优先级未完成功能：`ctx-001` 选择并记住当前项目。
- 为什么它是下一步：README roadmap 的 Phase 1 从项目选择、项目扫描和配置仪表盘开始；没有项目选择，后续扫描和编辑都没有稳定输入。
- 什么结果才算 passing：用户能选择项目目录，界面显示当前项目路径和基础状态，重启后能恢复或清晰提示重新选择，并记录验证证据。
- 这一步中哪些东西不要动：不要修改全局 Git/SSH/shell 配置；不要读取或展示私钥、token、密码或 `.env` 明文值；不要引入非 Bun 包管理器。

## 命令

- 启动命令：`cd desktop && bun run tauri dev`
- 验证命令：`./harness/init.sh`
- 定向调试命令：`cd desktop && bun run build`；`cd desktop/src-tauri && cargo check`
