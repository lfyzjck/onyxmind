import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { StreamChunkQuestion } from "../../../../services/opencode-service";
import { ObsidianIcon } from "../tools/shared";

interface QuestionComposerProps {
  question: StreamChunkQuestion;
  onReply: (questionId: string, answers: string[][]) => Promise<void>;
}

export function QuestionComposer({ question, onReply }: QuestionComposerProps) {
  const questions = question.questions;
  const questionId = question.questionId;
  const containerRef = useRef<HTMLDivElement>(null);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // selections[qIdx] = selected labels for that question
  const [selections, setSelections] = useState<string[][]>(() =>
    questions.map(() => []),
  );
  // cursor[qIdx] = highlighted option index
  const [cursors, setCursors] = useState<number[]>(() =>
    questions.map(() => 0),
  );

  const currentQ = questions[questionIndex];
  const currentOptions = currentQ?.options ?? [];
  const isMulti = currentQ?.multiSelect === true;
  const currentCursor = cursors[questionIndex] ?? 0;
  const currentSelection = selections[questionIndex] ?? [];

  // Focus the container on mount for immediate keyboard interaction
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // For single-select: auto-select the first option when question changes
  useEffect(() => {
    if (
      !isMulti &&
      currentOptions.length > 0 &&
      currentSelection.length === 0
    ) {
      const label = currentOptions[0]?.label ?? "";
      setSelections((prev) => {
        const next = [...prev];
        next[questionIndex] = [label];
        return next;
      });
    }
    // Only run when question index changes
  }, [questionIndex]);

  const moveCursor = useCallback(
    (delta: -1 | 1) => {
      const len = currentOptions.length;
      if (len === 0) return;
      const next = Math.max(0, Math.min(len - 1, currentCursor + delta));
      setCursors((prev) => {
        const arr = [...prev];
        arr[questionIndex] = next;
        return arr;
      });
      // Single-select: cursor movement also changes selection
      if (!isMulti) {
        const opt = currentOptions[next];
        if (opt) {
          setSelections((prev) => {
            const arr = [...prev];
            arr[questionIndex] = [opt.label];
            return arr;
          });
        }
      }
    },
    [currentCursor, currentOptions, isMulti, questionIndex],
  );

  const toggleAtCursor = useCallback(() => {
    const opt = currentOptions[currentCursor];
    if (!opt) return;
    setSelections((prev) => {
      const arr = [...prev];
      const sel = arr[questionIndex] ?? [];
      arr[questionIndex] = sel.includes(opt.label)
        ? sel.filter((l) => l !== opt.label)
        : [...sel, opt.label];
      return arr;
    });
  }, [currentCursor, currentOptions, questionIndex]);

  const advanceOrSubmit = useCallback(async () => {
    if ((selections[questionIndex] ?? []).length === 0) return;
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((i) => i + 1);
      return;
    }
    if (submitting || !questionId) return;
    setSubmitting(true);
    try {
      await onReply(questionId, selections);
    } finally {
      setSubmitting(false);
    }
  }, [
    onReply,
    questionId,
    questionIndex,
    questions.length,
    selections,
    submitting,
  ]);

  const handleOptionClick = useCallback(
    (i: number, label: string) => {
      setCursors((prev) => {
        const arr = [...prev];
        arr[questionIndex] = i;
        return arr;
      });
      setSelections((prev) => {
        const arr = [...prev];
        const sel = arr[questionIndex] ?? [];
        if (isMulti) {
          arr[questionIndex] = sel.includes(label)
            ? sel.filter((l) => l !== label)
            : [...sel, label];
        } else {
          arr[questionIndex] = [label];
        }
        return arr;
      });
    },
    [isMulti, questionIndex],
  );

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        moveCursor(-1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        moveCursor(1);
      } else if (e.key === " " && isMulti) {
        e.preventDefault();
        toggleAtCursor();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void advanceOrSubmit();
      }
    },
    [advanceOrSubmit, isMulti, moveCursor, toggleAtCursor],
  );

  if (!currentQ) return null;

  const canAdvance = (selections[questionIndex] ?? []).length > 0;
  const isLast = questionIndex === questions.length - 1;

  return (
    <div
      className="onyxmind-qc"
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-label="Question from assistant"
    >
      {/* Header: question text + progress */}
      <div className="onyxmind-qc-header">
        <ObsidianIcon icon="help-circle" className="onyxmind-qc-icon" />
        <span className="onyxmind-qc-question">{currentQ.question}</span>
        {questions.length > 1 && (
          <span className="onyxmind-qc-progress">
            {questionIndex + 1}/{questions.length}
          </span>
        )}
      </div>

      {/* Options list */}
      <div
        className="onyxmind-qc-options"
        role={isMulti ? "group" : "radiogroup"}
        aria-label={currentQ.question}
      >
        {currentOptions.map((opt, i) => {
          const isSelected = currentSelection.includes(opt.label);
          const isCursor = currentCursor === i;
          return (
            <button
              key={i}
              type="button"
              role={isMulti ? "checkbox" : "radio"}
              aria-checked={isSelected}
              className={[
                "onyxmind-qc-option",
                isSelected ? "is-selected" : "",
                isCursor ? "is-cursor" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handleOptionClick(i, opt.label)}
            >
              <ObsidianIcon
                icon={
                  isMulti
                    ? isSelected
                      ? "check-square"
                      : "square"
                    : isSelected
                      ? "circle-dot"
                      : "circle"
                }
                className="onyxmind-qc-opt-icon"
              />
              <span className="onyxmind-qc-opt-label">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer: keyboard hints + action button */}
      <div className="onyxmind-qc-footer">
        <span className="onyxmind-qc-hint">↑↓ Navigate</span>
        {isMulti && <span className="onyxmind-qc-hint">Space Toggle</span>}
        <span className="onyxmind-qc-hint">
          Enter {isLast ? "Confirm" : "Next"}
        </span>
        <button
          className="onyxmind-qc-submit"
          disabled={!canAdvance || submitting}
          onClick={() => void advanceOrSubmit()}
        >
          <ObsidianIcon
            icon={submitting ? "loader" : isLast ? "send" : "arrow-right"}
            className="onyxmind-btn-icon"
          />
          {isLast ? "Confirm" : "Next"}
        </button>
      </div>
    </div>
  );
}
