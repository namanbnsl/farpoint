import type { AgentTool } from "@earendil-works/pi-agent-core";
import { Type } from "@earendil-works/pi-ai";

const parameters = Type.Object({
  message: Type.String({
    description: "A short message to echo.",
  }),
});

export const sampleTool: AgentTool<typeof parameters> = {
  name: "sample_tool",
  label: "Sample tool",
  description: "A sample tool that echoes a message.",
  parameters,
  execute: async (_toolCallId, { message }) => ({
    content: [{ type: "text", text: `Sample tool received: ${message}` }],
    details: { message },
  }),
};
