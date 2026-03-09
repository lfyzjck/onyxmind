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
└── docs/
    ├── PRD.md
    ├── ARCHITECTURE.md
    ├── OBSIDIAN_BEST_PRACTICES.md
    ├── ROADMAP.md
    └── IMPLEMENTATION_EXAMPLE.ts
```

## 开发规范

1. 我们遵循 fail-fast 原则，除非必要否则不增加容错代码;
2. 每次完成代码编写，你需要执行 `bun run lint` 验证代码的格式问题并进行修复;
3. 所有检查完成后，你需要执行 `bun run build` 构建插件;
