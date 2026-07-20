import { Box, Text, useInput, useStdout } from "ink";
import BigText from "ink-big-text";
import Gradient from "ink-gradient";
import InkSpinner from "ink-spinner";
import { updateTextInput } from "./text-input.js";
import { theme } from "./theme.js";

export type SelectOption = {
  name: string;
  detail?: string;
};

export function Shell({ children, stage }: { children: React.ReactNode; stage: string }) {
  const { stdout } = useStdout();
  const width = Math.min(104, Math.max(48, (stdout.columns ?? 100) - 2));
  return (
    <Box width={width} minHeight={28} flexDirection="column" paddingX={4} paddingY={3}>
      <Gradient colors={[theme.accent, theme.code]}>
        <BigText text="FARPOINT" font="tiny" />
      </Gradient>
      <Box marginTop={1}>
        <Text color={theme.accent}>●</Text>
        <Text color={theme.muted}> {stage}</Text>
      </Box>
      <Box marginTop={3} flexDirection="column" flexGrow={1}>
        {children}
      </Box>
    </Box>
  );
}

export function ScreenHeading({ children }: { children: React.ReactNode }) {
  return (
    <Text bold color={theme.accentBright}>
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
    <Box flexDirection="column" marginTop={2}>
      {options.map((option, index) => {
        const selected = index === selectedIndex;
        return (
          <Box key={`${option.name}-${index}`}>
            <Box width={3}>
              <Text color={selected ? theme.accent : theme.muted}>{selected ? "›" : " "}</Text>
            </Box>
            <Box width={nameWidth}>
              <Text
                bold={selected}
                color={selected ? theme.accentBright : undefined}
                backgroundColor={selected ? theme.accentDeep : undefined}
              >
                {option.name}
              </Text>
            </Box>
            {option.detail ? <Text color={theme.muted}>{option.detail}</Text> : null}
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
  const width = Math.min(maxWidth, Math.max(46, (stdout.columns ?? 100) - 16));
  useInput((input, key) => {
    const nextValue = updateTextInput(value, input, key);
    if (nextValue !== undefined && nextValue !== value) onChange(nextValue);
  });
  const displayValue = masked ? "•".repeat(value.length) : value;
  return (
    <Box marginTop={2} width={width} borderStyle="round" borderColor={theme.accent} paddingX={2}>
      <Box width={3}>
        <Text color={theme.accent}>{icon}</Text>
      </Box>
      {displayValue ? (
        <Text>
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
    <Box marginTop={3}>
      <Text color={theme.muted}>{children}</Text>
    </Box>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <Text>
      <Text color={theme.accent}>
        <InkSpinner type="dots" />
      </Text>{" "}
      {label}
    </Text>
  );
}
