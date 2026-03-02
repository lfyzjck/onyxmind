# OpenCode 工具参考

OpenCode 代码目录：`/Users/jiachengkun/opensource/opencode`

---

## 核心工具（始终可用）

| 工具 | 说明 |
|------|------|
| `bash` | 执行 shell 命令，支持超时和权限控制 |
| `read` | 读取文件或目录内容，支持分页、图片、PDF |
| `write` | 创建或覆盖文件内容 |
| `glob` | 使用 glob 模式匹配文件 |
| `grep` | 使用正则表达式搜索文件内容 |
| `edit` | 替换文件中的指定文本（支持模糊匹配） |
| `webfetch` | 抓取 URL 内容，自动转换为 Markdown |
| `websearch` | 通过 Exa API 执行网络搜索 |
| `codesearch` | 搜索代码片段和文档 |
| `skill` | 加载领域专属技能和工作流 |
| `task` | 生成子 agent 会话执行专项任务 |
| `apply_patch` | 应用 unified patch 格式的文件差异 |

---

## 条件工具（按配置启用）

| 工具 | 启用条件 |
|------|----------|
| `question` | app/cli/desktop 客户端，或设置 `OPENCODE_ENABLE_QUESTION_TOOL` |
| `lsp` | 设置 `OPENCODE_EXPERIMENTAL_LSP_TOOL` 标志 |
| `batch` | 配置 `config.experimental.batch_tool = true`（最多并发 25 个工具调用） |
| `plan_exit` | CLI 下设置 `OPENCODE_EXPERIMENTAL_PLAN_MODE` |
| `todowrite` | 按需启用，写入当前会话的 todo 列表 |

---

## 工具注册

工具注册在 `packages/opencode/src/tool/registry.ts` 中管理，支持：

- 内置工具加载
- 从 `tool/` 或 `tools/` 目录加载自定义工具
- 从插件加载工具
- 根据模型类型和权限过滤工具
- 根据模型兼容性在 `edit/write` 和 `apply_patch` 之间自动选择
