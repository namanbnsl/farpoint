import { Fragment, type ReactNode } from "react";
import { Box, Text } from "ink";
import Link from "ink-link";
import { marked, type Token, type Tokens } from "marked";
import { theme } from "./theme.js";

function Inline({ tokens }: { tokens: Token[] }) {
  return (
    <>
      {tokens.map((token, index) => {
        const key = `${token.type}-${index}`;
        switch (token.type) {
          case "strong":
            return (
              <Text key={key} bold color={theme.heading}>
                <Inline tokens={token.tokens ?? []} />
              </Text>
            );
          case "em":
            return (
              <Text key={key} italic>
                <Inline tokens={token.tokens ?? []} />
              </Text>
            );
          case "codespan":
            return (
              <Text key={key} color={theme.code} backgroundColor={theme.codeBackground}>
                {" "}
                {token.text}{" "}
              </Text>
            );
          case "del":
            return (
              <Text key={key} strikethrough color={theme.muted}>
                <Inline tokens={token.tokens ?? []} />
              </Text>
            );
          case "link":
            return (
              <Link key={key} url={token.href} fallback={false}>
                <Text color={theme.accent} underline>
                  <Inline tokens={token.tokens ?? []} />
                </Text>
              </Link>
            );
          case "br":
            return <Fragment key={key}>{"\n"}</Fragment>;
          case "escape":
          case "text":
            return <Fragment key={key}>{token.text}</Fragment>;
          default:
            return <Fragment key={key}>{"raw" in token ? token.raw : ""}</Fragment>;
        }
      })}
    </>
  );
}
function tokenText(token: Token): ReactNode {
  if ("tokens" in token && Array.isArray(token.tokens))
    return <Inline tokens={token.tokens ?? []} />;
  return "text" in token ? token.text : token.raw;
}
function Blocks({ tokens }: { tokens: Token[] }) {
  return (
    <Box flexDirection="column">
      {tokens.map((token, index) => {
        const key = `${token.type}-${index}`;
        switch (token.type) {
          case "space":
            return null;
          case "heading": {
            const prefix = token.depth === 1 ? "◆" : token.depth === 2 ? "◇" : "·";
            return (
              <Box key={key} marginTop={index === 0 ? 0 : 1}>
                <Text bold color={token.depth === 1 ? theme.accentBright : theme.heading}>
                  <Text color={theme.accent}>{prefix} </Text>
                  <Inline tokens={token.tokens ?? []} />
                </Text>
              </Box>
            );
          }
          case "paragraph":
            return (
              <Box key={key} marginBottom={1}>
                <Text color={theme.body}>
                  <Inline tokens={token.tokens ?? []} />
                </Text>
              </Box>
            );
          case "text":
            return (
              <Text key={key} color={theme.body}>
                {tokenText(token)}
              </Text>
            );
          case "blockquote":
            return (
              <Box key={key} marginBottom={1}>
                <Text color={theme.border}>│ </Text>
                <Text color={theme.muted} italic>
                  {tokenText(token)}
                </Text>
              </Box>
            );
          case "code":
            return (
              <Box
                key={key}
                flexDirection="column"
                marginBottom={1}
                borderStyle="round"
                borderColor={theme.borderSubtle}
                paddingX={1}
              >
                {token.lang ? <Text color={theme.faint}>{token.lang}</Text> : null}
                <Text color={theme.code}>{token.text}</Text>
              </Box>
            );
          case "hr":
            return (
              <Text key={key} color={theme.borderSubtle}>
                {"─".repeat(48)}
              </Text>
            );
          case "list":
            return (
              <Box key={key} flexDirection="column" marginBottom={1}>
                {(token as Tokens.List).items.map((item: Tokens.ListItem, itemIndex: number) => (
                  <Box key={itemIndex}>
                    <Box width={4}>
                      <Text color={theme.accent}>
                        {token.ordered ? `${(token.start || 1) + itemIndex}.` : "•"}
                      </Text>
                    </Box>
                    <Box flexDirection="column" flexShrink={1}>
                      <Blocks tokens={item.tokens} />
                    </Box>
                  </Box>
                ))}
              </Box>
            );
          default:
            return "tokens" in token && Array.isArray(token.tokens) ? (
              <Blocks key={key} tokens={token.tokens ?? []} />
            ) : null;
        }
      })}
    </Box>
  );
}
export function Markdown({ children }: { children: string }) {
  return <Blocks tokens={marked.lexer(children)} />;
}
