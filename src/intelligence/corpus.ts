import { runAgentsView } from "../agentsview/runner.ts";
import type { NumericSummary, SessionCandidate, SessionSummary } from "./types.ts";

type SessionPage = {
  sessions?: SessionSummary[];
  next_cursor?: string;
  total?: number;
};

const NUMERIC_FIELDS = [
  "message_count",
  "user_message_count",
  "total_output_tokens",
  "peak_context_tokens",
  "tool_failure_signal_count",
  "tool_retry_count",
  "edit_churn_count",
  "compaction_count",
] as const;

type NumericField = (typeof NUMERIC_FIELDS)[number];

function numberValue(session: SessionSummary, field: NumericField): number {
  const value = session[field];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export async function paginateSessions(
  extraArgs: string[] = [],
  read: (args: string[]) => Promise<unknown> = runAgentsView,
): Promise<SessionSummary[]> {
  const sessions: SessionSummary[] = [];
  let cursor: string | undefined;
  do {
    const args = ["session", "list", "--json", "--limit", "500", ...extraArgs];
    if (cursor) args.push("--cursor", cursor);
    const page = (await read(args)) as SessionPage;
    if (!Array.isArray(page.sessions)) {
      throw new Error("AgentsView session list returned an invalid sessions page.");
    }
    sessions.push(...page.sessions);
    cursor = page.next_cursor || undefined;
  } while (cursor);
  return sessions;
}

function percentile(values: number[], fraction: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(fraction * sorted.length) - 1));
  return sorted[index] ?? 0;
}

export function selectCorpus(allSessions: SessionSummary[]): {
  eligible: SessionSummary[];
  excludedAsNoise: number;
  exceptionalNoiseAdmitted: number;
} {
  const substantive = allSessions.filter(
    (session) =>
      numberValue(session, "user_message_count") >= 2 ||
      numberValue(session, "message_count") >= 10,
  );
  const thresholds = new Map<NumericField, number>();
  for (const field of NUMERIC_FIELDS) {
    thresholds.set(
      field,
      percentile(
        substantive.map((session) => numberValue(session, field)),
        0.98,
      ),
    );
  }

  let exceptionalNoiseAdmitted = 0;
  const eligible = allSessions.filter((session) => {
    const noisy = Boolean(session.is_automated) || numberValue(session, "user_message_count") <= 1;
    if (!noisy) return true;
    const exceptional = NUMERIC_FIELDS.some((field) => {
      const threshold = thresholds.get(field) ?? 0;
      return threshold > 0 && numberValue(session, field) >= threshold;
    });
    if (exceptional) exceptionalNoiseAdmitted += 1;
    return exceptional;
  });

  return {
    eligible,
    excludedAsNoise: allSessions.length - eligible.length,
    exceptionalNoiseAdmitted,
  };
}

function durationMinutes(session: SessionSummary): number {
  const start = Date.parse(session.started_at ?? "");
  const end = Date.parse(session.ended_at ?? "");
  return Number.isFinite(start) && Number.isFinite(end) && end >= start
    ? Math.round((end - start) / 60_000)
    : 0;
}

function groupMetrics(sessions: SessionSummary[], key: "agent" | "project") {
  const groups: Record<
    string,
    { sessions: number; messages: number; failures: number; retries: number }
  > = {};
  for (const session of sessions) {
    const name = session[key] || "unknown";
    const group = (groups[name] ??= { sessions: 0, messages: 0, failures: 0, retries: 0 });
    group.sessions += 1;
    group.messages += numberValue(session, "message_count");
    group.failures += numberValue(session, "tool_failure_signal_count");
    group.retries += numberValue(session, "tool_retry_count");
  }
  return groups;
}

export function computeMetrics(sessions: SessionSummary[]): NumericSummary {
  const totals: Record<string, number> = { duration_minutes: 0 };
  const percentiles: NumericSummary["percentiles"] = {};
  for (const field of NUMERIC_FIELDS) {
    const values = sessions.map((session) => numberValue(session, field));
    totals[field] = values.reduce((sum, value) => sum + value, 0);
    percentiles[field] = {
      p50: percentile(values, 0.5),
      p90: percentile(values, 0.9),
      p98: percentile(values, 0.98),
    };
  }
  totals.duration_minutes = sessions.reduce((sum, session) => sum + durationMinutes(session), 0);

  const outcomes: Record<string, number> = {};
  for (const session of sessions) {
    const outcome = session.outcome || "unknown";
    outcomes[outcome] = (outcomes[outcome] ?? 0) + 1;
  }

  return {
    sessions: sessions.length,
    totals,
    averages: Object.fromEntries(
      Object.entries(totals).map(([key, value]) => [
        key,
        sessions.length ? value / sessions.length : 0,
      ]),
    ),
    percentiles,
    by_agent: groupMetrics(sessions, "agent"),
    by_project: groupMetrics(sessions, "project"),
    outcomes,
  };
}

function recencyScore(session: SessionSummary): number {
  const timestamp = Date.parse(session.ended_at ?? session.started_at ?? "");
  if (!Number.isFinite(timestamp)) return 0;
  const ageDays = Math.max(0, (Date.now() - timestamp) / 86_400_000);
  return Math.max(0, 20 - Math.log2(ageDays + 1) * 4);
}

function metricScore(session: SessionSummary): number {
  return (
    numberValue(session, "tool_failure_signal_count") * 8 +
    numberValue(session, "tool_retry_count") * 3 +
    numberValue(session, "compaction_count") * 8 +
    numberValue(session, "edit_churn_count") * 4 +
    Math.log2(numberValue(session, "message_count") + 1) * 3 +
    Math.log2(numberValue(session, "peak_context_tokens") + 1) * 2 +
    (session.outcome && session.outcome !== "completed" && session.outcome !== "success" ? 12 : 0) +
    recencyScore(session)
  );
}

function addCandidate(
  map: Map<string, SessionCandidate>,
  session: SessionSummary,
  reason: string,
  bonus = 0,
) {
  const existing = map.get(session.id);
  if (existing) {
    if (!existing.selection_reasons.includes(reason)) existing.selection_reasons.push(reason);
    existing.score += bonus;
    return;
  }
  map.set(session.id, {
    ...session,
    score: metricScore(session) + bonus,
    selection_reasons: [reason],
  });
}

function topBy(
  sessions: SessionSummary[],
  value: (session: SessionSummary) => number,
  limit: number,
): SessionSummary[] {
  return [...sessions]
    .sort((a, b) => value(b) - value(a) || a.id.localeCompare(b.id))
    .slice(0, limit);
}

export function rankCandidates(sessions: SessionSummary[]): SessionCandidate[] {
  const selected = new Map<string, SessionCandidate>();
  const strata: Array<[string, (session: SessionSummary) => number, number]> = [
    ["tool failures", (s) => numberValue(s, "tool_failure_signal_count"), 18],
    ["retries", (s) => numberValue(s, "tool_retry_count"), 18],
    ["context pressure", (s) => numberValue(s, "peak_context_tokens"), 16],
    ["compactions", (s) => numberValue(s, "compaction_count"), 14],
    ["long sessions", (s) => numberValue(s, "message_count"), 16],
    ["edit churn", (s) => numberValue(s, "edit_churn_count"), 12],
    ["recent work", (s) => Date.parse(s.ended_at ?? s.started_at ?? "") || 0, 16],
    ["strong outcomes", (s) => (s.health_score ?? 0) + (s.outcome === "completed" ? 20 : 0), 14],
  ];
  for (const [reason, value, limit] of strata) {
    for (const session of topBy(sessions, value, limit)) addCandidate(selected, session, reason, 3);
  }

  for (const key of ["project", "agent"] as const) {
    const groups = new Map<string, SessionSummary[]>();
    for (const session of sessions) {
      const name = session[key] || "unknown";
      const group = groups.get(name) ?? [];
      group.push(session);
      groups.set(name, group);
    }
    const majorGroups = [...groups.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 12);
    for (const [name, group] of majorGroups) {
      for (const session of topBy(group, metricScore, 2)) {
        addCandidate(selected, session, `${key}: ${name}`, 5);
      }
    }
  }

  return [...selected.values()].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
