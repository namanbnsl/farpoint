import { Box, Text, useStdout } from "ink";
import InkSpinner from "ink-spinner";
import TextInput from "ink-text-input";
import { theme } from "./theme.js";

export type SelectOption = {
  name: string;
  detail?: string;
};

export function Shell({
  children,
  stage,
  showHeader = true,
}: {
  children: React.ReactNode;
  stage: string;
  showHeader?: boolean;
}) {
  const { stdout } = useStdout();
  const width = Math.min(104, Math.max(48, (stdout.columns ?? 100) - 2));
  return (
    <Box width={width} minHeight={28} flexDirection="column" paddingX={4} paddingY={3}>
      {showHeader ? (
        <Box>
          <Box width={3}>
            <Text color={theme.accent}>●</Text>
          </Box>
          <Text bold color={theme.accentBright}>
            FARPOINT
          </Text>
          <Text color={theme.muted}> {stage}</Text>
        </Box>
      ) : null}
      <Box marginTop={showHeader ? 4 : 0} flexDirection="column" flexGrow={1}>
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
  return (
    <Box marginTop={2} width={width} borderStyle="round" borderColor={theme.accent} paddingX={2}>
      <Box width={3}>
        <Text color={theme.accent}>{icon}</Text>
      </Box>
      <TextInput
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        mask={masked ? "•" : undefined}
        highlightPastedText
      />
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
