import { useEffect, useState } from "react";
import { Box, Text, useStdout } from "ink";
import { brandFrames, spinnerFrames, theme } from "./theme.js";

export type SelectOption = {
  name: string;
  detail?: string;
};

export function Shell({
  children,
  stage,
  animateBrand = false,
}: {
  children: React.ReactNode;
  stage: string;
  animateBrand?: boolean;
}) {
  const { stdout } = useStdout();
  const width = Math.min(152, Math.max(64, (stdout.columns ?? 100) - 2));
  const [brandFrame, setBrandFrame] = useState(brandFrames.length - 1);

  useEffect(() => {
    if (!animateBrand) {
      setBrandFrame(brandFrames.length - 1);
      return;
    }
    let frame = 0;
    setBrandFrame(frame);
    const timer = setInterval(() => {
      frame += 1;
      setBrandFrame(frame);
      if (frame >= brandFrames.length - 1) clearInterval(timer);
    }, 120);
    return () => clearInterval(timer);
  }, [animateBrand]);

  return (
    <Box width={width} minHeight={32} flexDirection="column" paddingX={6} paddingY={4}>
      <Box>
        <Box width={3}>
          <Text color={theme.accent}>{brandFrames[brandFrame]}</Text>
        </Box>
        <Text bold color={theme.accentBright}>
          FARPOINT
        </Text>
        <Text color={theme.muted}> / {stage}</Text>
      </Box>
      <Box marginTop={4} flexDirection="column" flexGrow={1}>
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
    <Box flexDirection="column" marginTop={3}>
      {options.map((option, index) => {
        const selected = index === selectedIndex;
        return (
          <Box key={`${option.name}-${index}`}>
            <Box width={4}>
              <Text color={selected ? theme.accent : theme.muted}>{selected ? "◆" : "·"}</Text>
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
}: {
  value: string;
  placeholder: string;
  icon?: string;
  masked?: boolean;
  maxWidth?: number;
}) {
  const { stdout } = useStdout();
  const width = Math.min(maxWidth, Math.max(46, (stdout.columns ?? 100) - 16));
  const displayValue = masked && value ? "•".repeat(Math.min(value.length, 48)) : value;

  return (
    <Box marginTop={2} width={width} borderStyle="round" borderColor={theme.accent} paddingX={2}>
      <Box width={3}>
        <Text color={theme.accent}>{icon}</Text>
      </Box>
      <Text color={displayValue ? undefined : theme.muted}>{displayValue || placeholder}</Text>
      {displayValue ? <Text color={theme.accent}>█</Text> : null}
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
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setFrame((value) => value + 1), 80);
    return () => clearInterval(timer);
  }, []);

  return (
    <Text>
      <Text color={theme.accent}>{spinnerFrames[frame % spinnerFrames.length]}</Text> {label}
    </Text>
  );
}
