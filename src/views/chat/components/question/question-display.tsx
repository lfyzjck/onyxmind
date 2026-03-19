import { ObsidianIcon, ToolHeader, ToolWrapper } from "../tools/shared";
import type { ToolItemProps } from "../tools/shared";
import type { QuestionInfo } from "../../../../services/opencode-service";

export function QuestionDisplay({ tool }: ToolItemProps) {
  const rawQuestions = tool.input?.["questions"];
  const questions: QuestionInfo[] = Array.isArray(rawQuestions)
    ? (rawQuestions as QuestionInfo[])
    : [];

  const firstQ = questions[0];
  // When status is still "running" in historical view, the session was interrupted.
  const isAbandoned = tool.status === "running";
  const isAnswered = tool.status === "completed";

  return (
    <ToolWrapper tool={tool}>
      <ToolHeader
        tool={tool}
        icon="help-circle"
        label={firstQ?.header ?? "question"}
      />

      {/* Abandoned: running but no questionId (session interrupted before streaming) */}
      {isAbandoned && questions.length > 0 && (
        <div className="onyxmind-question-readonly">
          {questions.map((q, qi) => (
            <div key={qi} className="onyxmind-question-readonly-item">
              <div className="onyxmind-question-readonly-q">{q.question}</div>
              <div className="onyxmind-question-readonly-options">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="onyxmind-question-readonly-option">
                    <ObsidianIcon
                      icon={q.multiSelect ? "square" : "circle"}
                      className="onyxmind-question-readonly-icon"
                    />
                    <div className="onyxmind-question-readonly-text">
                      <span className="onyxmind-question-readonly-label">
                        {opt.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="onyxmind-question-readonly-notice">
            <ObsidianIcon
              icon="circle-slash"
              className="onyxmind-question-readonly-notice-icon"
            />
            <span>Session interrupted, question left unanswered</span>
          </div>
        </div>
      )}

      {/* Answered: show selected options */}
      {isAnswered && questions.length > 0 && (
        <div className="onyxmind-question-answered">
          {questions.map((q, qi) => (
            <div key={qi} className="onyxmind-question-answered-item">
              <div className="onyxmind-question-answered-q">
                <ObsidianIcon
                  icon="message-circle-question"
                  className="onyxmind-question-answered-q-icon"
                />
                <span>{q.question}</span>
              </div>
              <div className="onyxmind-question-answered-options">
                {q.options
                  .filter((opt) => {
                    if (!tool.output) return false;
                    return tool.output.includes(opt.label);
                  })
                  .map((opt, oi) => (
                    <div key={oi} className="onyxmind-question-answered-option">
                      <ObsidianIcon
                        icon="check"
                        className="onyxmind-question-answered-check"
                      />
                      <div className="onyxmind-question-answered-option-content">
                        <span className="onyxmind-question-answered-label">
                          {opt.label}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </ToolWrapper>
  );
}
