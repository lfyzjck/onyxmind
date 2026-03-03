import { useEffect } from "react";
import { ChatComposer } from "./components/chat-composer";
import { ChatHeader } from "./components/chat-header";
import { MessagesPanel } from "./components/messages-panel";
import { SessionStrip } from "./components/session-strip";
import { useChatController } from "./hooks/use-chat-controller";
import type { ChatViewAppProps } from "./types";

export function ChatViewApp(props: ChatViewAppProps) {
  const { plugin, onReady } = props;
  const controller = useChatController(plugin);

  useEffect(() => {
    onReady({ sendMessage: controller.sendMessage });
    return () => onReady(null);
  }, [controller.sendMessage, onReady]);

  return (
    <div className="onyxmind-chat-container">
      <ChatHeader
        scopeLabel={controller.scopeLabel}
        onRefresh={controller.handleToolbarRefresh}
      />

      <MessagesPanel
        plugin={plugin}
        messagesRef={controller.messagesRef}
        messages={controller.activeMessages}
        isStreaming={controller.isStreaming}
        streamText={controller.streamText}
        streamThinking={controller.streamThinking}
        streamTools={controller.toolChunks}
        errors={controller.errors}
      />

      <div className="onyxmind-composer">
        <SessionStrip
          sessions={controller.sessions}
          activeSessionId={controller.activeSessionId}
          onSwitchSession={controller.handleSwitchSession}
          onCloseSession={controller.handleCloseSession}
          onNewSession={controller.handleNewSession}
          onClearMessages={controller.handleClearMessages}
          onRefresh={controller.handleToolbarRefresh}
        />

        <ChatComposer
          inputRef={controller.inputRef}
          inputText={controller.inputText}
          isStreaming={controller.isStreaming}
          slashMenuOpen={controller.slashMenuOpen}
          filteredCommands={controller.filteredCommands}
          slashSelectedIndex={controller.slashSelectedIndex}
          providerId={controller.providerId}
          modelId={controller.modelId}
          onInputChange={controller.handleInputChange}
          onInputClick={controller.handleInputClick}
          onInputKeyUp={controller.handleInputKeyUp}
          onInputBlur={controller.handleInputBlur}
          onCompositionStart={controller.handleCompositionStart}
          onCompositionEnd={controller.handleCompositionEnd}
          onInputKeyDown={controller.handleInputKeyDown}
          onSetSlashSelectedIndex={controller.handleSetSlashSelectedIndex}
          onApplySlashCommand={controller.handleApplySlashCommand}
          onSubmit={controller.handleSubmit}
          onAbort={controller.handleAbort}
        />
      </div>
    </div>
  );
}
