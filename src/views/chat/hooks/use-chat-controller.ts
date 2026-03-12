import { Notice } from "obsidian";
import {
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type OnyxMindPlugin from "../../../main";
import type {
  AvailableCommand,
  Message,
  StreamChunkToolUse,
} from "../../../services/opencode-service";
import type {
  CreateSessionResult,
  OnyxMindSession,
} from "../../../services/session-manager";
import { findSlashMatch } from "../slash";
import type { ToolCardMap } from "../types";

interface UseChatControllerResult {
  messagesRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  sessions: OnyxMindSession[];
  activeSessionId: string | null;
  activeMessages: Message[];
  scopeLabel: string;
  inputText: string;
  isStreaming: boolean;
  streamText: string;
  streamThinking: string;
  toolChunks: StreamChunkToolUse[];
  activeQuestion: StreamChunkToolUse | null;
  errors: string[];
  slashMenuOpen: boolean;
  filteredCommands: AvailableCommand[];
  slashSelectedIndex: number;
  providerId: string;
  modelId: string;
  historyMenuOpen: boolean;
  historySessions: OnyxMindSession[];
  historySelectedIndex: number;
  handleToolbarRefresh: () => void;
  handleSwitchSession: (sessionId: string) => void;
  handleCloseSession: (sessionId: string) => void;
  handleNewSession: () => void;
  handleClearMessages: () => void;
  handleToggleHistory: () => void;
  handleLoadHistorySession: (sessionId: string) => void;
  handleCloseHistoryMenu: () => void;
  handleSetHistorySelectedIndex: (index: number) => void;
  handleInputChange: (value: string, cursor: number) => void;
  handleInputClick: (value: string, cursor: number) => void;
  handleInputKeyUp: (value: string, cursor: number, key: string) => void;
  handleInputBlur: () => void;
  handleCompositionStart: () => void;
  handleCompositionEnd: () => void;
  handleInputKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  handleSetSlashSelectedIndex: (index: number) => void;
  handleApplySlashCommand: (command: AvailableCommand) => void;
  handleSubmit: () => void;
  handleAbort: () => void;
  handleQuestionReply: (
    questionId: string,
    answers: string[][],
  ) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  noteChipPath: string | null;
  noteChipAttached: boolean;
  handleRemoveNote: () => void;
}

const ABORT_ERROR_NAME = "MessageAbortedError";

export function useChatController(
  plugin: OnyxMindPlugin,
): UseChatControllerResult {
  const sentNoteSessionIds = useRef<Set<string>>(new Set());
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);
  const isAbortingRef = useRef(false);
  const activeSessionIdRef = useRef<string | null>(null);
  const [initNotePath] = useState<string | null>(
    () => plugin.app.workspace.getActiveFile()?.path ?? null,
  );
  const currentNotePathRef = useRef<string | null>(initNotePath);
  const userRemovedNoteRef = useRef(false);

  const [sessions, setSessions] = useState<OnyxMindSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentNotePath, setCurrentNotePath] = useState<string | null>(
    initNotePath,
  );
  const [showNoteChip, setShowNoteChip] = useState<boolean>(
    initNotePath !== null,
  );
  const [attachedNotePath, setAttachedNotePath] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [commands, setCommands] = useState<AvailableCommand[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [streamThinking, setStreamThinking] = useState("");
  const [streamTools, setStreamTools] = useState<ToolCardMap>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [slashStart, setSlashStart] = useState<number | null>(null);
  const [slashEnd, setSlashEnd] = useState<number | null>(null);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);
  const [historyMenuOpen, setHistoryMenuOpen] = useState(false);
  const [historySessions, setHistorySessions] = useState<OnyxMindSession[]>([]);
  const [historySelectedIndex, setHistorySelectedIndex] = useState(0);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );
  const activeMessages = activeSession?.messages ?? [];

  const scopeLabel = useMemo(() => {
    const vaultPath = plugin.opencodeService.getVaultPath() ?? "";
    if (!vaultPath) {
      return `${sessions.length} sessions`;
    }
    const normalized = vaultPath.replace(/\\/g, "/");
    const parts = normalized.split("/").filter(Boolean);
    const vaultName = parts[parts.length - 1] ?? vaultPath;
    return `${vaultName} · ${sessions.length} sessions`;
  }, [plugin, sessions.length]);

  const toolChunks = useMemo(() => Object.values(streamTools), [streamTools]);
  const activeQuestion = useMemo(
    () =>
      toolChunks.find(
        (t) => t.tool === "question" && t.status === "running" && t.questionId,
      ) ?? null,
    [toolChunks],
  );
  const slashMenuOpen = slashStart !== null && !isStreaming;

  const filteredCommands = useMemo((): AvailableCommand[] => {
    if (slashStart === null) {
      return [];
    }

    const query = slashQuery.trim().toLowerCase();
    if (!query) {
      return commands;
    }

    const startsWith: AvailableCommand[] = [];
    const contains: AvailableCommand[] = [];

    for (const command of commands) {
      const name = command.name.toLowerCase();
      const description = command.description.toLowerCase();
      if (!name.includes(query) && !description.includes(query)) {
        continue;
      }
      if (name.startsWith(query)) {
        startsWith.push(command);
      } else {
        contains.push(command);
      }
    }

    return [...startsWith, ...contains];
  }, [commands, slashQuery, slashStart]);

  const appendError = useCallback((message: string) => {
    setErrors((prev) => [...prev, message]);
    console.error("[OnyxMind Error]:", message);
  }, []);

  const closeSlashMenu = useCallback(() => {
    setSlashStart(null);
    setSlashEnd(null);
    setSlashQuery("");
    setSlashSelectedIndex(0);
  }, []);

  const refreshCommands = useCallback(async (): Promise<void> => {
    const available = await plugin.opencodeService.listCommands();
    if (!available) {
      return;
    }
    setCommands(available);
  }, [plugin]);

  const updateSlashState = useCallback(
    (text: string, cursor: number): void => {
      const match = findSlashMatch(text, cursor);
      if (!match) {
        closeSlashMenu();
        return;
      }

      setSlashStart(match.start);
      setSlashEnd(match.end);
      setSlashQuery(match.query);
      setSlashSelectedIndex(0);
    },
    [closeSlashMenu],
  );

  const resetStreamingState = useCallback(() => {
    setStreamText("");
    setStreamThinking("");
    setStreamTools({});
  }, []);

  const refreshSessionState = useCallback(
    async (
      syncRemote: boolean = false,
      loadActiveMessages: boolean = false,
    ): Promise<void> => {
      if (syncRemote) {
        await plugin.sessionManager.refreshSessionsFromService();
      }
      if (loadActiveMessages) {
        await plugin.sessionManager.refreshActiveSessionMessages();
      }
      setSessions(plugin.sessionManager.getAllSessions());
      setActiveSessionId(plugin.sessionManager.getActiveSessionId());
    },
    [plugin],
  );

  const handleSessionCreationError = useCallback(
    (result: CreateSessionResult) => {
      if (result.error === "limit-reached") {
        new Notice(
          `Session limit (${plugin.settings.maxActiveSessions}) reached. ` +
            "Close an existing session or update the limit in settings.",
        );
        return;
      }
      appendError("Failed to create session");
    },
    [appendError, plugin],
  );

  const handleAbort = useCallback(async () => {
    if (isAbortingRef.current) {
      return;
    }
    isAbortingRef.current = true;
    try {
      setIsStreaming(false);
      streamAbortRef.current?.abort();
      streamAbortRef.current = null;

      const sessionId = plugin.sessionManager.getActiveSessionId();
      if (sessionId) {
        const success = await plugin.chatService.abortSession(sessionId);
        if (!success) {
          console.warn(
            "[OnyxMind] Server abort failed for session:",
            sessionId,
          );
        }
      }
    } finally {
      isAbortingRef.current = false;
    }
  }, [plugin]);

  const handleQuestionReply = useCallback(
    async (questionId: string, answers: string[][]): Promise<void> => {
      const success = await plugin.chatService.replyToQuestion(
        questionId,
        answers,
      );
      if (!success) {
        appendError("Failed to submit answer");
      }
    },
    [appendError, plugin],
  );

  const applySlashCommand = useCallback(
    (command: AvailableCommand): void => {
      if (slashStart === null) {
        return;
      }

      const replaceEnd =
        slashEnd ?? inputRef.current?.selectionStart ?? inputText.length;
      const prefix = inputText.slice(0, slashStart);
      const suffix = inputText.slice(replaceEnd);
      const insertion = `/${command.name} `;
      const nextText = `${prefix}${insertion}${suffix}`;
      const nextCursor = prefix.length + insertion.length;

      setInputText(nextText);
      closeSlashMenu();

      requestAnimationFrame(() => {
        const input = inputRef.current;
        if (!input) {
          return;
        }
        input.focus();
        input.setSelectionRange(nextCursor, nextCursor);
      });
    },
    [closeSlashMenu, inputText, slashEnd, slashStart],
  );

  const sendMessage = useCallback(
    async (rawText: string): Promise<void> => {
      const text = rawText.trim();
      if (!text) {
        return;
      }

      const sessionResult = await plugin.chatService.ensureActiveSession();
      const session = sessionResult.session;
      if (!session) {
        handleSessionCreationError(sessionResult);
        return;
      }

      let promptToSend = text;
      let displayContent: string | undefined;
      if (!sentNoteSessionIds.current.has(session.id)) {
        const notePath = currentNotePathRef.current;
        if (notePath && !userRemovedNoteRef.current) {
          promptToSend = `${text}\n\n<current_note>\n${notePath}\n</current_note>`;
          displayContent = text;
          setAttachedNotePath(notePath);
        }
        sentNoteSessionIds.current.add(session.id);
      }

      const userMessage = plugin.chatService.addUserMessage(
        session.id,
        promptToSend,
        displayContent,
      );
      if (!userMessage) {
        appendError("Failed to find the selected session");
        return;
      }

      await refreshSessionState();

      setIsStreaming(true);
      resetStreamingState();

      const controller = new AbortController();
      streamAbortRef.current = controller;

      try {
        await plugin.chatService.streamAssistantResponse(
          session,
          promptToSend,
          {
            onContentDelta: async (delta) => {
              setStreamText((prev) => prev + delta);
            },
            onThinkingDelta: (delta) => {
              setStreamThinking((prev) => prev + delta);
            },
            onToolUse: (chunk) => {
              setStreamTools((prev) => {
                const prevChunk = prev[chunk.partId];
                return {
                  ...prev,
                  [chunk.partId]: prevChunk
                    ? { ...prevChunk, ...chunk }
                    : chunk,
                };
              });
            },
            onError: (error) => {
              const isAbortError =
                controller.signal.aborted ||
                error === ABORT_ERROR_NAME ||
                error.startsWith(`[${ABORT_ERROR_NAME}]`);
              if (!isAbortError) {
                appendError(error);
              }
            },
          },
          { signal: controller.signal },
        );
      } finally {
        if (streamAbortRef.current === controller) {
          streamAbortRef.current = null;
        }
        setIsStreaming(false);

        // sendPrompt may have migrated the session to a remote id; ensure the
        // new id is tracked so the note context is not re-appended on the next
        // message in the same session.
        const currentSessionId = plugin.sessionManager.getActiveSessionId();
        if (currentSessionId) {
          sentNoteSessionIds.current.add(currentSessionId);
        }

        await refreshSessionState();

        // Summarize session after first complete conversation
        if (
          session.messages.length === 1 &&
          !plugin.sessionManager.isSessionSummarized(session.id)
        ) {
          const success = await plugin.sessionManager.summarizeActiveSession();
          if (success) {
            await refreshSessionState();
          }
        }
      }
    },
    [
      appendError,
      handleSessionCreationError,
      plugin,
      refreshSessionState,
      resetStreamingState,
    ],
  );

  const handleSubmit = useCallback(async (): Promise<void> => {
    if (isStreaming) {
      return;
    }
    const text = inputText.trim();
    if (!text) {
      return;
    }
    setInputText("");
    closeSlashMenu();
    await sendMessage(text);
  }, [closeSlashMenu, inputText, isStreaming, sendMessage]);

  const handleNewSession = useCallback(async (): Promise<void> => {
    if (isStreaming) {
      new Notice("Stop current response before creating a new session.");
      return;
    }

    const result = plugin.sessionManager.createSession();
    if (!result.session) {
      handleSessionCreationError(result);
      return;
    }

    userRemovedNoteRef.current = false;
    const newPath = plugin.app.workspace.getActiveFile()?.path ?? null;
    currentNotePathRef.current = newPath;
    setCurrentNotePath(newPath);
    setAttachedNotePath(null);
    setShowNoteChip(newPath !== null);

    await refreshSessionState();
  }, [handleSessionCreationError, isStreaming, plugin, refreshSessionState]);

  const handleRemoveNote = useCallback(() => {
    userRemovedNoteRef.current = true;
    setShowNoteChip(false);
  }, []);

  const handleClearMessages = useCallback((): void => {
    if (isStreaming) {
      new Notice("Stop current response before clearing messages.");
      return;
    }

    const session = plugin.sessionManager.getActiveSession();
    if (!session) {
      return;
    }

    plugin.sessionManager.clearSessionMessages(session.id);
    void refreshSessionState();
  }, [isStreaming, plugin, refreshSessionState]);

  const handleRefresh = useCallback(async (): Promise<void> => {
    if (isStreaming) {
      new Notice("Stop current response before refreshing.");
      return;
    }

    await Promise.all([refreshSessionState(true, true), refreshCommands()]);
  }, [isStreaming, refreshCommands, refreshSessionState]);

  const handleSwitchSession = useCallback(
    (sessionId: string): void => {
      if (isStreaming) {
        new Notice("Stop current response before switching sessions.");
        return;
      }

      void (async () => {
        const success = await plugin.sessionManager.activateSession(sessionId);
        if (!success) {
          return;
        }
        await refreshSessionState(false, false);
      })();
    },
    [isStreaming, plugin, refreshSessionState],
  );

  const handleCloseSession = useCallback(
    async (sessionId: string): Promise<void> => {
      if (isStreaming) {
        new Notice("Stop current response before closing sessions.");
        return;
      }

      const success =
        await plugin.sessionManager.closeSessionLocally(sessionId);
      if (!success) {
        appendError("Failed to close session");
        return;
      }

      await refreshSessionState(false, true);
    },
    [appendError, isStreaming, plugin, refreshSessionState],
  );

  const handleToggleHistory = useCallback(async (): Promise<void> => {
    if (isStreaming) {
      new Notice("Stop current response before viewing history.");
      return;
    }

    if (!historyMenuOpen) {
      // Fetch history when opening
      const history = await plugin.sessionManager.getSessionHistory(20);
      setHistorySessions(history);
      setHistorySelectedIndex(0);
    }

    setHistoryMenuOpen(!historyMenuOpen);
  }, [historyMenuOpen, isStreaming, plugin]);

  const handleLoadHistorySession = useCallback(
    async (sessionId: string): Promise<void> => {
      if (isStreaming) {
        new Notice("Stop current response before loading a session.");
        return;
      }

      const success =
        await plugin.sessionManager.loadSessionFromHistory(sessionId);
      if (!success) {
        appendError("Failed to load session from history");
        return;
      }

      setHistoryMenuOpen(false);
      await refreshSessionState(false, false);
    },
    [appendError, isStreaming, plugin, refreshSessionState],
  );

  const handleCloseHistoryMenu = useCallback(() => {
    setHistoryMenuOpen(false);
  }, []);

  const handleInputChange = useCallback(
    (value: string, cursor: number) => {
      setInputText(value);
      updateSlashState(value, cursor);
    },
    [updateSlashState],
  );

  const handleInputClick = useCallback(
    (value: string, cursor: number) => {
      updateSlashState(value, cursor);
    },
    [updateSlashState],
  );

  const handleInputKeyUp = useCallback(
    (value: string, cursor: number, key: string) => {
      if (key === "ArrowUp" || key === "ArrowDown") {
        return;
      }
      updateSlashState(value, cursor);
    },
    [updateSlashState],
  );

  const handleInputBlur = useCallback(() => {
    closeSlashMenu();
  }, [closeSlashMenu]);

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback(() => {
    setIsComposing(false);
  }, []);

  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (slashMenuOpen) {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          if (filteredCommands.length > 0) {
            setSlashSelectedIndex(
              (prev) => (prev + 1) % filteredCommands.length,
            );
          }
          return;
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          if (filteredCommands.length > 0) {
            setSlashSelectedIndex(
              (prev) =>
                (prev - 1 + filteredCommands.length) % filteredCommands.length,
            );
          }
          return;
        }

        if (
          (event.key === "Enter" || event.key === "Tab") &&
          !event.shiftKey &&
          !isComposing
        ) {
          if (filteredCommands.length > 0) {
            event.preventDefault();
            const selected = filteredCommands[slashSelectedIndex];
            if (selected) {
              applySlashCommand(selected);
            }
            return;
          }
        }

        if (event.key === "Escape") {
          event.preventDefault();
          closeSlashMenu();
          return;
        }
      }

      if (event.key === "Enter" && !event.shiftKey && !isComposing) {
        event.preventDefault();
        void handleSubmit();
      }
    },
    [
      applySlashCommand,
      closeSlashMenu,
      filteredCommands,
      handleSubmit,
      isComposing,
      slashMenuOpen,
      slashSelectedIndex,
    ],
  );

  useEffect(() => {
    let isDisposed = false;

    const init = async (): Promise<void> => {
      await Promise.all([refreshSessionState(true, true), refreshCommands()]);
      if (isDisposed) {
        return;
      }
    };

    void init();

    return () => {
      isDisposed = true;
      const controller = streamAbortRef.current;
      streamAbortRef.current = null;
      if (controller) {
        controller.abort();
        const sessionId = plugin.sessionManager.getActiveSessionId();
        if (sessionId) {
          void plugin.chatService.abortSession(sessionId);
        }
      }
    };
  }, [plugin, refreshCommands, refreshSessionState]);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  useEffect(() => {
    const ref = plugin.app.workspace.on("file-open", (file) => {
      const newPath = file?.path ?? null;
      currentNotePathRef.current = newPath;
      setCurrentNotePath(newPath);
      if (!sentNoteSessionIds.current.has(activeSessionIdRef.current ?? "")) {
        userRemovedNoteRef.current = false;
        setShowNoteChip(newPath !== null);
      }
    });
    return () => {
      plugin.app.workspace.offref(ref);
    };
  }, [plugin]);

  useEffect(() => {
    if (!slashMenuOpen) {
      return;
    }
    if (commands.length > 0) {
      return;
    }
    void refreshCommands();
  }, [commands.length, slashMenuOpen, refreshCommands]);

  useEffect(() => {
    if (!slashMenuOpen) {
      return;
    }
    setSlashSelectedIndex((prev) => {
      if (filteredCommands.length === 0) {
        return 0;
      }
      return Math.min(prev, filteredCommands.length - 1);
    });
  }, [filteredCommands.length, slashMenuOpen]);

  useEffect(() => {
    if (!isStreaming) {
      return;
    }
    closeSlashMenu();
  }, [closeSlashMenu, isStreaming]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }
    input.setCssProps({ height: "auto" });
    input.setCssProps({ height: `${input.scrollHeight}px` });
  }, [inputText]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }, [
    activeSessionId,
    activeMessages.length,
    streamText,
    streamThinking,
    toolChunks.length,
    errors.length,
    isStreaming,
  ]);

  return {
    messagesRef,
    inputRef,
    sessions,
    activeSessionId,
    activeMessages,
    scopeLabel,
    inputText,
    isStreaming,
    streamText,
    streamThinking,
    toolChunks,
    activeQuestion,
    errors,
    slashMenuOpen,
    filteredCommands,
    slashSelectedIndex,
    providerId: plugin.settings.providerId,
    modelId: plugin.settings.modelId,
    historyMenuOpen,
    historySessions,
    historySelectedIndex,
    handleToolbarRefresh: () => void handleRefresh(),
    handleSwitchSession,
    handleCloseSession: (sessionId: string) =>
      void handleCloseSession(sessionId),
    handleNewSession: () => void handleNewSession(),
    handleClearMessages,
    handleToggleHistory: () => void handleToggleHistory(),
    handleLoadHistorySession: (sessionId: string) =>
      void handleLoadHistorySession(sessionId),
    handleCloseHistoryMenu,
    handleSetHistorySelectedIndex: setHistorySelectedIndex,
    handleInputChange,
    handleInputClick,
    handleInputKeyUp,
    handleInputBlur,
    handleCompositionStart,
    handleCompositionEnd,
    handleInputKeyDown,
    handleSetSlashSelectedIndex: setSlashSelectedIndex,
    handleApplySlashCommand: applySlashCommand,
    handleSubmit: () => void handleSubmit(),
    handleAbort: () => void handleAbort(),
    handleQuestionReply,
    sendMessage,
    noteChipPath: showNoteChip ? (attachedNotePath ?? currentNotePath) : null,
    noteChipAttached: showNoteChip && attachedNotePath !== null,
    handleRemoveNote,
  };
}
