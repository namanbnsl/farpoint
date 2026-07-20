import { Agent } from "@earendil-works/pi-agent-core";
import type { Api, AuthInteraction, Model } from "@earendil-works/pi-ai";
import { builtinModels } from "@earendil-works/pi-ai/providers/all";
import {
  beginAgentsViewAnalysis,
  getAgentsViewAvailability,
  installAgentsView,
} from "../agentsview/runner";
import { createCredentialStore } from "../auth/credential-store";
import { runFullCorpusAnalysis } from "../intelligence/coordinator";
import type { RequestUserQuestion } from "./questions";

export const credentialStore = createCredentialStore();
export const modelRegistry = builtinModels({ credentials: credentialStore });

const MAX_PROVIDER_RETRIES = 2;
const MAX_PROVIDER_RETRY_DELAY_MS = 15_000;

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
      if (!firstOption) return Promise.reject(new Error("No sign-in method is available."));
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
        if (event.type === "info" && event.links?.[0])
          showAuthUrl(event.links[0].url, event.message);
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
  beginAgentsViewAnalysis();
  const availability = await getAgentsViewAvailability();
  if (!availability.installed) {
    const answer = await requestQuestion({
      kind: "confirm",
      question:
        "Farpoint needs AgentsView to read your local coding-agent history. Install or prepare it now?",
      options: ["Yes", "No"],
      purpose: "source_install",
    });
    if (!["yes", "y"].includes(answer.trim().toLowerCase())) {
      onText(
        "Farpoint cannot analyze sessions until the local AgentsView data source is available.",
      );
      return undefined;
    }
    onActivity("Preparing local session data");
    await installAgentsView();
  }

  const analyze = async (workerSystemPrompt: string, prompt: string): Promise<string> => {
    const agent = new Agent({
      initialState: {
        systemPrompt: workerSystemPrompt,
        model,
        thinkingLevel: "off",
        tools: [],
        messages: [],
      },
      streamFn: (activeModel, context, options) =>
        modelRegistry.streamSimple(activeModel, context, {
          ...options,
          maxRetries: MAX_PROVIDER_RETRIES,
          maxRetryDelayMs: MAX_PROVIDER_RETRY_DELAY_MS,
        }),
    });
    let text = "";
    let errorMessage: string | undefined;
    agent.subscribe((event) => {
      if (event.type === "message_update") {
        const update = event.assistantMessageEvent;
        if (update.type === "text_delta") text += update.delta;
      }
      if (
        event.type === "message_end" &&
        event.message.role === "assistant" &&
        event.message.errorMessage
      ) {
        errorMessage = event.message.errorMessage;
      }
    });
    await agent.prompt(prompt);
    if (errorMessage) throw new Error(errorMessage);
    if (!text.trim()) throw new Error("The analysis worker returned an empty response.");
    return text;
  };

  const { report, path } = await runFullCorpusAnalysis(analyze, (update) => {
    onActivity(update.label);
  });
  onText(`${report.report_markdown}\n\n_Report saved to \`${path}\`._`);
  return undefined;
}
