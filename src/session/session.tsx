import { useCallback, useEffect, useState } from "react";
import type { Api, Model } from "@earendil-works/pi-ai";
import { useApp, useInput } from "ink";
import { runSession } from "../ai/client";
import { messageFromError } from "../errors";
import { SessionScreen } from "./screen";

type SessionStatus = "running" | "done" | "error";

export type SessionProps = {
  model: Model<Api>;
  onBack: () => void;
};

export function Session({ model, onBack }: SessionProps) {
  const { exit } = useApp();
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState<SessionStatus>("running");
  const [toolCalls, setToolCalls] = useState<string[]>([]);
  const [error, setError] = useState("");

  const start = useCallback(async () => {
    setReply("");
    setStatus("running");
    setToolCalls([]);
    setError("");

    try {
      const sessionError = await runSession(
        model,
        (delta) => {
          setReply((current) => current + delta);
        },
        (toolName) => {
          setToolCalls((current) => [...current, toolName]);
        },
      );

      if (sessionError) {
        setError(sessionError);
        setStatus("error");
      } else {
        setStatus("done");
      }
    } catch (cause) {
      setError(messageFromError(cause));
      setStatus("error");
    }
  }, [model]);

  useEffect(() => {
    void start();
  }, [start]);

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
      return;
    }

    if (status !== "running") {
      if (key.escape) {
        onBack();
      } else if (input.toLowerCase() === "r") {
        void start();
      } else if (key.return || input === "q") {
        exit();
      }
    }
  });

  return (
    <SessionScreen
      model={model}
      reply={reply}
      status={status}
      error={error}
      toolCalls={toolCalls}
    />
  );
}
