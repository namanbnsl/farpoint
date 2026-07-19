import type { Api, Model, Provider } from "@earendil-works/pi-ai";
import { matchesQuery } from "../search";

export type ProviderId = string;
export type AuthMethod = "oauth" | "api-key";

export type ProviderOption = {
  id: ProviderId;
  name: string;
  detail: string;
  methods: AuthMethod[];
  connected: boolean;
};

export type AuthMethodOption = {
  name: string;
  detail: string;
};

const preferredProviderIds = [
  "openai-codex",
  "anthropic",
  "openai",
  "google",
  "openrouter",
  "xai",
  "groq",
  "cerebras",
];

function availableAuthMethods(provider: Provider): AuthMethod[] {
  const methods: AuthMethod[] = [];
  if (provider.auth.oauth) methods.push("oauth");
  if (provider.auth.apiKey) methods.push("api-key");
  return methods;
}

function providerGroup(option: ProviderOption): number {
  if (option.connected) return 0;
  if (option.methods.length === 1 && option.methods[0] === "oauth") return 1;
  if (option.methods.includes("oauth")) return 2;
  if (option.methods.includes("api-key")) return 3;
  return 4;
}

function providerDetail(methods: AuthMethod[], connected: boolean): string {
  if (connected) return "connected";
  if (methods.length > 1) return "subscription or API key";
  if (methods[0] === "oauth") return "browser sign-in";
  return "API key";
}

export function buildProviderOptions(
  providers: readonly Provider[],
  connectedProviderIds: ReadonlySet<string>,
): ProviderOption[] {
  const preferredOrder = new Map(preferredProviderIds.map((id, index) => [id, index]));
  return providers
    .map((provider) => {
      const connected = connectedProviderIds.has(provider.id);
      const methods = availableAuthMethods(provider);
      return {
        id: provider.id,
        name: provider.id === "openai-codex" ? "ChatGPT" : provider.name,
        detail: providerDetail(methods, connected),
        methods,
        connected,
      };
    })
    .sort((a, b) => {
      const groupDifference = providerGroup(a) - providerGroup(b);
      if (groupDifference !== 0) return groupDifference;
      const aOrder = preferredOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const bOrder = preferredOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder || a.name.localeCompare(b.name);
    });
}

export function authMethodOptions(provider: ProviderOption | undefined): AuthMethodOption[] {
  if (!provider) return [];
  return provider.methods.map((method) =>
    method === "oauth"
      ? {
          name: provider.id === "anthropic" ? "Claude Pro / Max" : "Browser sign-in",
          detail: "use your subscription",
        }
      : {
          name: "API key",
          detail: "use a developer account",
        },
  );
}

export function filterProviders(providers: ProviderOption[], query: string): ProviderOption[] {
  return providers.filter((provider) =>
    matchesQuery(query, [provider.name, provider.id, provider.detail]),
  );
}

export function filterModels(models: Model<Api>[], query: string): Model<Api>[] {
  return models.filter((model) => matchesQuery(query, [model.name, model.id, model.provider]));
}
