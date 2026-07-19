import type { Api, Model } from "@earendil-works/pi-ai";
import { Box, Text } from "ink";
import type { UserQuestion } from "../ai/questions";
import { initialRequest } from "../ai/system-prompt";
import { Markdown } from "../ui/markdown";
import { Hint, InputField, Selector, Shell, Spinner } from "../ui/primitives";
import { theme } from "../ui/theme";

export type SessionScreenProps = {
  model: Model<Api>;
  reply: string;
  status: "running" | "done" | "error";
  error: string;
  activities: string[];
  pendingQuestion?: UserQuestion;
  questionValue: string;
  questionIndex: number;
  onQuestionChange: (value: string) => void;
};

export function SessionScreen({
  model,
  reply,
  status,
  error,
  activities,
  pendingQuestion,
  questionValue,
  questionIndex,
  onQuestionChange,
}: SessionScreenProps) {
  return (
    <Shell stage="report">
      <Text color={theme.muted}>{model.name} · local session report</Text>
      <Box marginTop={2} flexDirection="column">
        <Text bold color={theme.heading}>
          Request
        </Text>
        <Text color={theme.muted}>{initialRequest}</Text>
        {activities.length > 0 ? (
          <Box marginTop={2} flexDirection="column">
            {activities.map((activity, index) => (
              <Text color={theme.muted} key={`${activity}-${index}`}>
                <Text color={theme.success}>✓</Text> {activity}
              </Text>
            ))}
          </Box>
        ) : null}
        <Box marginTop={2} flexDirection="column">
          <Text bold color={theme.heading}>
            Report
          </Text>
          {status === "running" && !reply ? (
            <Spinner label="Reviewing your sessions…" />
          ) : (
            <Markdown>{reply}</Markdown>
          )}
        </Box>
      </Box>
      {pendingQuestion ? (
        <Box marginTop={2} flexDirection="column">
          <Text bold color={theme.heading}>
            One thing before I continue
          </Text>
          <Box marginTop={1}>
            <Text>{pendingQuestion.question}</Text>
          </Box>
          {pendingQuestion.kind === "text" ? (
            <InputField
              value={questionValue}
              onChange={onQuestionChange}
              placeholder="Type your answer"
            />
          ) : (
            <Selector
              options={pendingQuestion.options.map((name) => ({ name }))}
              selectedIndex={questionIndex}
              nameWidth={20}
            />
          )}
          <Hint>
            {pendingQuestion.kind === "text"
              ? "enter submit"
              : pendingQuestion.kind === "confirm"
                ? "↑↓ select · y yes · n no · enter confirm"
                : "↑↓ select · enter confirm"}
          </Hint>
        </Box>
      ) : null}
      {error ? <Text color={theme.danger}>{error}</Text> : null}
      {status !== "running" ? <Hint>enter finish · r retry · esc models</Hint> : null}
    </Shell>
  );
}
