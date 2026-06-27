# 进度日志

## 当前已验证状态

- 仓库根目录：运行 `pwd` 确认当前仓库根目录；不要把本机 worktree 绝对路径写入仓库文档。
- 标准启动路径：`cd desktop && bun run tauri dev`；也可以用 `RUN_START_COMMAND=1 ./harness/init.sh`
- 标准验证路径：`./harness/init.sh`
- 当前最高优先级未完成功能：`ctx-001` 选择并记住当前项目
- 当前 blocker：无

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
