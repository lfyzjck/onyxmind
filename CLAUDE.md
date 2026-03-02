# Claude 开发指南

本文档为 Claude AI 助手提供项目特定的开发指导。

## 项目概述

OnyxMind 是一款基于 OpenCode AI Agent 框架的 Obsidian 智能助手插件。

**核心原理**：
- 插件仅作为用户交互入口
- 所有 AI 处理和文件操作由 OpenCode Agent 在服务端完成
- 通过 OpenCode SDK 与服务通信

## 参考资源

### 代码参考
当实现插件功能时遇到不确定的问题，可以参考以下项目的代码实现：

**infio-copilot** (类似功能的 Obsidian 插件)
- 路径: `/Users/jiachengkun/opensource/infio-copilot`
- 用途: 参考 UI 实现、Obsidian API 使用模式、用户交互设计

### 技术文档
- OpenCode SDK: https://opencode.ai/docs/sdk/
- Obsidian API: https://docs.obsidian.md
- 项目设计文档: 见 `PRD.md`, `ARCHITECTURE.md`, `OBSIDIAN_BEST_PRACTICES.md`

## 开发规范

### 必须遵守的 Obsidian 最佳实践

1. **内存管理**
   - ✅ 使用 `registerEvent()`, `addCommand()` 等注册方法
   - ❌ 不要存储视图引用在插件属性中

2. **类型安全**
   - ✅ 使用 `instanceof` 检查 TFile/TFolder
   - ❌ 不要使用类型转换 (as TFile)

3. **命名规范**
   - 插件 ID: "onyxmind"
   - 命令名称: sentence case (如 "Open chat")
   - 不包含 "command" 字样

4. **文件操作**
   - ✅ 使用 Editor API 编辑活动文件
   - ✅ 使用 `Vault.process()` 后台修改文件
   - ✅ 使用 `requestUrl()` 而非 `fetch()`

5. **可访问性（强制）**
   - 所有交互元素支持键盘导航
   - 图标按钮添加 aria-label
   - 使用 `:focus-visible` 定义焦点样式

详细规范见 `OBSIDIAN_BEST_PRACTICES.md`

## 项目结构

```
onyxmind/
├── src/
│   ├── main.ts              # 插件主类
│   ├── settings.ts          # 设置管理
│   ├── services/
│   │   ├── opencode.ts      # OpenCode 服务封装
│   │   └── session.ts       # 会话管理
│   ├── views/
│   │   └── chat-view.ts     # 聊天界面
│   └── commands/
│       └── editor-commands.ts
├── styles.css               # 样式文件
├── manifest.json            # 插件清单
└── 设计文档/
    ├── PRD.md
    ├── ARCHITECTURE.md
    ├── OBSIDIAN_BEST_PRACTICES.md
    ├── ROADMAP.md
    └── IMPLEMENTATION_EXAMPLE.ts
```

## 开发流程

### 当前阶段: 准备工作

下一步任务:
1. 安装 OpenCode SDK: `npm install @opencode-ai/sdk`
2. 实现 OpencodeService 基础功能
3. 创建简单的聊天界面

### 实现优先级

**P0 (MVP 必需)**:
- 基础对话界面
- OpenCode SDK 集成
- 简单问答功能
- 基础配置页面

**P1 (重要功能)**:
- 流式响应显示
- 文件操作可视化
- 快速命令集成
- 对话历史管理

详细路线图见 `ROADMAP.md`

## 代码示例参考

完整的实现示例见 `IMPLEMENTATION_EXAMPLE.ts`，包含:
- 插件主类实现
- OpenCode 服务封装
- 会话管理器
- 聊天视图
- 设置页面

所有代码遵循 Obsidian 最佳实践。

## 注意事项

1. **参考 infio-copilot 时**
   - 学习 UI 实现模式和用户交互设计
   - 注意其可能未遵循所有 Obsidian 最佳实践
   - 始终以本项目的 `OBSIDIAN_BEST_PRACTICES.md` 为准

2. **OpenCode 集成**
   - 所有文件操作由 OpenCode Agent 完成
   - 插件只负责 UI 和请求转发
   - 使用流式响应提升用户体验

3. **测试要求**
   - 桌面端 (Windows/macOS/Linux)
   - 移动端 (iOS/Android)
   - 键盘导航测试
   - 性能测试

## 问题排查

如遇到问题，按以下顺序排查:
1. 检查是否遵循 `OBSIDIAN_BEST_PRACTICES.md`
2. 参考 `IMPLEMENTATION_EXAMPLE.ts` 的实现模式
3. 查看 infio-copilot 的类似功能实现
4. 查阅 Obsidian API 文档
5. 检查 OpenCode SDK 文档

## 更新日志

- 2026-02-13: 创建初始版本，添加 infio-copilot 参考路径
