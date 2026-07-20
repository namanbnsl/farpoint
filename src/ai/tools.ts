import type { AgentTool } from "@earendil-works/pi-agent-core";
import { Type } from "@earendil-works/pi-ai";
import {
  getAgentsViewAvailability,
  installAgentsView,
  runAgentsView,
  syncAgentsView,
} from "../agentsview/runner";
import type { UserQuestionState } from "./questions";

const emptyParameters = Type.Object({});
const toolLabels: Record<string, string> = {
  check_data_source: "Checking local session data",
  prepare_data_source: "Preparing local session data",
  build_report_context: "Building a focused evidence set",
  inspect_session: "Inspecting session evidence",
  ask_user: "Waiting for your input",
};

const OVERVIEW_BUDGET = 42_000;
const SESSION_EVIDENCE_BUDGET = 18_000;
const MAX_SESSION_INSPECTIONS = 6;

export function getToolLabel(name: string): string {
  return toolLabels[name] ?? "Working";
}

const inspectSessionParameters = Type.Object({
  sessionId: Type.String({ description: "Exact AgentsView session id." }),
  messageLimit: Type.Optional(Type.Number({ minimum: 5, maximum: 30 })),
});

function jsonToolResult(data: unknown, details: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
    details,
  };
}

function compactValue(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[nested data omitted]";
  if (typeof value === "string") {
    return value.length > 1_000 ? `${value.slice(0, 1_000)}…` : value;
  }
  if (Array.isArray(value)) {
    const limit = depth <= 1 ? 30 : 12;
    const items: unknown[] = value.slice(0, limit).map((item) => compactValue(item, depth + 1));
    if (value.length > limit) items.push(`[${value.length - limit} more items omitted]`);
    return items;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 80)
        .map(([key, item]) => [key, compactValue(item, depth + 1)]),
    );
  }
  return value;
}

function fitToBudget(value: unknown, budget: number): unknown {
  const compacted = compactValue(value);
  const text = JSON.stringify(compacted);
  if (text.length <= budget) return compacted;
  return {
    truncated: true,
    characterBudget: budget,
    data: text.slice(0, budget),
  };
}

export function createAnalysisTools(questionState: UserQuestionState): AgentTool<any>[] {
  let sessionInspections = 0;

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
      const sync = await syncAgentsView();
      return jsonToolResult(
        {
          installed: true,
          synced: true,
          method: installed.method,
          syncDetail: sync.detail,
        },
        installed,
      );
    },
  };

  const contextTool: AgentTool<typeof emptyParameters> = {
    name: "build_report_context",
    label: "Build report context",
    description:
      "Build the complete, size-bounded overview for this report. It syncs once and returns aggregate history plus a session shortlist. Call exactly once.",
    parameters: emptyParameters,
    execute: async () => {
      const sync = await syncAgentsView();
      const [usage, stats, activity, health, skills, candidates] = await Promise.all([
        runAgentsView(["usage", "daily", "--json", "--breakdown", "--all"]),
        runAgentsView(["stats", "--format", "json", "--since", "1970-01-01"]),
        runAgentsView(["activity", "report", "--preset", "month", "--json"]),
        runAgentsView(["health", "--limit", "100", "--json"]),
        runAgentsView(["skills", "list", "--format", "json"]),
        runAgentsView(["session", "list", "--json", "--limit", "100"]),
      ]);
      const packet = fitToBudget(
        {
          generatedAt: new Date().toISOString(),
          sync: sync.detail,
          coverage: {
            usage: "all time with daily breakdown",
            stats: "all time",
            activity: "last 30 days",
            health: "100 recent sessions",
            candidates: "100 recent sessions",
          },
          usage,
          stats,
          activity,
          health,
          skills,
          sessionCandidates: candidates,
        },
        OVERVIEW_BUDGET,
      );
      return jsonToolResult(packet, {
        report: "bounded_context",
        characterBudget: OVERVIEW_BUDGET,
      });
    },
  };

  const inspectTool: AgentTool<typeof inspectSessionParameters> = {
    name: "inspect_session",
    label: "Inspect session",
    description:
      "Fetch bounded evidence for one shortlisted session. At most six sessions may be inspected.",
    parameters: inspectSessionParameters,
    execute: async (_toolCallId, { sessionId, messageLimit = 24 }) => {
      if (sessionInspections >= MAX_SESSION_INSPECTIONS) {
        throw new Error(
          `The report is limited to ${MAX_SESSION_INSPECTIONS} deep session inspections. Synthesize the report from the evidence already collected.`,
        );
      }
      sessionInspections += 1;
      const [overview, messages, toolCalls, usage, health] = await Promise.all([
        runAgentsView(["session", "get", sessionId, "--format", "json"]),
        runAgentsView([
          "session",
          "messages",
          sessionId,
          "--from",
          "0",
          "--limit",
          String(messageLimit),
          "--json",
        ]),
        runAgentsView(["session", "tool-calls", sessionId, "--json"]),
        runAgentsView(["session", "usage", sessionId, "--format", "json"]),
        runAgentsView(["health", sessionId, "--json"]),
      ]);
      const evidence = fitToBudget(
        { overview, messages, toolCalls, usage, health },
        SESSION_EVIDENCE_BUDGET,
      );
      return jsonToolResult(evidence, {
        report: "session_evidence",
        sessionId,
        inspection: sessionInspections,
        characterBudget: SESSION_EVIDENCE_BUDGET,
      });
    },
  };

  return [statusTool, installTool, contextTool, inspectTool];
}
