import type { Api, Model } from "@earendil-works/pi-ai";
import { Box, Text } from "ink";
import { authMethodOptions, type ProviderOption } from "../ai/providers.js";
import { terminalLink } from "../terminal.js";
import { Hint, InputField, ScreenHeading, Selector, Shell, Spinner } from "../ui/primitives.js";
import { theme } from "../ui/theme.js";

export function WelcomeScreen({ ready }: { ready: boolean }) {
  return (
    <Shell stage="welcome" animateBrand>
      <ScreenHeading>Understand how you work with coding agents.</ScreenHeading>
      <Box marginTop={3} flexDirection="column">
        <Text>
          Farpoint turns your coding sessions into clear, evidence-backed ways to improve.
        </Text>
        <Text color={theme.muted}>
          See what worked, where agents stalled, and what to change next.
        </Text>
      </Box>
      {ready ? (
        <Selector options={[{ name: "Get started" }]} selectedIndex={0} nameWidth={30} />
      ) : (
        <Box marginTop={4}>
          <Spinner label="Getting things ready…" />
        </Box>
      )}
      <Hint>enter continue · ctrl+c exit</Hint>
    </Shell>
  );
}

export type ProviderListScreenProps = {
  providers: ProviderOption[];
  selectedIndex: number;
  query: string;
  filteredCount: number;
  totalCount: number;
  connectedProviderNames: string;
  error: string;
  notice: string;
  credentialPath: string;
};

export function ProviderListScreen({
  providers,
  selectedIndex,
  query,
  filteredCount,
  totalCount,
  connectedProviderNames,
  error,
  notice,
  credentialPath,
}: ProviderListScreenProps) {
  return (
    <Shell stage="connections">
      <ScreenHeading>Choose a provider</ScreenHeading>
      <Box marginTop={1}>
        <Text color={theme.muted}>
          {connectedProviderNames
            ? `Signed in: ${connectedProviderNames}`
            : "No provider is connected yet."}
        </Text>
      </Box>
      <Box marginTop={2}>
        <Text color={theme.muted}>
          Use a subscription or API key. Adding one keeps your other saved providers.
        </Text>
      </Box>
      <InputField value={query} placeholder="Search providers" icon="⌕" />
      {providers.length > 0 ? (
        <Selector
          options={providers.map((provider) => ({
            name: provider.name,
            detail: provider.connected ? "● saved · enter to use" : `＋ ${provider.detail}`,
          }))}
          selectedIndex={selectedIndex}
          nameWidth={32}
        />
      ) : (
        <Box marginTop={3}>
          <Text color={theme.muted}>No providers match “{query}”.</Text>
        </Box>
      )}
      {error ? <Text color={theme.danger}>{error}</Text> : null}
      {notice ? <Text color={theme.success}>{notice}</Text> : null}
      <Hint>
        {filteredCount} of {totalCount} · type search · ↑↓ move · enter use
        {"\n"}ctrl+x sign out · esc clear/back
      </Hint>
      <Box marginTop={1}>
        <Text color={theme.muted}>Credentials: {credentialPath}</Text>
      </Box>
    </Shell>
  );
}

export function AuthMethodScreen({
  provider,
  selectedIndex,
}: {
  provider: ProviderOption | undefined;
  selectedIndex: number;
}) {
  return (
    <Shell stage="connect">
      <ScreenHeading>Connect {provider?.name}</ScreenHeading>
      <Box marginTop={2}>
        <Text color={theme.muted}>Choose how you want to sign in.</Text>
      </Box>
      <Selector
        options={authMethodOptions(provider)}
        selectedIndex={selectedIndex}
        nameWidth={30}
      />
      <Hint>↑↓ move · enter select · esc back</Hint>
    </Shell>
  );
}

export function ApiKeyScreen({
  providerName,
  value,
  error,
}: {
  providerName: string | undefined;
  value: string;
  error: string;
}) {
  return (
    <Shell stage="connect">
      <ScreenHeading>{providerName} API key</ScreenHeading>
      <Box marginTop={2}>
        <Text color={theme.muted}>Your key is stored locally.</Text>
      </Box>
      <InputField value={value} placeholder="Paste API key" masked />
      {error ? <Text color={theme.danger}>{error}</Text> : null}
      <Hint>enter save · esc back</Hint>
    </Shell>
  );
}

export type OAuthScreenProps = {
  providerName: string | undefined;
  url: string;
  status: string;
  prompt: string;
  inputValue: string;
  error: string;
  clipboardStatus: string;
};

export function OAuthScreen({
  providerName,
  url,
  status,
  prompt,
  inputValue,
  error,
  clipboardStatus,
}: OAuthScreenProps) {
  return (
    <Shell stage="connect">
      <ScreenHeading>Sign in with {providerName}</ScreenHeading>
      <Box marginTop={1} flexDirection="column">
        {url ? (
          <>
            <Text>
              <Text color={theme.success}>✓</Text> Browser opened
            </Text>
            <Text>
              {"  "}
              <Text color={theme.accent} underline>
                {terminalLink("Open sign-in page ↗", url)}
              </Text>
              <Text color={theme.muted}> · ctrl+l copy link</Text>
            </Text>
          </>
        ) : null}
        <Box marginTop={1}>
          {error ? <Text color={theme.danger}>{error}</Text> : <Spinner label={status} />}
        </Box>
        {clipboardStatus ? (
          <Text color={clipboardStatus === "Link copied" ? theme.success : theme.danger}>
            {clipboardStatus}
          </Text>
        ) : null}
      </Box>
      {prompt ? (
        <Box marginTop={2} flexDirection="column">
          <Text color={theme.muted}>{prompt}</Text>
          <InputField value={inputValue} placeholder="Paste code or redirect URL" />
        </Box>
      ) : null}
      <Hint>
        {error ? "esc choose another provider" : "finish sign-in in your browser · ctrl+c exit"}
      </Hint>
    </Shell>
  );
}

export type ModelListScreenProps = {
  providerName: string | undefined;
  query: string;
  models: Model<Api>[];
  selectedIndex: number;
  filteredCount: number;
  totalCount: number;
};

export function ModelListScreen({
  providerName,
  query,
  models,
  selectedIndex,
  filteredCount,
  totalCount,
}: ModelListScreenProps) {
  return (
    <Shell stage="model">
      <ScreenHeading>Choose a model</ScreenHeading>
      <Box marginTop={1}>
        <Text color={theme.success}>✓</Text>
        <Text color={theme.muted}>
          {" "}
          Connected to {providerName} · {filteredCount} of {totalCount} models
        </Text>
      </Box>
      <InputField value={query} placeholder="Search models by name" icon="⌕" />
      {models.length > 0 ? (
        <Selector
          selectedIndex={selectedIndex}
          nameWidth={46}
          options={models.map((model) => ({
            name: model.name,
            detail: model.reasoning ? "reasoning" : model.provider,
          }))}
        />
      ) : (
        <Box marginTop={3}>
          <Text color={theme.muted}>
            No models match “{query}”. Backspace to broaden the search.
          </Text>
        </Box>
      )}
      <Hint>type to search · ↑↓ move · enter use · esc clear/back</Hint>
    </Shell>
  );
}
