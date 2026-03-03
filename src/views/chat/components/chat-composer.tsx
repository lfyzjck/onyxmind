import type { KeyboardEvent, RefObject } from "react";
import type { AvailableCommand } from "../../../services/opencode-service";
import {
  ARIA_LABEL_SEND,
  ARIA_LABEL_SLASH_MENU,
  ARIA_LABEL_STOP,
  CLASS_IS_SELECTED,
  LABEL_LOCAL_SAFE,
  LABEL_NO_COMMANDS,
  LABEL_SEND,
  LABEL_SLASH_HINT,
  LABEL_STOP,
  PLACEHOLDER_CHAT_INPUT,
} from "../constants";

interface ChatComposerProps {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  inputText: string;
  isStreaming: boolean;
  slashMenuOpen: boolean;
  filteredCommands: AvailableCommand[];
  slashSelectedIndex: number;
  providerId: string;
  modelId: string;
  onInputChange: (value: string, cursor: number) => void;
  onInputClick: (value: string, cursor: number) => void;
  onInputKeyUp: (value: string, cursor: number, key: string) => void;
  onInputBlur: () => void;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
  onInputKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSetSlashSelectedIndex: (index: number) => void;
  onApplySlashCommand: (command: AvailableCommand) => void;
  onSubmit: () => void;
  onAbort: () => void;
}

export function ChatComposer(props: ChatComposerProps) {
  const {
    inputRef,
    inputText,
    isStreaming,
    slashMenuOpen,
    filteredCommands,
    slashSelectedIndex,
    providerId,
    modelId,
    onInputChange,
    onInputClick,
    onInputKeyUp,
    onInputBlur,
    onCompositionStart,
    onCompositionEnd,
    onInputKeyDown,
    onSetSlashSelectedIndex,
    onApplySlashCommand,
    onSubmit,
    onAbort,
  } = props;

  return (
    <div className="onyxmind-input-container">
      <textarea
        ref={inputRef}
        className="onyxmind-input"
        placeholder={PLACEHOLDER_CHAT_INPUT}
        rows={4}
        value={inputText}
        disabled={isStreaming}
        onChange={(event) => {
          const value = event.currentTarget.value;
          const cursor = event.currentTarget.selectionStart ?? value.length;
          onInputChange(value, cursor);
        }}
        onClick={(event) => {
          const value = event.currentTarget.value;
          const cursor = event.currentTarget.selectionStart ?? value.length;
          onInputClick(value, cursor);
        }}
        onKeyUp={(event) => {
          const value = event.currentTarget.value;
          const cursor = event.currentTarget.selectionStart ?? value.length;
          onInputKeyUp(value, cursor, event.key);
        }}
        onBlur={onInputBlur}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        onKeyDown={onInputKeyDown}
      />

      {slashMenuOpen && (
        <div
          className="onyxmind-slash-menu"
          role="listbox"
          aria-label={ARIA_LABEL_SLASH_MENU}
        >
          {filteredCommands.length === 0 && (
            <div className="onyxmind-slash-empty">{LABEL_NO_COMMANDS}</div>
          )}
          {filteredCommands.map((command, index) => (
            <button
              key={`${command.source}:${command.name}`}
              type="button"
              role="option"
              aria-selected={index === slashSelectedIndex}
              className={`onyxmind-slash-item ${index === slashSelectedIndex ? CLASS_IS_SELECTED : ""}`}
              onMouseEnter={() => onSetSlashSelectedIndex(index)}
              onMouseDown={(event) => {
                event.preventDefault();
                onApplySlashCommand(command);
              }}
            >
              <span className="onyxmind-slash-name">/{command.name}</span>
              {command.description && (
                <span className="onyxmind-slash-description">
                  {command.description}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="onyxmind-input-footer">
        <span className="onyxmind-footer-item">{providerId}</span>
        <span className="onyxmind-footer-item">{modelId}</span>
        <span className="onyxmind-footer-item">{LABEL_SLASH_HINT}</span>
        <span className="onyxmind-footer-item">{LABEL_LOCAL_SAFE}</span>
      </div>

      <div className="onyxmind-button-row">
        <button
          className="onyxmind-abort-button"
          style={{ display: isStreaming ? "" : "none" }}
          aria-label={ARIA_LABEL_STOP}
          onClick={onAbort}
        >
          {LABEL_STOP}
        </button>
        <button
          className="onyxmind-send-button"
          style={{ display: isStreaming ? "none" : "" }}
          aria-label={ARIA_LABEL_SEND}
          disabled={isStreaming}
          onClick={onSubmit}
        >
          {LABEL_SEND}
        </button>
      </div>
    </div>
  );
}
