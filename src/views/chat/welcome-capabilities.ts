/**
 * Welcome capabilities configuration
 * Defines the quick-start prompts shown when a new session is created
 */

export interface WelcomeCapability {
  id: string;
  icon: string;
  title: string;
  description: string;
  prompt: string;
}

export const WELCOME_CAPABILITIES: WelcomeCapability[] = [
  {
    id: "complete-metadata",
    icon: "📝",
    title: "完善笔记元信息",
    description: "自动补充标签、关键词和双链",
    prompt:
      "请帮我完善当前笔记的元信息，包括：\n1. 添加合适的标签（tags）\n 2. 完善 property 信息(title, date, type, status)\n 3. 根据笔记内容提取不超过 3 个关键词，并在笔记系统中检索相关笔记，追加到笔记结尾创建双链",
  },
  {
    id: "review-note",
    icon: "🔍",
    title: "审查笔记",
    description: "检查内容完整性和逻辑性",
    prompt:
      "请审查当前笔记，重点关注：\n1. 内容的完整性和连贯性\n2. 逻辑结构是否清晰\n3. 是否有遗漏或需要补充的部分\n4. 语言表达是否准确\n\n请给出具体的改进建议。",
  },
  {
    id: "quiz",
    icon: "🎯",
    title: "测验",
    description: "基于笔记内容生成测试题",
    prompt:
      "请基于当前笔记内容生成一套测验题：\n1. 包含 3-5 道选择题\n2. 使用 question 组件向我提问\n 3. 题目应覆盖笔记的核心知识点\n4. 每次只提出一个问题，等待回答后再继续下一题\n\n帮助我检验对这些内容的理解程度。",
  },
  {
    id: "zen-mode",
    icon: "🧘",
    title: "Zen 模式",
    description: "深度思考，引导探索",
    prompt:
      "请进入 Zen 模式，基于当前笔记内容：\n1. 提出 2-3 个深度思考问题\n2. 引导我从不同角度理解这个主题\n3. 探索潜在的关联和延伸方向\n4. 激发新的思考和洞察\n\n让我们一起深入探索这个话题。",
  },
];
