import type { Api, Model } from "@earendil-works/pi-ai";
import { Box, Text } from "ink";
import { Hint, Shell, Spinner } from "../ui/primitives";
import { theme } from "../ui/theme";

export type SessionScreenProps = {
  model: Model<Api>;
  reply: string;
  status: "running" | "done" | "error";
  error: string;
  toolCalls: string[];
};

export function SessionScreen({ model, reply, status, error, toolCalls }: SessionScreenProps) {
  return (
    <Shell stage="session">
      <Text color={theme.muted}>
        {model.name} · {model.provider}
      </Text>
      <Box marginTop={1} flexDirection="column">
        <Text>
          <Text color={theme.accent}>you </Text>
          Run the sample tool.
        </Text>
        {toolCalls.length > 0 ? (
          <Box marginTop={1} flexDirection="column">
            {toolCalls.map((toolName, index) => (
              <Text color={theme.muted} key={`${toolName}-${index}`}>
                ↳ called {toolName}
              </Text>
            ))}
          </Box>
        ) : null}
        <Box marginTop={1}>
          <Text color={theme.success}>farpoint </Text>
          {status === "running" && !reply ? <Spinner label="Thinking…" /> : <Text>{reply}</Text>}
        </Box>
      </Box>
      {error ? <Text color={theme.danger}>{error}</Text> : null}
      {status !== "running" ? <Hint>enter finish · r retry · esc models</Hint> : null}
    </Shell>
  );
}
