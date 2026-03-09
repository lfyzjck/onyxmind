import { createContext, useContext } from "react";

type QuestionReplyFn = (
  questionId: string,
  answers: string[][],
) => Promise<void>;

const noop: QuestionReplyFn = async () => {};

export const QuestionReplyContext = createContext<QuestionReplyFn>(noop);

export function useQuestionReply(): QuestionReplyFn {
  return useContext(QuestionReplyContext);
}
