export const en = {
  // Brand
  "brand.name": "OnyxMind",

  // Commands
  "command.openChat": "Open chat",
  "command.askAboutNote": "Ask about current note",
  "command.summarizeNote": "Summarize current note",

  // Notices
  "notice.failedInit": "Failed to initialize service. Check settings.",
  "notice.noActiveFile": "No active file",

  // Labels
  "label.noCommands": "No commands",
  "label.noSessions": "No sessions",
  "label.slashHint": "Slash: /",
  "label.localSafe": "Local safe",
  "label.stop": "Stop",
  "label.send": "Send",
  "label.running": "Running...",
  "label.error": "Error",
  "label.thought": "Thought",
  "label.output": "Output",

  // Placeholders
  "placeholder.chatInput": "How can I help you today?",

  // Aria labels
  "aria.slashMenu": "Slash commands",
  "aria.stop": "Stop generating",
  "aria.send": "Send message",
  "aria.refreshSessions": "Refresh sessions",
  "aria.sessionHistory": "Session history",
  "aria.newSession": "New session",
  "aria.clearMessages": "Clear messages",
  "aria.removeModel": "Remove model",
  "aria.denyPermission": "Deny permission",
  "aria.allowOnce": "Allow once",
  "aria.allowAlways": "Allow always",

  // Permission composer
  "permission.title": "Permission required:",
  "permission.request": "Permission request",
  "permission.viewDiff": "View diff",
  "permission.allowOnce": "Allow once",
  "permission.allowAlways": "Allow always",
  "permission.deny": "Deny",

  // Question display
  "question.interrupted": "Session interrupted, question left unanswered",

  // Welcome cards
  "welcome.title": "Welcome to OnyxMind",
  "welcome.subtitle": "Choose a quick start option or type a question to begin",
  "welcome.footer": "Type / to browse available commands",

  // Settings tabs
  "settings.tab.provider": "Provider",
  "settings.tab.agent": "Agent",
  "settings.tab.permission": "Permission",
  "settings.tab.advanced": "Advanced",

  // Settings - Provider
  "settings.provider.apiKey": "API Key",
  "settings.provider.apiBaseUrl": "API Base URL",
  "settings.provider.modelId": "Model ID",
  "settings.provider.maxTokens": "Max Tokens",
  "settings.provider.reasoning": "Reasoning",
  "settings.provider.addModel": "+ Add Model",
  "settings.provider.activeModel": "Active Model",
  "settings.provider.provider": "Provider",
  "settings.provider.model": "Model",
  "settings.provider.status.active": "Active",
  "settings.provider.status.configured": "Configured",
  "settings.provider.status.noKey": "No API key",

  // Settings - Agent
  "settings.agent.searchScope": "Default search scope",
  "settings.agent.searchScope.desc": "Where to search for notes by default.",
  "settings.agent.searchScope.vault": "Entire vault",
  "settings.agent.searchScope.folder": "Current folder",
  "settings.agent.autoSave": "Auto-save conversations",
  "settings.agent.autoSave.desc": "Automatically save conversation history.",
  "settings.agent.maxSessions": "Maximum active sessions",
  "settings.agent.maxSessions.desc":
    "Limit how many sessions can stay open at the same time.",
  "settings.agent.confirmOps": "Confirm file operations",
  "settings.agent.confirmOps.desc":
    "Ask for confirmation before AI modifies files.",
  "settings.agent.maxHistory": "Maximum history messages",
  "settings.agent.maxHistory.desc":
    "Maximum number of messages to keep in history.",
  "settings.agent.showTools": "Show tool calls after streaming",
  "settings.agent.showTools.desc":
    "Keep tool call details visible after a response finishes streaming.",

  // Settings - Advanced
  "settings.advanced.serviceUrl": "Service URL",
  "settings.advanced.serviceUrl.desc": "Base URL for the OpenCode service.",
  "settings.advanced.timeout": "Request timeout",
  "settings.advanced.timeout.desc": "Timeout for API requests in milliseconds.",
  "settings.advanced.retries": "Maximum retries",
  "settings.advanced.retries.desc":
    "Maximum number of retry attempts for failed requests.",
  "settings.advanced.stream": "Stream responses",
  "settings.advanced.stream.desc":
    "Show AI responses in real-time as they are generated.",

  // Settings - Permission
  "settings.permission.writePerms": "Write Permissions",
  "settings.permission.yolo": "Yolo mode",
  "settings.permission.yolo.desc":
    "Allow agent to modify notes without asking for confirmation.",
  "settings.permission.allowDelete": "Allow delete",
  "settings.permission.allowDelete.desc":
    "Allow agent to delete notes. When off, delete operations always require confirmation.",
  "settings.permission.pathRestrictions": "Path Restrictions",
  "settings.permission.protectedPaths": "Protected paths",
  "settings.permission.protectedPaths.desc":
    "Agent will never modify or delete notes in these paths.",
  "settings.permission.allowedPaths": "Allowed paths (whitelist)",
  "settings.permission.allowedPaths.desc":
    "Restrict agent to only operate within these paths. Leave empty to allow access to the entire vault.",
  "settings.permission.advanced": "Advanced",
  "settings.permission.frontmatter": "Respect frontmatter protection",
  "settings.permission.frontmatter.desc":
    'Prevent agent from modifying notes that have "protected: true" in their frontmatter.',
} as const;
