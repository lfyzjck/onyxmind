# OnyxMind 实现路线图

> 最后更新: 2026-03-02

## 当前进度总览

| 阶段 | 状态 | 完成度 |
|------|------|--------|
| 阶段 0: 准备工作 | ✅ 完成 | 100% |
| 阶段 1: MVP 核心功能 | ✅ 完成 | 100% |
| 阶段 2: 增强功能 | 🔄 进行中 | 60% |
| 阶段 3: 编辑器集成 | ⏳ 待开始 | 30% |
| 阶段 4: 优化和完善 | ⏳ 待开始 | 0% |
| 阶段 5: 发布准备 | ⏳ 待开始 | 0% |

---

## 阶段 0: 准备工作 ✅

### 环境搭建
- [x] 基础项目结构
- [x] 安装 OpenCode SDK (`@opencode-ai/sdk`)
- [x] 配置 TypeScript 类型定义
- [x] 设置开发环境和热重载

### 技术调研
- [x] 研究 OpenCode SDK API（v2）
- [x] 实现 OpenCode 本地服务器启动与连接
- [x] 验证流式响应（SSE 事件流）
- [x] 验证文件操作能力（通过 Agent 工具调用）

---

## 阶段 1: MVP 核心功能 ✅

### 1.1 OpenCode 集成 ✅
**实现文件**: `src/services/opencode-service.ts`

- [x] `initialize()` - 启动内嵌 OpenCode 服务器，配置模型、Provider、CORS
- [x] `createSession()` - 创建会话，绑定 vault 目录
- [x] `sendPrompt()` - 发送请求 + SSE 流式响应（content / thinking / tool_use / error）
- [x] `abortSession()` - 中断正在进行的会话
- [x] `deleteSession()` - 删除会话
- [x] `destroy()` - 同步关闭服务器（支持 onunload）
- [x] 错误处理（ApiError、ProviderAuthError、ContextOverflow 等分类处理）
- [x] 端口冲突处理（启动前 kill 残留进程）
- [x] PATH 增强（修复 GUI 环境找不到 opencode 二进制的问题）

### 1.2 设置页面 ✅
**实现文件**: `src/settings.ts`

- [x] OpenCode 服务 URL 配置
- [x] API 密钥（密码字段）
- [x] Provider ID 和 Model ID 配置
- [x] 行为设置（搜索范围、自动保存、文件操作确认、历史消息数）
- [x] 高级设置（超时、重试次数、流式响应开关）

### 1.3 聊天界面 ✅
**实现文件**: `src/views/chat-view.ts`

- [x] 消息列表容器（支持 Markdown 渲染）
- [x] 自动扩展输入框
- [x] 发送按钮 + Enter 快捷键
- [x] 中止按钮（Stop）及即时 UI 反馈
- [x] Thinking 指示器
- [x] 欢迎消息
- [x] 错误消息显示
- [x] 流式响应逐字渲染
- [x] 新建会话 / 清空消息操作

### 1.4 命令注册 ✅
**实现文件**: `src/main.ts`

- [x] Ribbon 图标（message-square）
- [x] `open-chat` - 打开聊天面板
- [x] `ask-about-note` - 询问当前笔记
- [x] `summarize-note` - 总结当前笔记
- [x] 设置页面注册

### 1.5 Agent 系统提示词 ✅
**实现文件**: `src/services/agent-prompt.ts`

- [x] Vault 路径感知（自动注入绝对路径）
- [x] Obsidian 原生规则（路径、wikilink、frontmatter、Dataview）
- [x] 工具调用指导（Read/Edit/Bash/Glob/Grep 使用规范）
- [x] WebSearch 时机判断规则
- [x] 知识库操作规范（模板、日记、链接维护）
- [x] 自定义提示词扩展支持

---

## 阶段 2: 增强功能 🔄

### 2.1 流式响应 ✅
- [x] content 增量文本实时渲染
- [x] Thinking 指示器（loading 状态）
- [x] 流式错误处理（AbortError 静默过滤）
- [x] 用户中止（本地 + 服务端双重中断）
- [ ] **thinking 内容折叠展示**（StreamChunkThinking 已接收，UI 尚未渲染）
- [ ] **tool_use 工具调用状态渲染**（事件已接收，UI 尚未展示）

### 2.2 会话管理 🔄
- [x] 会话 CRUD（创建、获取、删除、设活跃）
- [x] 消息历史管理（增加、清空）
- [x] 会话序列化/反序列化（toJSON/fromJSON）
- [x] 新建会话按钮
- [x] 清空消息按钮
- [ ] **会话侧边栏 / 选择器 UI**（多会话切换入口缺失）
- [ ] **会话持久化到磁盘**（目前重启后丢失，需接入 plugin.loadData/saveData）
- [ ] **会话标题自动生成**（根据首条消息智能命名）

### 2.3 上下文感知 ⏳
- [ ] 当前笔记上下文自动注入（打开文件变化时更新）
- [ ] Vault 文件树结构感知
- [ ] `@文件名` 手动引用语法（快速插入笔记内容到对话）
- [ ] 上下文范围配置（当前笔记 / 当前文件夹 / 全库）

### 2.4 文件操作可视化 ⏳
- [ ] 解析 `tool_use` 流式事件（pending / running / completed / error 状态）
- [ ] 消息中内联展示工具卡片（文件名 + 操作类型 + 状态图标）
- [ ] 操作详情展开/折叠
- [ ] 操作结果反馈（成功/失败/跳过）

---

## 阶段 3: 编辑器集成 🔄

### 3.1 编辑器命令 🔄
**部分实现** — `ask-about-note` 和 `summarize-note` 已在 `main.ts` 中注册

- [x] `ask-about-note` - 询问当前笔记（已实现）
- [x] `summarize-note` - 总结当前笔记（已实现）
- [ ] `explain-selection` - 解释选中内容
- [ ] `improve-writing` - 改进选中内容
- [ ] `generate-content` - 在光标处生成内容
- [ ] 命令与聊天视图联动（结果直接在聊天面板显示，当前已实现部分）

### 3.2 上下文菜单 ⏳
- [ ] 注册编辑器右键菜单
- [ ] 选中文本后显示 AI 操作子菜单
- [ ] 菜单项图标和快捷说明

---

## 阶段 4: 优化和完善 ⏳

### 4.1 性能优化
- [ ] 消息列表虚拟滚动（长对话性能）
- [ ] 防抖输入处理
- [ ] Markdown 渲染异步化（避免阻塞 UI）
- [ ] 服务初始化失败重试（当前设置变更后会立即重新 initialize，可能冲突）

### 4.2 错误处理完善
- [ ] 网络状态检测（显示 offline/connecting 状态）
- [ ] 服务未就绪时的友好引导（当前仅 Notice 提示）
- [ ] `searchFiles` / `searchText` API 对齐修复（当前标注为 TODO）
- [ ] 错误日志持久化

### 4.3 UI/UX 改进
- [ ] 移动端适配（触摸目标 ≥ 44×44px，布局响应式）
- [ ] 消息 Copy 按钮
- [ ] 消息 Regenerate 按钮
- [ ] 代码块一键复制
- [ ] 设置页面"测试连接"按钮
- [ ] 图标按钮替换 emoji（使用 Obsidian setIcon API）
- [ ] 主题适配（确保 dark/light 均正常显示）

### 4.4 代码质量
- [ ] 消除所有 `as any` 类型断言（SDK 类型定义完善后）
- [ ] `getChatView()` 中的 `as ChatView` 替换为 `instanceof` 检查
- [ ] `execSync`/`child_process` 安全性评估（考虑替代方案）
- [ ] ESLint 全量通过（eslint-plugin-obsidianmd）

### 4.5 测试
- [ ] OpencodeService 单元测试
- [ ] SessionManager 单元测试
- [ ] 端到端集成测试

---

## 阶段 5: 发布准备 ⏳

### 5.1 代码审查
- [ ] Obsidian 最佳实践全量检查（对照 OBSIDIAN_BEST_PRACTICES.md）
- [ ] 安全审查（API 密钥存储、XSS 防护）
- [ ] 依赖审查（确认无不必要的 node 原生模块）

### 5.2 兼容性测试
- [ ] macOS（主要开发平台）
- [ ] Windows（路径分隔符、opencode 二进制查找）
- [ ] Linux
- [ ] iOS / Android（移动端）
- [ ] Obsidian 最低版本兼容性验证

### 5.3 发布
- [ ] 更新 manifest.json 版本号
- [ ] 编写 CHANGELOG
- [ ] 完善 README（安装、配置、使用截图）
- [ ] 提交到 Obsidian 社区插件仓库
- [ ] 创建 GitHub Release

---

## 关键里程碑

| 里程碑 | 状态 | 交付物 |
|--------|------|--------|
| M1: MVP 完成 | ✅ 已完成 | 基础对话、流式响应、设置页面 |
| M2: 增强功能完成 | 🔄 进行中 | 会话持久化、工具调用可视化、上下文感知 |
| M3: 编辑器集成完成 | ⏳ 待开始 | 选中操作命令、右键菜单 |
| M4: 优化完成 | ⏳ 待开始 | 性能、UX、代码质量 |
| M5: 发布 | ⏳ 待开始 | 提交社区插件 |

---

## 近期优先任务（Next Up）

按优先级排序：

1. **thinking 内容 UI 渲染** — StreamChunkThinking 已接收，加折叠展示即可
2. **tool_use 工具调用状态卡片** — 让用户看到 AI 在操作哪些文件
3. **会话持久化** — 接入 `plugin.loadData/saveData`，重启不丢失历史
4. **会话选择器 UI** — 多会话切换，查看历史对话
5. **`explain-selection` / `improve-writing` 命令** — 补全编辑器命令集
6. **设置页面"测试连接"按钮** — 提升配置体验
7. **图标按钮去 emoji** — 用 `setIcon()` 替换 ➕🗑️，符合 Obsidian 规范

---

## 已知技术债务

| 问题 | 位置 | 优先级 |
|------|------|--------|
| `searchFiles` / `searchText` 被注释，API 类型不匹配 | `opencode-service.ts:463` | 中 |
| `getChatView()` 使用 `as ChatView` 类型断言 | `main.ts:139` | 低 |
| `updateSettings()` 直接调用 `initialize()` 可能导致并发冲突 | `opencode-service.ts:531` | 中 |
| `execSync` 在渲染进程使用 | `opencode-service.ts:98` | 低（目前可用） |
| `MarkdownRenderer.renderMarkdown` 传入 `this as any` | `chat-view.ts:296` | 低 |

---

## 风险和缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| OpenCode SDK API 变更 | 高 | 中 | 锁定 SDK 版本（当前 v2），关注 changelog |
| opencode 二进制不在 PATH | 高 | 中 | `findOpencodeExecutable()` 已覆盖常见安装路径 |
| 端口 4096 冲突 | 中 | 低 | 启动前 `killPortProcess()` 已处理 |
| Obsidian API 兼容性 | 高 | 低 | 遵循最佳实践，最低版本设为 1.4.0 |
| 移动端 node.js API 不可用 | 高 | 高 | `execSync`/`child_process` 在移动端不可用，需要适配 |
