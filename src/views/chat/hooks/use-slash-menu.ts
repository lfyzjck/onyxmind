import {
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AvailableCommand } from "../../../services/opencode-service";
import { findSlashMatch } from "../slash";

export interface UseSlashMenuOptions {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  inputText: string;
  setInputText: (text: string) => void;
  isStreaming: boolean;
  isComposing: boolean;
  fetchCommands: () => Promise<AvailableCommand[]>;
}

export interface UseSlashMenuResult {
  slashMenuOpen: boolean;
  filteredCommands: AvailableCommand[];
  slashSelectedIndex: number;
  setSlashSelectedIndex: (index: number) => void;
  updateSlashState: (text: string, cursor: number) => void;
  closeSlashMenu: () => void;
  applySlashCommand: (command: AvailableCommand) => void;
  /** Returns true if the event was consumed and no further handling is needed. */
  handleSlashKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => boolean;
}

export function useSlashMenu({
  inputRef,
  inputText,
  setInputText,
  isStreaming,
  isComposing,
  fetchCommands,
}: UseSlashMenuOptions): UseSlashMenuResult {
  const [commands, setCommands] = useState<AvailableCommand[]>([]);
  const [slashStart, setSlashStart] = useState<number | null>(null);
  const [slashEnd, setSlashEnd] = useState<number | null>(null);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);

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

  const closeSlashMenu = useCallback(() => {
    setSlashStart(null);
    setSlashEnd(null);
    setSlashQuery("");
    setSlashSelectedIndex(0);
  }, []);

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
    [closeSlashMenu, inputRef, inputText, slashEnd, slashStart, setInputText],
  );

  const handleSlashKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>): boolean => {
      if (!slashMenuOpen) {
        return false;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (filteredCommands.length > 0) {
          setSlashSelectedIndex(
            (prev) => (prev + 1) % filteredCommands.length,
          );
        }
        return true;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (filteredCommands.length > 0) {
          setSlashSelectedIndex(
            (prev) =>
              (prev - 1 + filteredCommands.length) % filteredCommands.length,
          );
        }
        return true;
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
          return true;
        }
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeSlashMenu();
        return true;
      }

      return false;
    },
    [
      applySlashCommand,
      closeSlashMenu,
      filteredCommands,
      isComposing,
      slashMenuOpen,
      slashSelectedIndex,
    ],
  );

  // Lazy-load commands when menu first opens
  useEffect(() => {
    if (!slashMenuOpen) {
      return;
    }
    if (commands.length > 0) {
      return;
    }
    void fetchCommands().then((available) => {
      setCommands(available);
    });
  }, [commands.length, slashMenuOpen, fetchCommands]);

  // Clamp selectedIndex when filteredCommands shrinks
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

  // Close menu when streaming starts
  useEffect(() => {
    if (!isStreaming) {
      return;
    }
    closeSlashMenu();
  }, [closeSlashMenu, isStreaming]);

  return {
    slashMenuOpen,
    filteredCommands,
    slashSelectedIndex,
    setSlashSelectedIndex,
    updateSlashState,
    closeSlashMenu,
    applySlashCommand,
    handleSlashKeyDown,
  };
}
