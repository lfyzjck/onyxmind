import { MessageBubble } from "./message-bubble";
import { StreamingBubble } from "./streaming-bubble";
import { WelcomeCards } from "./welcome-cards";
import { QuestionReplyContext } from "../question-reply-context";
import type OnyxMindPlugin from "../../../main";
import type { Message, StreamChunkToolUse } from "../../../core/stream";
import { useEffect, type RefObject } from "react";
import { t } from "../../../i18n";
import { registerFileLinkClickHandler } from "../file-link";

interface MessagesPanelProps {
  plugin: OnyxMindPlugin;
  messagesRef: RefObject<HTMLDivElement | null>;
  messages: Message[];
  isStreaming: boolean;
  streamText: string;
  streamThinking: string;
  streamTools: StreamChunkToolUse[];
  hasActiveQuestion: boolean;
  onQuestionReply: (questionId: string, answers: string[][]) => Promise<void>;
  onSelectCapability: (prompt: string) => void;
  errors: string[];
}

export function MessagesPanel(props: MessagesPanelProps) {
  const {
    plugin,
    messagesRef,
    messages,
    isStreaming,
    streamText,
    streamThinking,
    streamTools,
    hasActiveQuestion,
    onQuestionReply,
    onSelectCapability,
    errors,
  } = props;

  const showWelcome = messages.length === 0 && !isStreaming;

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) {
      return;
    }

    return registerFileLinkClickHandler(plugin.app, container);
  }, [messagesRef, plugin]);

  return (
    <QuestionReplyContext.Provider value={onQuestionReply}>
      <div className="onyxmind-messages" ref={messagesRef}>
        {showWelcome && (
          <WelcomeCards onSelectCapability={onSelectCapability} />
        )}

        {messages.map((message, idx) => (
          <MessageBubble
            key={`${message.timestamp}-${idx}`}
            plugin={plugin}
            message={message}
          />
        ))}

        {isStreaming && (
          <StreamingBubble
            plugin={plugin}
            text={streamText}
            thinking={streamThinking}
            tools={streamTools}
          />
        )}

        <div
          className="onyxmind-thinking"
          style={{
            display: isStreaming && !hasActiveQuestion ? "flex" : "none",
          }}
        >
          <span>{t("label.running")}</span>
        </div>

        {errors.map((error, idx) => (
          <div className="onyxmind-error" key={`${idx}-${error}`}>
            <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
              <span>{t("label.error")}</span>
            </div>
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {error}
            </div>
          </div>
        ))}
      </div>
    </QuestionReplyContext.Provider>
  );
}
