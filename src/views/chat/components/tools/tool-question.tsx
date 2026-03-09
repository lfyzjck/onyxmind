import { ObsidianIcon, ToolHeader, ToolWrapper } from "./shared";
import type { ToolItemProps } from "./shared";

interface QuestionOption {
  label: string;
}

interface QuestionInfo {
  question: string;
  header?: string;
  options: QuestionOption[];
  multiSelect?: boolean;
}

export function ToolQuestion({ tool }: ToolItemProps) {
  const rawQuestions = tool.input?.["questions"];
  const questions: QuestionInfo[] = Array.isArray(rawQuestions)
    ? (rawQuestions as QuestionInfo[])
    : [];

  const firstQ = questions[0];
  // Interactive state (running + questionId) is handled by QuestionComposer in the
  // composer area — this component only renders historical/abandoned/answered states.
  const isAbandoned = tool.status === "running" && !tool.questionId;
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
            <span>会话中断，问题未被回答</span>
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
