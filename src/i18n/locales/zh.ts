import type { en } from "./en";

type Translations = Record<keyof typeof en, string>;

export const zh: Translations = {
  // Brand
  "brand.name": "OnyxMind",

  // Commands
  "command.openChat": "打开对话",
  "command.askAboutNote": "询问当前笔记",
  "command.summarizeNote": "总结当前笔记",

  // Notices
  "notice.failedInit": "服务初始化失败，请检查设置。",
  "notice.noActiveFile": "没有打开的文件",

  // Labels
  "label.noCommands": "无命令",
  "label.noSessions": "无会话",
  "label.slashHint": "斜杠: /",
  "label.localSafe": "本地安全",
  "label.stop": "停止",
  "label.send": "发送",
  "label.running": "运行中...",
  "label.error": "错误",
  "label.thought": "思考",
  "label.output": "输出",

  // Placeholders
  "placeholder.chatInput": "今天我能帮您做什么？",

  // Aria labels
  "aria.slashMenu": "斜杠命令",
  "aria.stop": "停止生成",
  "aria.send": "发送消息",
  "aria.refreshSessions": "刷新会话",
  "aria.sessionHistory": "会话历史",
  "aria.newSession": "新建会话",
  "aria.clearMessages": "清除消息",
  "aria.removeModel": "移除模型",
  "aria.denyPermission": "拒绝权限",
  "aria.allowOnce": "允许一次",
  "aria.allowAlways": "始终允许",

  // Permission composer
  "permission.title": "需要权限：",
  "permission.request": "权限请求",
  "permission.viewDiff": "查看差异",
  "permission.allowOnce": "允许一次",
  "permission.allowAlways": "始终允许",
  "permission.deny": "拒绝",

  // Question display
  "question.interrupted": "会话已中断，问题未得到回答",

  // Welcome cards
  "welcome.title": "欢迎使用 OnyxMind",
  "welcome.subtitle": "选择快速开始选项或输入问题",
  "welcome.footer": "输入 / 浏览可用命令",

  // Settings tabs
  "settings.tab.provider": "提供商",
  "settings.tab.agent": "代理",
  "settings.tab.permission": "权限",
  "settings.tab.advanced": "高级",

  // Settings - Provider
  "settings.provider.apiKey": "API 密钥",
  "settings.provider.apiBaseUrl": "API 基础 URL",
  "settings.provider.modelId": "模型 ID",
  "settings.provider.maxTokens": "最大 Token 数",
  "settings.provider.reasoning": "推理",
  "settings.provider.addModel": "+ 添加模型",
  "settings.provider.activeModel": "当前模型",
  "settings.provider.provider": "提供商",
  "settings.provider.model": "模型",
  "settings.provider.status.active": "已激活",
  "settings.provider.status.configured": "已配置",
  "settings.provider.status.noKey": "无 API 密钥",

  // Settings - Agent
  "settings.agent.searchScope": "默认搜索范围",
  "settings.agent.searchScope.desc": "默认搜索笔记的位置。",
  "settings.agent.searchScope.vault": "整个知识库",
  "settings.agent.searchScope.folder": "当前文件夹",
  "settings.agent.autoSave": "自动保存对话",
  "settings.agent.autoSave.desc": "自动保存对话历史。",
  "settings.agent.maxSessions": "最大活跃会话数",
  "settings.agent.maxSessions.desc": "限制同时打开的会话数量。",
  "settings.agent.confirmOps": "确认文件操作",
  "settings.agent.confirmOps.desc": "AI 修改文件前请求确认。",
  "settings.agent.maxHistory": "最大历史消息数",
  "settings.agent.maxHistory.desc": "保留在历史记录中的最大消息数量。",
  "settings.agent.showTools": "流式传输后显示工具调用",
  "settings.agent.showTools.desc": "响应完成后保持工具调用详情可见。",

  // Settings - Advanced
  "settings.advanced.serviceUrl": "服务 URL",
  "settings.advanced.serviceUrl.desc": "OpenCode 服务的基础 URL。",
  "settings.advanced.timeout": "请求超时",
  "settings.advanced.timeout.desc": "API 请求超时时间（毫秒）。",
  "settings.advanced.retries": "最大重试次数",
  "settings.advanced.retries.desc": "失败请求的最大重试次数。",
  "settings.advanced.stream": "流式响应",
  "settings.advanced.stream.desc": "实时显示 AI 响应。",

  // Settings - Permission
  "settings.permission.writePerms": "写入权限",
  "settings.permission.yolo": "Yolo 模式",
  "settings.permission.yolo.desc": "允许代理不经确认修改笔记。",
  "settings.permission.allowDelete": "允许删除",
  "settings.permission.allowDelete.desc":
    "允许代理删除笔记。关闭时，删除操作始终需要确认。",
  "settings.permission.pathRestrictions": "路径限制",
  "settings.permission.protectedPaths": "受保护路径",
  "settings.permission.protectedPaths.desc":
    "代理永远不会修改或删除这些路径中的笔记。",
  "settings.permission.allowedPaths": "允许路径（白名单）",
  "settings.permission.allowedPaths.desc":
    "限制代理仅在这些路径中操作。留空表示允许访问整个知识库。",
  "settings.permission.advanced": "高级",
  "settings.permission.frontmatter": "遵守 frontmatter 保护",
  "settings.permission.frontmatter.desc":
    '防止代理修改在 frontmatter 中设置了 "protected: true" 的笔记。',
};
