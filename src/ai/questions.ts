type UserQuestionKind = "confirm" | "select" | "text";

export type UserQuestion = {
  kind: UserQuestionKind;
  question: string;
  options: string[];
  purpose?: "source_install";
};

export type RequestUserQuestion = (question: UserQuestion) => Promise<string>;
