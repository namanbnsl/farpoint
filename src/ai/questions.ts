import type { AgentTool } from "@earendil-works/pi-agent-core";
import { Type } from "@earendil-works/pi-ai";

export type UserQuestionKind = "confirm" | "select" | "text";

export type UserQuestion = {
  kind: UserQuestionKind;
  question: string;
  options: string[];
  purpose?: "source_install";
};

export type RequestUserQuestion = (question: UserQuestion) => Promise<string>;

const parameters = Type.Object({
  kind: Type.Union([Type.Literal("confirm"), Type.Literal("select"), Type.Literal("text")], {
    description:
      "Use confirm for yes/no questions, select for a fixed set of answers, and text for a free-form answer.",
  }),
  question: Type.String({
    description: "A concise question shown directly to the user.",
  }),
  options: Type.Optional(
    Type.Array(Type.String(), {
      description:
        "Answer choices for select questions. Confirm questions automatically use Yes and No.",
      maxItems: 8,
    }),
  ),
  purpose: Type.Optional(
    Type.Literal("source_install", {
      description: "Set this only when asking permission to prepare the local data source.",
    }),
  ),
});

export type UserQuestionState = {
  hasSourceInstallConsent: () => boolean;
};

function isAffirmative(answer: string): boolean {
  return ["yes", "y", "true"].includes(answer.trim().toLowerCase());
}

export function createAskUserTool(requestQuestion: RequestUserQuestion): {
  tool: AgentTool<typeof parameters>;
  state: UserQuestionState;
} {
  let sourceInstallConsent = false;

  return {
    state: {
      hasSourceInstallConsent: () => sourceInstallConsent,
    },
    tool: {
      name: "ask_user",
      label: "Ask user",
      description:
        "Ask the user an objective confirmation/selection question or a subjective free-form question. Always use this before an action that requires explicit user approval.",
      parameters,
      execute: async (_toolCallId, { kind, question, options, purpose }) => {
        const normalizedOptions =
          kind === "confirm" ? ["Yes", "No"] : kind === "select" ? (options ?? []) : [];

        if (kind === "select" && normalizedOptions.length < 2) {
          throw new Error("A select question requires at least two options.");
        }

        const answer = await requestQuestion({
          kind,
          question,
          options: normalizedOptions,
          purpose,
        });

        if (purpose === "source_install") {
          sourceInstallConsent = kind === "confirm" && isAffirmative(answer);
        }

        return {
          content: [{ type: "text", text: `The user answered: ${answer}` }],
          details: { answer, kind, purpose },
        };
      },
    },
  };
}
