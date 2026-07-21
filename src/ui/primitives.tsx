import { Box, Text, useInput, useStdout } from "ink";
import BigText from "ink-big-text";
import Gradient from "ink-gradient";
import InkSpinner from "ink-spinner";
import { updateTextInput } from "./text-input.js";
import { theme } from "./theme.js";

export type SelectOption = { name: string; detail?: string };

export function Shell({ children }: { children: React.ReactNode; stage: string }) {
  const { stdout } = useStdout();
  const columns = stdout.columns ?? 100;
  const width = Math.min(96, Math.max(32, columns - 2));
  const paddingX = columns < 64 ? 1 : 3;
  return (
    <Box width={width} minHeight={24} flexDirection="column" paddingX={paddingX} paddingY={2}>
      <Gradient colors={[theme.accent, theme.code]}>
        <BigText text="FARPOINT" font="tiny" />
      </Gradient>
      <Box marginTop={2} flexDirection="column" flexGrow={1}>
        {children}
      </Box>
    </Box>
  );
}
export function ScreenHeading({ children }: { children: React.ReactNode }) {
  return (
    <Text bold color={theme.heading}>
      {children}
    </Text>
  );
}
export function Selector({
  options,
  selectedIndex,
  nameWidth = 38,
}: {
  options: SelectOption[];
  selectedIndex: number;
  nameWidth?: number;
}) {
  return (
    <Box flexDirection="column" marginTop={1}>
      {options.map((option, index) => {
        const selected = index === selectedIndex;
        return (
          <Box key={`${option.name}-${index}`}>
            <Box width={2}>
              <Text bold color={selected ? theme.accent : theme.faint}>
                {selected ? "›" : " "}
              </Text>
            </Box>
            <Box width={nameWidth}>
              <Text bold={selected} color={selected ? theme.heading : theme.body}>
                {option.name}
              </Text>
            </Box>
            {option.detail ? (
              <Text color={selected ? theme.muted : theme.faint}>{option.detail}</Text>
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}
export function InputField({
  value,
  placeholder,
  icon = "›",
  masked = false,
  maxWidth = 72,
  onChange,
}: {
  value: string;
  placeholder: string;
  icon?: string;
  masked?: boolean;
  maxWidth?: number;
  onChange: (value: string) => void;
}) {
  const { stdout } = useStdout();
  const width = Math.min(maxWidth, Math.max(28, (stdout.columns ?? 100) - 12));
  useInput((input, key) => {
    const nextValue = updateTextInput(value, input, key);
    if (nextValue !== undefined && nextValue !== value) onChange(nextValue);
  });
  const displayValue = masked ? "•".repeat(value.length) : value;
  return (
    <Box marginTop={1} width={width} borderStyle="round" borderColor={theme.border} paddingX={1}>
      <Box width={2}>
        <Text color={theme.accent}>{icon}</Text>
      </Box>
      {displayValue ? (
        <Text color={theme.body}>
          {displayValue}
          <Text inverse> </Text>
        </Text>
      ) : (
        <Text color={theme.muted}>
          {placeholder}
          <Text inverse> </Text>
        </Text>
      )}
    </Box>
  );
}
export function Hint({ children }: { children: React.ReactNode }) {
  return (
    <Box marginTop={2}>
      <Text color={theme.faint}>{children}</Text>
    </Box>
  );
}
export function Spinner({ label }: { label: string }) {
  return (
    <Text>
      <Text color={theme.accent}>
        <InkSpinner type="dots" />
      </Text>{" "}
      <Text color={theme.body}>{label}</Text>
    </Text>
  );
}
