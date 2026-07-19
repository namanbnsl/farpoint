import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Api, Model } from "@earendil-works/pi-ai";
import { useApp, useInput } from "ink";
import {
  createOAuthInteraction,
  credentialStore,
  modelRegistry,
  streamGreeting,
} from "./ai/client";
import {
  buildProviderOptions,
  filterModels,
  filterProviders,
  type AuthMethod,
  type ProviderId,
  type ProviderOption,
} from "./ai/providers";
import { authPath } from "./auth/credential-store";
import { messageFromError } from "./errors";
import {
  ApiKeyScreen,
  AuthMethodScreen,
  HelloScreen,
  ModelListScreen,
  OAuthScreen,
  ProviderListScreen,
  WelcomeScreen,
} from "./onboarding/screens";
import { copyToClipboard } from "./terminal";
import { getSelectionWindow, moveSelection } from "./ui/selection";
import { updateTextInput } from "./ui/text-input";

type OnboardingScreen =
  | "welcome"
  | "providers"
  | "auth-method"
  | "api-key"
  | "oauth"
  | "model"
  | "hello";

type HelloStatus = "sending" | "done" | "error";

export function Onboarding() {
  const { exit } = useApp();
  const [screen, setScreen] = useState<OnboardingScreen>("welcome");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeProviderId, setActiveProviderId] = useState<ProviderId>("openai-codex");
  const [connectedProviderIds, setConnectedProviderIds] = useState<Set<string>>(new Set());
  const [credentialsLoaded, setCredentialsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [oauthUrl, setOauthUrl] = useState("");
  const [oauthStatus, setOauthStatus] = useState("Opening your browser…");
  const [oauthPrompt, setOauthPrompt] = useState("");
  const [clipboardStatus, setClipboardStatus] = useState("");
  const [availableModels, setAvailableModels] = useState<Model<Api>[]>([]);
  const [providerQuery, setProviderQuery] = useState("");
  const [modelQuery, setModelQuery] = useState("");
  const [chosenModel, setChosenModel] = useState<Model<Api>>();
  const [helloReply, setHelloReply] = useState("");
  const [helloStatus, setHelloStatus] = useState<HelloStatus>("sending");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const promptResolver = useRef<((value: string) => void) | undefined>(undefined);
  const oauthAbortController = useRef<AbortController | undefined>(undefined);

  const providers = useMemo(
    () => buildProviderOptions(modelRegistry.getProviders(), connectedProviderIds),
    [connectedProviderIds],
  );
  const activeProvider = useMemo(
    () => providers.find((provider) => provider.id === activeProviderId),
    [activeProviderId, providers],
  );
  const connectedProviderNames = useMemo(
    () =>
      providers
        .filter((provider) => provider.connected)
        .map((provider) => provider.name)
        .join(", "),
    [providers],
  );
  const visibleProviders = useMemo(
    () => filterProviders(providers, providerQuery),
    [providerQuery, providers],
  );
  const visibleModels = useMemo(
    () => filterModels(availableModels, modelQuery),
    [availableModels, modelQuery],
  );
  const providerWindow = useMemo(
    () => getSelectionWindow(visibleProviders, selectedIndex, 9),
    [selectedIndex, visibleProviders],
  );
  const modelWindow = useMemo(
    () => getSelectionWindow(visibleModels, selectedIndex, 10),
    [selectedIndex, visibleModels],
  );

  const refreshConnections = useCallback(async () => {
    const storedCredentials = await credentialStore.list();
    setConnectedProviderIds(new Set(storedCredentials.map((credential) => credential.providerId)));
    setCredentialsLoaded(true);
  }, []);

  useEffect(() => {
    void refreshConnections();
  }, [refreshConnections]);

  const showModels = useCallback((providerId: ProviderId) => {
    const providerModels = modelRegistry
      .getModels(providerId)
      .filter((model) => model.provider === providerId)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (providerModels.length === 0) {
      setError(`Pi did not return any models for ${providerId}.`);
      return;
    }
    setActiveProviderId(providerId);
    setAvailableModels(providerModels);
    setModelQuery("");
    setSelectedIndex(0);
    setScreen("model");
  }, []);

  const startOAuth = useCallback(
    async (providerId: ProviderId) => {
      setActiveProviderId(providerId);
      setScreen("oauth");
      setOauthUrl("");
      setOauthPrompt("");
      setOauthStatus("Opening your browser…");
      setClipboardStatus("");
      setInputValue("");
      setError("");

      const abortController = new AbortController();
      oauthAbortController.current = abortController;
      const interaction = createOAuthInteraction({
        signal: abortController.signal,
        requestInput: (message) => {
          setOauthPrompt(message);
          setInputValue("");
          return new Promise<string>((resolve) => {
            promptResolver.current = resolve;
          });
        },
        showAuthUrl: (url, status) => {
          setOauthUrl(url);
          setClipboardStatus("");
          setOauthStatus(status ?? "Waiting for approval in your browser…");
        },
        showStatus: setOauthStatus,
      });

      try {
        await modelRegistry.login(providerId, "oauth", interaction);
        await refreshConnections();
        showModels(providerId);
      } catch (cause) {
        if (!abortController.signal.aborted) {
          setError(messageFromError(cause));
        }
      } finally {
        oauthAbortController.current = undefined;
      }
    },
    [refreshConnections, showModels],
  );

  const saveApiKey = useCallback(async () => {
    const apiKey = inputValue.trim();
    if (!apiKey) {
      setError("Enter an API key to continue.");
      return;
    }
    try {
      await credentialStore.modify(activeProviderId, async () => ({
        type: "api_key",
        key: apiKey,
      }));
      await refreshConnections();
      setInputValue("");
      showModels(activeProviderId);
    } catch (cause) {
      setError(messageFromError(cause));
    }
  }, [activeProviderId, inputValue, refreshConnections, showModels]);

  const sendHello = useCallback(async (model: Model<Api>) => {
    setChosenModel(model);
    setHelloReply("");
    setHelloStatus("sending");
    setError("");
    setScreen("hello");
    try {
      const greetingError = await streamGreeting(model, (delta) => {
        setHelloReply((current) => current + delta);
      });
      if (greetingError) {
        setError(greetingError);
        setHelloStatus("error");
      } else {
        setHelloStatus("done");
      }
    } catch (cause) {
      setError(messageFromError(cause));
      setHelloStatus("error");
    }
  }, []);

  const signOut = useCallback(
    async (provider: ProviderOption) => {
      try {
        await credentialStore.delete(provider.id);
        await refreshConnections();
        setSelectedIndex(0);
        setError("");
        setNotice(`Signed out of ${provider.name}.`);
      } catch (cause) {
        setError(messageFromError(cause));
      }
    },
    [refreshConnections],
  );

  const returnToProviders = useCallback(() => {
    setProviderQuery("");
    setSelectedIndex(0);
    setError("");
    setNotice("");
    setScreen("providers");
  }, []);

  const leaveCredentialScreen = useCallback(() => {
    promptResolver.current?.("");
    promptResolver.current = undefined;
    oauthAbortController.current?.abort();
    setInputValue("");
    setOauthPrompt("");
    setOauthUrl("");
    setSelectedIndex(0);
    setScreen((activeProvider?.methods.length ?? 0) > 1 ? "auth-method" : "providers");
  }, [activeProvider]);

  const connectWithMethod = useCallback(
    (providerId: ProviderId, method: AuthMethod) => {
      if (method === "oauth") {
        void startOAuth(providerId);
        return;
      }
      setActiveProviderId(providerId);
      setInputValue("");
      setSelectedIndex(0);
      setScreen("api-key");
    },
    [startOAuth],
  );

  const chooseProvider = useCallback(
    (provider: ProviderOption) => {
      setActiveProviderId(provider.id);
      setError("");
      setNotice("");
      if (provider.connected) {
        showModels(provider.id);
        return;
      }
      if (provider.methods.length > 1) {
        setSelectedIndex(0);
        setScreen("auth-method");
        return;
      }
      const onlyMethod = provider.methods[0];
      if (onlyMethod) connectWithMethod(provider.id, onlyMethod);
    },
    [connectWithMethod, showModels],
  );

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      oauthAbortController.current?.abort();
      exit();
      if (screen === "oauth") setTimeout(() => process.exit(0), 50);
      return;
    }

    if (screen === "oauth" && oauthUrl && key.ctrl && input.toLowerCase() === "l") {
      void copyToClipboard(oauthUrl)
        .then(() => setClipboardStatus("Link copied"))
        .catch(() => setClipboardStatus("Clipboard unavailable"));
      return;
    }

    if (screen === "welcome") {
      if (credentialsLoaded && (key.return || input === " ")) returnToProviders();
      return;
    }

    if (screen === "providers") {
      if (key.upArrow) {
        setSelectedIndex((current) => moveSelection(current, -1, visibleProviders.length));
      }
      if (key.downArrow) {
        setSelectedIndex((current) => moveSelection(current, 1, visibleProviders.length));
      }
      if (key.escape) {
        if (providerQuery) {
          setProviderQuery("");
          setSelectedIndex(0);
        } else {
          setSelectedIndex(0);
          setScreen("welcome");
        }
        return;
      }
      if (key.ctrl && input.toLowerCase() === "x") {
        const provider = visibleProviders[selectedIndex];
        if (provider?.connected) void signOut(provider);
        return;
      }
      if (key.return) {
        const provider = visibleProviders[selectedIndex];
        if (provider) chooseProvider(provider);
        return;
      }
      const updatedQuery = updateTextInput(providerQuery, input, key);
      if (updatedQuery !== undefined) {
        setProviderQuery(updatedQuery);
        setSelectedIndex(0);
      }
      return;
    }

    if (screen === "auth-method") {
      const methodCount = activeProvider?.methods.length ?? 0;
      if (key.upArrow) {
        setSelectedIndex((current) => moveSelection(current, -1, methodCount));
      }
      if (key.downArrow) {
        setSelectedIndex((current) => moveSelection(current, 1, methodCount));
      }
      if (key.escape) returnToProviders();
      if (key.return) {
        const method = activeProvider?.methods[selectedIndex];
        if (method) connectWithMethod(activeProviderId, method);
      }
      return;
    }

    if (screen === "api-key" || (screen === "oauth" && oauthPrompt)) {
      if (key.escape) {
        leaveCredentialScreen();
        return;
      }
      if (key.return) {
        if (screen === "api-key") void saveApiKey();
        else if (inputValue.trim()) {
          promptResolver.current?.(inputValue.trim());
          promptResolver.current = undefined;
          setOauthPrompt("");
          setInputValue("");
          setOauthStatus("Finishing sign-in…");
        }
        return;
      }
      const updatedValue = updateTextInput(inputValue, input, key);
      if (updatedValue !== undefined) setInputValue(updatedValue);
      return;
    }

    if (screen === "oauth" && error && key.escape) {
      leaveCredentialScreen();
      return;
    }

    if (screen === "model") {
      if (key.upArrow) {
        setSelectedIndex((current) => moveSelection(current, -1, visibleModels.length));
      }
      if (key.downArrow) {
        setSelectedIndex((current) => moveSelection(current, 1, visibleModels.length));
      }
      if (key.escape) {
        if (modelQuery) {
          setModelQuery("");
          setSelectedIndex(0);
        } else {
          returnToProviders();
        }
        return;
      }
      if (key.return) {
        const model = visibleModels[selectedIndex];
        if (model) void sendHello(model);
        return;
      }
      const updatedQuery = updateTextInput(modelQuery, input, key);
      if (updatedQuery !== undefined) {
        setModelQuery(updatedQuery);
        setSelectedIndex(0);
      }
      return;
    }

    if (screen === "hello" && helloStatus !== "sending") {
      if (key.escape) {
        setSelectedIndex(0);
        setScreen("model");
      } else if (input.toLowerCase() === "r" && chosenModel) {
        void sendHello(chosenModel);
      } else if (key.return || input === "q") {
        exit();
      }
    }
  });

  switch (screen) {
    case "welcome":
      return <WelcomeScreen ready={credentialsLoaded} />;
    case "providers":
      return (
        <ProviderListScreen
          providers={providerWindow.items}
          selectedIndex={selectedIndex - providerWindow.startIndex}
          query={providerQuery}
          filteredCount={visibleProviders.length}
          totalCount={providers.length}
          connectedProviderNames={connectedProviderNames}
          error={error}
          notice={notice}
          credentialPath={authPath}
        />
      );
    case "auth-method":
      return <AuthMethodScreen provider={activeProvider} selectedIndex={selectedIndex} />;
    case "api-key":
      return <ApiKeyScreen providerName={activeProvider?.name} value={inputValue} error={error} />;
    case "oauth":
      return (
        <OAuthScreen
          providerName={activeProvider?.name}
          url={oauthUrl}
          status={oauthStatus}
          prompt={oauthPrompt}
          inputValue={inputValue}
          error={error}
          clipboardStatus={clipboardStatus}
        />
      );
    case "model":
      return (
        <ModelListScreen
          providerName={activeProvider?.name}
          query={modelQuery}
          models={modelWindow.items}
          selectedIndex={selectedIndex - modelWindow.startIndex}
          filteredCount={visibleModels.length}
          totalCount={availableModels.length}
        />
      );
    case "hello":
      return (
        <HelloScreen model={chosenModel} reply={helloReply} status={helloStatus} error={error} />
      );
  }
}
