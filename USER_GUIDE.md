# OnyxMind 插件使用指南

## 🎉 开发完成！

OnyxMind 插件的 MVP 版本已经开发完成并成功构建。

## ✅ 已实现的功能

### 核心功能
- ✅ **聊天界面** - 完整的对话 UI，支持 Markdown 渲染
- ✅ **OpenCode 集成** - 通过 OpenCode SDK 连接 AI 服务
- ✅ **会话管理** - 创建、管理多个对话会话
- ✅ **流式响应** - 实时显示 AI 回复
- ✅ **设置页面** - 完整的配置选项

### 命令
- ✅ `Open chat` - 打开聊天面板
- ✅ `Ask about current note` - 询问当前笔记
- ✅ `Summarize current note` - 总结当前笔记

### UI 特性
- ✅ 使用 Obsidian CSS 变量，自动适配主题
- ✅ 键盘可访问性（Enter 发送，Shift+Enter 换行）
- ✅ 焦点样式和 ARIA 标签
- ✅ 移动端适配
- ✅ 自动滚动到最新消息

## 🚀 如何使用

### 1. 启动开发模式

```bash
cd /Users/jiachengkun/projects/onyxmind
npm run dev
```

### 2. 在 Obsidian 中启用插件

1. 打开 Obsidian
2. 进入 **设置 → 社区插件**
3. 关闭安全模式（如果还没关闭）
4. 点击 **重新加载插件**
5. 找到并启用 **OnyxMind**

### 3. 配置插件

进入 **设置 → OnyxMind**：

#### 连接设置
- **OpenCode service URL**: `http://localhost:8080` (默认)
- **API key**: 输入你的 Anthropic API 密钥
- **Model**: 选择 Claude 模型（默认 Claude 3.5 Sonnet）

#### 行为设置
- **Default search scope**: 选择搜索范围（整个 vault 或当前文件夹）
- **Auto-save conversations**: 自动保存对话历史
- **Confirm file operations**: 文件操作前确认
- **Maximum history messages**: 最大历史消息数

#### 高级设置
- **Request timeout**: 请求超时时间（毫秒）
- **Maximum retries**: 最大重试次数
- **Stream responses**: 启用流式响应

### 4. 使用聊天功能

#### 方式 1: 使用 Ribbon 图标
点击左侧 Ribbon 栏的 💬 图标打开聊天面板

#### 方式 2: 使用命令面板
1. 按 `Cmd/Ctrl + P` 打开命令面板
2. 搜索 "OnyxMind"
3. 选择相应命令

#### 方式 3: 直接在聊天面板输入
1. 在聊天面板的输入框中输入问题
2. 按 `Enter` 发送（`Shift + Enter` 换行）
3. 等待 AI 回复

### 5. 使用快捷命令

#### 询问当前笔记
1. 打开一个笔记
2. 运行命令 `Ask about current note`
3. AI 会分析笔记内容并回答

#### 总结当前笔记
1. 打开一个笔记
2. 运行命令 `Summarize current note`
3. AI 会生成笔记摘要

## 📋 功能说明

### 聊天界面

```
┌─────────────────────────────────┐
│ OnyxMind          [➕] [🗑️]    │ ← 头部（新建会话、清空消息）
├─────────────────────────────────┤
│                                 │
│  Welcome to OnyxMind!           │
│                                 │
│  I can help you with:           │
│  • Answering questions          │
│  • Generating content           │
│  • Improving writing            │
│  • Summarizing documents        │
│                                 │
│  ┌─────────────────────────┐   │
│  │ User: Hello!            │   │ ← 用户消息
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Assistant: Hi! How can  │   │ ← AI 回复
│  │ I help you today?       │   │
│  └─────────────────────────┘   │
│                                 │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐│
│ │ Ask me anything...          ││ ← 输入框
│ └─────────────────────────────┘│
│                          [Send] │ ← 发送按钮
└─────────────────────────────────┘
```

### 会话管理

- **新建会话**: 点击头部的 ➕ 按钮
- **清空消息**: 点击头部的 🗑️ 按钮
- **会话持久化**: 会话会自动保存（如果启用了 auto-save）

### 消息格式

- **Markdown 支持**: 所有消息支持完整的 Markdown 格式
- **代码高亮**: 代码块自动高亮
- **链接**: 支持内部链接和外部链接
- **时间戳**: 每条消息显示发送时间

## 🔧 故障排查

### 问题 1: CORS 错误

**错误信息**:
```
Access to fetch at 'http://127.0.0.1:4096/session' from origin 'app://obsidian.md'
has been blocked by CORS policy
```

**原因**: 这是 Obsidian 环境的特殊限制

**解决方案**:
✅ **已修复** - 插件现在使用 Obsidian 的 `requestUrl` API 来绕过 CORS 限制。

如果仍然遇到问题：
1. 确保使用最新版本的插件
2. 重新构建: `npm run build`
3. 在 Obsidian 中重新加载插件
4. 查看 [CORS_FIX.md](./CORS_FIX.md) 了解详细信息

### 问题 2: "Failed to initialize OpenCode"

**原因**: 无法连接到 OpenCode 服务

**解决方案**:
```bash
# 确保 OpenCode 服务正在运行
opencode serve --port 8080

# 或者检查设置中的 URL 是否正确
```

### 问题 2: "Failed to create session"

**原因**: API 密钥未配置或无效

**解决方案**:
1. 进入设置 → OnyxMind
2. 输入有效的 Anthropic API 密钥
3. 保存设置并重新加载插件

### 问题 3: 消息发送后没有响应

**原因**:
- OpenCode 服务未运行
- API 密钥无效
- 网络问题

**解决方案**:
1. 检查开发者控制台（`Cmd/Ctrl + Shift + I`）查看错误
2. 确认 OpenCode 服务状态
3. 验证 API 密钥
4. 检查网络连接

### 问题 4: 样式显示不正常

**原因**: CSS 未正确加载

**解决方案**:
1. 重新加载 Obsidian
2. 检查 `styles.css` 文件是否存在
3. 尝试切换主题

### 问题 5: 插件无法加载

**原因**: 构建文件缺失或损坏

**解决方案**:
```bash
# 重新构建
npm run build

# 检查文件
ls -la main.js manifest.json styles.css
```

## 📝 使用技巧

### 1. 高效提问
```
❌ 不好: "帮我"
✅ 好: "请帮我总结这篇关于项目管理的笔记，重点关注关键方法论"
```

### 2. 利用上下文
使用 "Ask about current note" 命令，AI 会自动获取当前笔记的完整内容

### 3. 多轮对话
在同一个会话中继续提问，AI 会记住之前的对话内容

### 4. 快捷键
- `Enter`: 发送消息
- `Shift + Enter`: 换行
- `Cmd/Ctrl + P`: 打开命令面板

### 5. Markdown 格式
在输入框中可以使用 Markdown 格式，AI 的回复也会以 Markdown 渲染

## 🎯 下一步

### 已知限制
- ⚠️ 文件搜索功能暂未实现（API 类型不匹配）
- ⚠️ 会话持久化需要进一步测试
- ⚠️ 暂不支持文件操作可视化

### 计划改进
1. 修复文件搜索 API
2. 添加会话历史持久化
3. 实现文件操作可视化
4. 添加更多编辑器命令
5. 优化流式响应性能

### 参考文档
- [PRD.md](./PRD.md) - 产品需求文档
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 技术架构
- [ROADMAP.md](./ROADMAP.md) - 开发路线图
- [OBSIDIAN_BEST_PRACTICES.md](./OBSIDIAN_BEST_PRACTICES.md) - 开发规范

## 🐛 报告问题

如果遇到问题，请：
1. 检查开发者控制台的错误信息
2. 查看本文档的故障排查部分
3. 参考 CLAUDE.md 中的开发指南

## 🎊 恭喜！

你已经成功构建了 OnyxMind 插件的 MVP 版本！现在可以：
- 在 Obsidian 中测试所有功能
- 与 AI 进行对话
- 询问和总结笔记
- 体验流式响应

享受使用 OnyxMind 吧！🚀

---

**版本**: 0.1.0 MVP
**构建日期**: 2026-02-13
**状态**: ✅ 开发完成，准备测试
