import { setIcon } from "obsidian";
import type { KeyboardEvent, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import type {
  PermissionReply,
  StreamChunkPermission,
  StreamChunkQuestion,
} from "../../../core/stream";
import type { AvailableCommand } from "../../../core/stream";
import type { ProviderId, ProviderConfig } from "../../../settings";
import { PROVIDER_META } from "../../../settings";
import { t } from "../../../i18n";
import { PermissionComposer } from "./permission/permission-composer";
import { QuestionComposer } from "./question/question-composer";
import { SlashMenu } from "./slash-menu";

interface ChatComposerProps {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  inputText: string;
  isStreaming: boolean;
  slashMenuOpen: boolean;
  filteredCommands: AvailableCommand[];
  slashSelectedIndex: number;
  providerId: string;
  providerName: string;
  modelId: string;
  configuredProviders: ProviderConfig[];
  noteChipPath?: string | null;
  noteChipAttached?: boolean;
  activeQuestion?: StreamChunkQuestion | null;
  onQuestionReply?: (questionId: string, answers: string[][]) => Promise<void>;
  activePermission?: StreamChunkPermission | null;
  onPermissionReply?: (
    requestId: string,
    reply: PermissionReply,
  ) => Promise<void>;
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
  onRemoveNote?: () => void;
  onModelChange: (providerId: ProviderId, modelId: string) => void;
}

function NoteChip({
  path,
  attached,
  onRemove,
}: {
  path: string;
  attached: boolean;
  onRemove: () => void;
}) {
  const iconRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (iconRef.current) {
      setIcon(iconRef.current, "file-text");
    }
  }, []);

  const filename = path.split("/").pop() || path;
  const title = attached ? "已附加到上下文" : path;

  return (
    <div className="onyxmind-note-chip">
      <span ref={iconRef} className="onyxmind-note-chip-icon" />
      <span className="onyxmind-note-chip-name" title={title}>
        {filename}
      </span>
      {!attached && (
        <button
          type="button"
          className="onyxmind-note-chip-remove"
          aria-label="Remove current note from context"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onRemove}
        >
          ×
        </button>
      )}
    </div>
  );
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
    providerName,
    modelId,
    configuredProviders,
    noteChipPath,
    noteChipAttached = false,
    activeQuestion,
    onQuestionReply,
    activePermission,
    onPermissionReply,
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
    onRemoveNote,
    onModelChange,
  } = props;

  const sendIconRef = useRef<HTMLSpanElement>(null);
  const abortIconRef = useRef<HTMLSpanElement>(null);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);

  useEffect(() => {
    if (sendIconRef.current) {
      setIcon(sendIconRef.current, "paper-plane");
    }
    if (abortIconRef.current) {
      setIcon(abortIconRef.current, "square");
    }
  }, []);

  // Close model menu when clicking outside
  useEffect(() => {
    if (!modelMenuOpen) return;
    const handler = () => setModelMenuOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [modelMenuOpen]);

  return (
    <div className="onyxmind-input-container">
      {noteChipPath && onRemoveNote && (
        <div className="onyxmind-context-row">
          <NoteChip
            path={noteChipPath}
            attached={noteChipAttached}
            onRemove={onRemoveNote}
          />
        </div>
      )}

      {activePermission && onPermissionReply ? (
        <PermissionComposer
          permission={activePermission}
          onReply={onPermissionReply}
        />
      ) : activeQuestion && onQuestionReply ? (
        <QuestionComposer question={activeQuestion} onReply={onQuestionReply} />
      ) : (
        <>
          <textarea
            ref={inputRef}
            className="onyxmind-input"
            placeholder={t("placeholder.chatInput")}
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

          <SlashMenu
            open={slashMenuOpen}
            commands={filteredCommands}
            selectedIndex={slashSelectedIndex}
            onHover={onSetSlashSelectedIndex}
            onSelect={onApplySlashCommand}
          />

          <div className="onyxmind-input-footer">
            <div className="onyxmind-footer-info">
              <div
                className="onyxmind-model-picker"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="onyxmind-footer-model-chip"
                  title={`${providerId} / ${modelId}`}
                  aria-label="Select model"
                  aria-expanded={modelMenuOpen}
                  onClick={() => setModelMenuOpen((v) => !v)}
                >
                  <span className="onyxmind-footer-provider">
                    {providerName}
                  </span>
                  <span className="onyxmind-footer-sep">·</span>
                  <span className="onyxmind-footer-model">{modelId}</span>
                  <span className="onyxmind-footer-chevron">▾</span>
                </button>

                {modelMenuOpen && (
                  <div
                    className="onyxmind-model-menu"
                    role="listbox"
                    aria-label="Select model"
                  >
                    {configuredProviders.length === 0 ? (
                      <div className="onyxmind-model-menu-empty">
                        No providers configured
                      </div>
                    ) : (
                      configuredProviders.map((p) => (
                        <div key={p.id} className="onyxmind-model-menu-group">
                          <div className="onyxmind-model-menu-group-label">
                            {PROVIDER_META[p.id]?.name ?? p.id}
                          </div>
                          {p.models.map((m) => {
                            const isActive =
                              p.id === providerId && m.modelId === modelId;
                            return (
                              <button
                                key={m.modelId}
                                type="button"
                                role="option"
                                aria-selected={isActive}
                                className={`onyxmind-model-menu-item${isActive ? " is-active" : ""}`}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  onModelChange(p.id, m.modelId);
                                  setModelMenuOpen(false);
                                }}
                              >
                                {m.modelId}
                                {isActive && (
                                  <span className="onyxmind-model-menu-check">
                                    ✓
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <span className="onyxmind-footer-item">
                {t("label.slashHint")}
              </span>
              <span className="onyxmind-footer-item">
                {t("label.localSafe")}
              </span>
            </div>
            <div className="onyxmind-button-row">
              <button
                className="onyxmind-abort-button"
                style={{ display: isStreaming ? "" : "none" }}
                aria-label={t("aria.stop")}
                onClick={onAbort}
              >
                <span ref={abortIconRef} className="onyxmind-abort-icon" />
              </button>
              <button
                className="onyxmind-send-button"
                style={{ display: isStreaming ? "none" : "" }}
                aria-label={t("aria.send")}
                disabled={isStreaming}
                onClick={onSubmit}
              >
                <span ref={sendIconRef} className="onyxmind-send-icon" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
