import type { AgentTool } from "@earendil-works/pi-agent-core";
import { Type } from "@earendil-works/pi-ai";
import { getAgentsViewAvailability, installAgentsView, runAgentsView } from "../agentsview/runner";
import type { UserQuestionState } from "./questions";

const emptyParameters = Type.Object({});
const toolLabels: Record<string, string> = {
  check_data_source: "Checking local session data",
  prepare_data_source: "Preparing local session data",
  get_usage_report: "Reading usage history",
  get_activity_report: "Reading activity history",
  ask_user: "Waiting for your input",
};

export function getToolLabel(name: string): string {
  return toolLabels[name] ?? "Working";
}

const reportParameters = Type.Object({
  window: Type.Optional(
    Type.Union([Type.Literal("7d"), Type.Literal("30d"), Type.Literal("all")], {
      description: "Common report window. Defaults to 30d.",
    }),
  ),
  since: Type.Optional(
    Type.String({
      description:
        "Custom inclusive report start such as 14d or 2026-07-01. Do not combine this with window.",
    }),
  ),
  until: Type.Optional(
    Type.String({
      description: "Optional inclusive end date in YYYY-MM-DD format.",
    }),
  ),
  agent: Type.Optional(
    Type.String({
      description: "Optional coding-agent name, such as codex or claude.",
    }),
  ),
});

function validateDateArgument(value: string | undefined, name: string): void {
  if (value === undefined) return;
  if (!/^(?:\d+[hdwmy]|\d{4}-\d{2}-\d{2})$/.test(value)) {
    throw new Error(`${name} must be a duration such as 30d or a YYYY-MM-DD date.`);
  }
}

type ReportParameters = {
  window?: "7d" | "30d" | "all";
  since?: string;
  until?: string;
  agent?: string;
};

function reportArgs(base: string[], parameters: ReportParameters, supportsAll: boolean): string[] {
  const { window = "30d", since, until, agent } = parameters;
  if (since && parameters.window) {
    throw new Error("Use either window or since, not both.");
  }
  validateDateArgument(since, "since");
  validateDateArgument(until, "until");

  const args = [...base];
  if (window === "all" && supportsAll) args.push("--all");
  else args.push("--since", since ?? (window === "all" ? "1970-01-01" : window));
  if (until) args.push("--until", until);
  if (agent?.trim()) args.push("--agent", agent.trim());
  return args;
}

function jsonToolResult(data: unknown, details: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
    details,
  };
}

export function createAnalysisTools(questionState: UserQuestionState): AgentTool<any>[] {
  const statusTool: AgentTool<typeof emptyParameters> = {
    name: "check_data_source",
    label: "Check data source",
    description:
      "Check whether Farpoint's local session data source is available. This does not download or install anything.",
    parameters: emptyParameters,
    execute: async () => {
      const availability = await getAgentsViewAvailability();
      return jsonToolResult(availability, availability);
    },
  };

  const installTool: AgentTool<typeof emptyParameters> = {
    name: "prepare_data_source",
    label: "Prepare data source",
    description:
      "Prepare Farpoint's local session data source. This requires explicit consent through ask_user first.",
    parameters: emptyParameters,
    execute: async () => {
      if (!questionState.hasSourceInstallConsent()) {
        throw new Error(
          "Preparing the data source requires explicit consent. Call ask_user with kind=confirm and purpose=source_install first.",
        );
      }
      const installed = await installAgentsView();
      return jsonToolResult(
        {
          installed: true,
          method: installed.method,
          detail:
            installed.method === "uvx"
              ? "The local data source is ready through uvx."
              : "The local data source was installed and is ready.",
        },
        installed,
      );
    },
  };

  const usageTool: AgentTool<typeof reportParameters> = {
    name: "get_usage_report",
    label: "Get usage report",
    description:
      "Return structured daily token and estimated-cost usage data for a selected time window.",
    parameters: reportParameters,
    execute: async (_toolCallId, parameters) => {
      const data = await runAgentsView(
        reportArgs(["usage", "daily", "--json", "--breakdown"], parameters, true),
      );
      return jsonToolResult(data, { report: "usage", ...parameters });
    },
  };

  const activityTool: AgentTool<typeof reportParameters> = {
    name: "get_activity_report",
    label: "Get activity report",
    description:
      "Return structured aggregate session activity for a selected time window. Summarize only fields actually returned because the schema may evolve.",
    parameters: reportParameters,
    execute: async (_toolCallId, parameters) => {
      const data = await runAgentsView(
        reportArgs(["stats", "--format", "json"], parameters, false),
      );
      return jsonToolResult(data, { report: "activity", ...parameters });
    },
  };

  return [statusTool, installTool, usageTool, activityTool];
}
