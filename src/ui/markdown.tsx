import { Text } from "ink";
import { marked, type MarkedExtension } from "marked";
import { markedTerminal } from "marked-terminal";

// The v7 runtime returns a Marked extension, while its DefinitelyTyped package
// still declares the pre-v7 TerminalRenderer return type.
const terminalMarkdown = markedTerminal({
  reflowText: true,
  showSectionPrefix: false,
}) as unknown as MarkedExtension;

marked.use(terminalMarkdown);

export function Markdown({ children }: { children: string }) {
  return <Text>{marked.parse(children, { async: false }).trim()}</Text>;
}
