import { useCallback, useEffect, useState } from "react";
import type { Api, Model } from "@earendil-works/pi-ai";
import { spawn } from "node:child_process";
import { useApp, useInput } from "ink";
import { runSession } from "../ai/client";
import type { UserQuestion } from "../ai/questions";
import { messageFromError } from "../errors";
import { moveSelection } from "../ui/selection";
import { SessionScreen } from "./screen";

type SessionStatus = "running" | "done" | "error";
type PendingQuestion = UserQuestion & {
  resolve: (answer: string) => void;
};

type SessionProps = {
  model: Model<Api>;
  onBack: () => void;
};

function openInBrowser(path: string): Promise<void> {
  const [command, args] =
    process.platform === "darwin"
      ? ["open", [path]]
      : process.platform === "win32"
        ? ["cmd", ["/d", "/s", "/c", "start", "", path]]
        : ["xdg-open", [path]];

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { detached: true, stdio: "ignore" });
    child.once("error", reject);
    child.once("spawn", () => {
      child.unref();
      resolve();
    });
  });
}

export function Session({ model, onBack }: SessionProps) {
  const { exit } = useApp();
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState<SessionStatus>("running");
  const [activities, setActivities] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [reportPath, setReportPath] = useState<string>();
  const [pendingQuestion, setPendingQuestion] = useState<PendingQuestion>();
  const [questionValue, setQuestionValue] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);

  const requestQuestion = useCallback(
    (question: UserQuestion) =>
      new Promise<string>((resolve) => {
        setQuestionValue("");
        setQuestionIndex(0);
        setPendingQuestion({ ...question, resolve });
      }),
    [],
  );

  const start = useCallback(async () => {
    setReply("");
    setStatus("running");
    setActivities([]);
    setError("");
    setReportPath(undefined);
    setPendingQuestion(undefined);
    setQuestionValue("");
    setQuestionIndex(0);

    try {
      const htmlPath = await runSession(
        model,
        (delta) => {
          setReply((current) => current + delta);
        },
        (activity) => {
          setActivities((current) =>
            current.at(-1) === activity ? current : [...current, activity],
          );
        },
        requestQuestion,
      );

      setReportPath(htmlPath);
      setStatus("done");
    } catch (cause) {
      setError(messageFromError(cause));
      setStatus("error");
    }
  }, [model, requestQuestion]);

  useEffect(() => {
    void start();
  }, [start]);

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
      return;
    }

    if (pendingQuestion) {
      if (pendingQuestion.kind === "text") {
        if (key.return && questionValue.trim()) {
          pendingQuestion.resolve(questionValue.trim());
          setPendingQuestion(undefined);
          setQuestionValue("");
          return;
        }
        return;
      }

      if (key.upArrow) {
        setQuestionIndex((current) => moveSelection(current, -1, pendingQuestion.options.length));
        return;
      }
      if (key.downArrow) {
        setQuestionIndex((current) => moveSelection(current, 1, pendingQuestion.options.length));
        return;
      }
      if (pendingQuestion.kind === "confirm" && input.toLowerCase() === "y") {
        pendingQuestion.resolve("Yes");
        setPendingQuestion(undefined);
        return;
      }
      if (pendingQuestion.kind === "confirm" && input.toLowerCase() === "n") {
        pendingQuestion.resolve("No");
        setPendingQuestion(undefined);
        return;
      }
      if (key.return) {
        const answer = pendingQuestion.options[questionIndex];
        if (answer) {
          pendingQuestion.resolve(answer);
          setPendingQuestion(undefined);
        }
      }
      return;
    }
    if (status !== "running") {
      if (key.escape) {
        onBack();
      } else if (input.toLowerCase() === "r") {
        void start();
      } else if (input.toLowerCase() === "o" && reportPath) {
        setError("");
        void openInBrowser(reportPath).catch((cause) => {
          setError(`Could not open the report: ${messageFromError(cause)}`);
        });
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
      activities={activities}
      pendingQuestion={pendingQuestion}
      questionValue={questionValue}
      questionIndex={questionIndex}
      onQuestionChange={setQuestionValue}
      canOpenReport={Boolean(reportPath)}
    />
  );
}
