/**
 * Welcome capabilities configuration
 * Defines the quick-start prompts shown when a new session is created
 */
import { getCurrentLocale } from "../../i18n";

export interface WelcomeCapability {
  id: string;
  icon: string;
  title: string;
  description: string;
  prompt: string;
}

const EN_CAPABILITIES: WelcomeCapability[] = [
  {
    id: "complete-metadata",
    icon: "📝",
    title: "Complete note metadata",
    description: "Auto-add tags, keywords and backlinks",
    prompt:
      "Please help me complete the metadata for the current note, including:\n1. Add appropriate tags\n2. Complete property info (title, date, type, status)\n3. Extract up to 3 keywords from the note content, search for related notes, and add backlinks at the end of the note",
  },
  {
    id: "review-note",
    icon: "🔍",
    title: "Review note",
    description: "Check completeness and logic",
    prompt:
      "Please review the current note, focusing on:\n1. Completeness and coherence of content\n2. Clarity of logical structure\n3. Any missing or supplementary parts\n4. Accuracy of language\n\nPlease provide specific improvement suggestions.",
  },
  {
    id: "quiz",
    icon: "🎯",
    title: "Quiz",
    description: "Generate test questions from note content",
    prompt:
      "Please generate a quiz based on the current note content:\n1. Include 3-5 multiple choice questions\n2. Use the question component to ask me\n3. Questions should cover the core knowledge points\n4. Ask one question at a time, wait for an answer before continuing\n\nHelp me test my understanding of the content.",
  },
  {
    id: "zen-mode",
    icon: "🧘",
    title: "Zen mode",
    description: "Deep thinking, guided exploration",
    prompt:
      "Please enter Zen mode, based on the current note content:\n1. Raise 2-3 deep thinking questions\n2. Guide me to understand this topic from different angles\n3. Explore potential connections and extensions\n4. Inspire new thoughts and insights\n\nLet's explore this topic together.",
  },
];

const ZH_CAPABILITIES: WelcomeCapability[] = [
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

export function getWelcomeCapabilities(): WelcomeCapability[] {
  return getCurrentLocale() === "zh" ? ZH_CAPABILITIES : EN_CAPABILITIES;
}
