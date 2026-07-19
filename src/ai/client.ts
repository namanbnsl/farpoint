import { Agent } from "@earendil-works/pi-agent-core";
import type { Api, AuthInteraction, Model } from "@earendil-works/pi-ai";
import { builtinModels } from "@earendil-works/pi-ai/providers/all";
import { createCredentialStore } from "../auth/credential-store";
import { createAskUserTool, type RequestUserQuestion } from "./questions";
import { initialRequest, systemPrompt } from "./system-prompt";
import { createAnalysisTools, getToolLabel } from "./tools";

export const credentialStore = createCredentialStore();
export const modelRegistry = builtinModels({ credentials: credentialStore });

export type OAuthInteractionHandlers = {
  signal: AbortSignal;
  requestInput: (message: string) => Promise<string>;
  showAuthUrl: (url: string, status?: string) => void;
  showStatus: (message: string) => void;
};

export function createOAuthInteraction({
  signal,
  requestInput,
  showAuthUrl,
  showStatus,
}: OAuthInteractionHandlers): AuthInteraction {
  return {
    signal,
    prompt: (prompt) => {
      if (prompt.type !== "select") return requestInput(prompt.message);
      const firstOption = prompt.options[0];
      if (!firstOption) {
        return Promise.reject(new Error("No sign-in method is available."));
      }
      return Promise.resolve(firstOption.id);
    },
    notify: (event) => {
      if (event.type === "auth_url") {
        showAuthUrl(event.url, event.instructions);
        return;
      }
      if (event.type === "device_code") {
        showAuthUrl(event.verificationUri, `Enter code ${event.userCode} to continue.`);
        return;
      }
      if (event.type === "progress" || event.type === "info") {
        showStatus(event.message);
        if (event.type === "info" && event.links?.[0]) {
          showAuthUrl(event.links[0].url, event.message);
        }
      }
    },
  };
}

export async function runSession(
  model: Model<Api>,
  onText: (delta: string) => void,
  onActivity: (label: string) => void,
  requestQuestion: RequestUserQuestion,
): Promise<string | undefined> {
  const { tool: askUserTool, state: questionState } = createAskUserTool(requestQuestion);
  const agent = new Agent({
    initialState: {
      systemPrompt,
      model,
      thinkingLevel: "off",
      tools: [askUserTool, ...createAnalysisTools(questionState)],
      messages: [],
    },
    streamFn: (activeModel, context, options) =>
      modelRegistry.streamSimple(activeModel, context, options),
  });

  let errorMessage: string | undefined;
  agent.subscribe((event) => {
    if (event.type === "tool_execution_start") {
      onActivity(getToolLabel(event.toolName));
      return;
    }
    if (event.type === "message_update") {
      const update = event.assistantMessageEvent;
      if (update.type === "text_delta") onText(update.delta);
      return;
    }
    if (
      event.type === "message_end" &&
      event.message.role === "assistant" &&
      event.message.errorMessage
    ) {
      errorMessage = event.message.errorMessage;
    }
  });

  await agent.prompt(initialRequest);
  return errorMessage;
}
