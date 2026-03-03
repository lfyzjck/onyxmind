# OpenCode 自定义 Skills 配置指南

> 参考：https://open-code.ai/en/docs/skills

## 概述

Skills 是可复用的 AI 代理指令，通过原生的 `skill` 工具按需加载。Agent 会看到可用技能列表，在需要时加载完整内容。

---

## 1. 放置位置

OpenCode 从以下目录自动发现 skills（每个 skill 一个文件夹，内含 `SKILL.md`）：

### 项目级（Project-local）

| 路径                               | 说明              |
| ---------------------------------- | ----------------- |
| `.opencode/skills/<name>/SKILL.md` | OpenCode 项目配置 |
| `.claude/skills/<name>/SKILL.md`   | Claude Code 兼容  |
| `.agents/skills/<name>/SKILL.md`   | Agent 兼容        |

### 全局（Global）

| 路径                                        | 说明          |
| ------------------------------------------- | ------------- |
| `~/.config/opencode/skills/<name>/SKILL.md` | 全局 OpenCode |
| `~/.claude/skills/<name>/SKILL.md`          | 全局 Claude   |
| `~/.agents/skills/<name>/SKILL.md`          | 全局 Agent    |

### OnyxMind 中的工作目录

OnyxMind 创建会话时会将 `directory` 设为 **vault 根路径**。因此：

- **Vault 内**：在 vault 根目录创建 `.opencode/skills/<name>/SKILL.md` 即可被发现
- **全局**：`~/.config/opencode/skills/` 下的 skills 始终可用

---

## 2. SKILL.md 格式

每个 `SKILL.md` 必须以 YAML frontmatter 开头，**必须**包含 `name` 和 `description`：

```yaml
---
name: git-release          # 必填，且需与目录名一致
description: Create consistent releases and changelogs  # 必填，1-1024 字符
license: MIT               # 可选
compatibility: opencode    # 可选
metadata:                  # 可选
  audience: maintainers
  workflow: github
---

## What I do

- Draft release notes from merged PRs
- Propose a version bump
- Provide a copy-pasteable `gh release create` command

## When to use me

Use this when you are preparing a tagged release.
Ask clarifying questions if the target versioning scheme is unclear.
```

### 命名规则

`name` 必须：

- 与包含 `SKILL.md` 的目录名一致
- 小写字母数字，用单个连字符分隔
- 1–64 字符
- 不包含连续 `--`
- 不以 `-` 开头或结尾

等效正则：`^[a-z0-9]+(-[a-z0-9]+)*$`

---

## 3. 示例：在 Vault 中创建 Obsidian 技能

在 vault 根目录创建 `.opencode/skills/obsidian-notes/SKILL.md`：

```markdown
---
name: obsidian-notes
description: 处理 Obsidian vault 中的笔记，遵循 Markdown 和双链最佳实践
---

## 我能做什么

- 创建、编辑、重命名笔记
- 管理 frontmatter 和标签
- 建立双链（[[链接]]）
- 按 vault 结构组织笔记

## 何时使用

当用户需要管理 Obsidian 笔记、创建新笔记或整理知识库时使用此技能。
```

---

## 4. 权限配置

在 `opencode.json`（项目根或 `~/.config/opencode/opencode.json`）中配置：

```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "pr-review": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
```

| 权限    | 行为                      |
| ------- | ------------------------- |
| `allow` | 立即加载                  |
| `deny`  | 对 agent 隐藏，访问被拒绝 |
| `ask`   | 加载前需用户确认          |

支持通配符：`internal-*` 可匹配 `internal-docs`、`internal-tools` 等。

### 按 Agent 覆盖

在 agent 的 frontmatter 中：

```yaml
---
permission:
  skill:
    "documents-*": "allow"
---
```

在 `opencode.json` 中为内置 agent 配置：

```json
{
  "agent": {
    "plan": {
      "permission": {
        "skill": {
          "internal-*": "allow"
        }
      }
    }
  }
}
```

---

## 5. 禁用 skill 工具

若某 agent 不应使用 skills，可完全禁用：

**自定义 agent：**

```yaml
---
tools:
  skill: false
---
```

**opencode.json：**

```json
{
  "agent": {
    "plan": {
      "tools": {
        "skill": false
      }
    }
  }
}
```

---

## 6. 自定义配置目录（OPENCODE_CONFIG_DIR）

若需从非标准目录加载 skills，可设置环境变量：

```bash
export OPENCODE_CONFIG_DIR=/path/to/my/config-directory
opencode serve
```

该目录会像 `.opencode` 一样被搜索，需包含 `skills/` 子目录。

**OnyxMind 集成**：当前 `createOpencodeServerPatched` 通过 `OPENCODE_CONFIG_CONTENT` 传入 config。若需额外 skills 目录，可在 `opencode-server.ts` 中为 spawn 的 `env` 添加 `OPENCODE_CONFIG_DIR`。

---

## 7. 环境变量

| 变量                                  | 说明                              |
| ------------------------------------- | --------------------------------- |
| `OPENCODE_CONFIG`                     | 自定义配置文件路径                |
| `OPENCODE_CONFIG_DIR`                 | 自定义配置目录（含 skills）       |
| `OPENCODE_CONFIG_CONTENT`             | 内联 JSON 配置（OnyxMind 已使用） |
| `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS` | 禁用 `.claude/skills` 加载        |

---

## 8. 故障排查

若 skill 未出现：

1. 检查权限：`deny` 的 skill 对 agent 不可见
2. 确保 `name` 和 `description` 在 frontmatter 中
3. 确认 `SKILL.md` 全大写拼写
4. 确保各位置下 skill 名称唯一
