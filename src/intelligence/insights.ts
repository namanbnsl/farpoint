import type {
  DiscoveredInsight,
  EvidenceReference,
  SessionCandidate,
  SessionFinding,
} from "./types.ts";

type DiscoveryLens =
  | "correction-mining"
  | "success-outliers"
  | "matched-contrasts"
  | "temporal-change"
  | "cross-project-transfer"
  | "hidden-preferences"
  | "agent-task-fit"
  | "intervention-effects"
  | "abandoned-paths"
  | "productive-friction"
  | "project-health";

type DiscoveryCohort = {
  id: string;
  lenses: DiscoveryLens[];
  rationale: string;
  sessions: Array<{ metadata: SessionCandidate; finding: SessionFinding }>;
};
const SCORE_WEIGHTS = {
  surprise: 0.2,
  evidence_strength: 0.25,
  recurrence: 0.15,
  actionable_impact: 0.2,
  specificity: 0.2,
} as const;

const GENERIC_PATTERNS = [
  /\buse better prompts?\b/i,
  /\btest more\b/i,
  /\bbreak (?:the )?task(?:s)? down\b/i,
  /\bplan better\b/i,
  /\bbe more careful\b/i,
  /\bcommunicate (?:more|better|clearly)\b/i,
];

function outcomeBand(session: SessionCandidate): "strong" | "weak" | "mixed" {
  const outcome = session.outcome?.toLowerCase() ?? "";
  if (
    session.health_score !== undefined &&
    session.health_score >= 80 &&
    ["completed", "success"].includes(outcome)
  )
    return "strong";
  if (
    (session.health_score !== undefined && session.health_score < 60) ||
    ["failure", "failed", "abandoned"].includes(outcome)
  )
    return "weak";
  return "mixed";
}

function sizeBand(session: SessionCandidate): number {
  const messages = session.message_count ?? 0;
  if (messages < 30) return 0;
  if (messages < 100) return 1;
  if (messages < 250) return 2;
  return 3;
}

export function buildDiscoveryCohorts(
  candidates: SessionCandidate[],
  findings: SessionFinding[],
): DiscoveryCohort[] {
  const findingMap = new Map(findings.map((finding) => [finding.session_id, finding]));
  const usable = candidates.flatMap((metadata) => {
    const finding = findingMap.get(metadata.id);
    return finding ? [{ metadata, finding }] : [];
  });
  const cohorts: DiscoveryCohort[] = [];
  const byProjectAndSize = new Map<string, typeof usable>();
  for (const item of usable) {
    const key = `${item.metadata.project ?? "unknown"}:${sizeBand(item.metadata)}`;
    const group = byProjectAndSize.get(key) ?? [];
    group.push(item);
    byProjectAndSize.set(key, group);
  }
  for (const [key, group] of byProjectAndSize) {
    const strong = group.find((item) => outcomeBand(item.metadata) === "strong");
    const weak = group.find((item) => outcomeBand(item.metadata) === "weak");
    if (strong && weak)
      cohorts.push({
        id: `contrast:${key}`,
        lenses: ["matched-contrasts", "success-outliers", "productive-friction"],
        rationale: "Similar project and task-size sessions with materially different outcomes.",
        sessions: [strong, weak],
      });
  }
  const chronological = [...usable].sort(
    (a, b) => Date.parse(a.metadata.started_at ?? "") - Date.parse(b.metadata.started_at ?? ""),
  );
  if (chronological.length >= 6)
    cohorts.push({
      id: "temporal:first-last",
      lenses: ["temporal-change", "intervention-effects"],
      rationale:
        "Early and recent sessions reveal behavior changes and possible intervention effects.",
      sessions: [...chronological.slice(0, 4), ...chronological.slice(-4)],
    });
  const correctionRich = usable
    .filter(
      ({ finding }) =>
        finding.user_preferences.length > 0 ||
        finding.friction.some((item) => /correction|redo|discard|scope|preference/i.test(item)),
    )
    .slice(0, 12);
  if (correctionRich.length >= 3)
    cohorts.push({
      id: "corrections:cross-session",
      lenses: ["correction-mining", "hidden-preferences", "abandoned-paths"],
      rationale: "Repeated user corrections can expose latent preferences and discarded work.",
      sessions: correctionRich,
    });
  const byAgent = new Map<string, typeof usable>();
  for (const item of usable) {
    const agent = item.metadata.agent ?? "unknown";
    const group = byAgent.get(agent) ?? [];
    group.push(item);
    byAgent.set(agent, group);
  }
  if (byAgent.size >= 2)
    cohorts.push({
      id: "agents:comparative-fit",
      lenses: ["agent-task-fit", "cross-project-transfer"],
      rationale:
        "Cross-agent and cross-project differences may reveal task-specific fit and transferable tactics.",
      sessions: [...byAgent.values()].flatMap((group) => group.slice(0, 5)).slice(0, 15),
    });
  const byProject = new Map<string, typeof usable>();
  for (const item of usable) {
    const project = item.metadata.project ?? "unknown";
    const group = byProject.get(project) ?? [];
    group.push(item);
    byProject.set(project, group);
  }
  for (const [project, sessions] of byProject) {
    if (project === "unknown" || sessions.length < 3) continue;
    cohorts.push({
      id: `project:${project}`,
      lenses: ["project-health", "productive-friction", "abandoned-paths"],
      rationale: `Project-level patterns for ${project}, kept separate from user-wide behavior.`,
      sessions: sessions.slice(0, 12),
    });
  }
  return cohorts.slice(0, 12);
}

function clampScore(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(10, Math.max(0, value)) : 0;
}

export function scoreInsight(
  insight: Omit<DiscoveredInsight, "score" | "score_weights">,
): DiscoveredInsight {
  const components = insight.score_components;
  const score =
    clampScore(components.surprise) * SCORE_WEIGHTS.surprise +
    clampScore(components.evidence_strength) * SCORE_WEIGHTS.evidence_strength +
    clampScore(components.recurrence) * SCORE_WEIGHTS.recurrence +
    clampScore(components.actionable_impact) * SCORE_WEIGHTS.actionable_impact +
    clampScore(components.specificity) * SCORE_WEIGHTS.specificity;
  return { ...insight, score: Math.round(score * 100) / 100, score_weights: SCORE_WEIGHTS };
}

export function isUsefulInsight(insight: DiscoveredInsight): boolean {
  const combined = `${insight.title} ${insight.observation} ${insight.action}`;
  const generic = GENERIC_PATTERNS.some((pattern) => pattern.test(combined));
  const distinctSessions = new Set(insight.supporting_session_ids).size;
  const hasMetricEvidence = insight.metric_evidence.length > 0;
  const userLevel = insight.lenses.some((lens) =>
    ["hidden-preferences", "temporal-change", "agent-task-fit"].includes(lens),
  );
  return (
    !generic &&
    insight.score >= 5.5 &&
    (hasMetricEvidence || insight.evidence.length >= 2) &&
    (hasMetricEvidence || distinctSessions >= (userLevel ? 3 : 2)) &&
    insight.observation.length >= 40 &&
    insight.action.length >= 30 &&
    insight.contrast.length >= 20 &&
    insight.competing_explanation.length >= 15
  );
}

function metric(root: unknown, ...path: string[]): number | undefined {
  let value = root;
  for (const key of path) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function aggregateInsight(
  title: string,
  observation: string,
  metricEvidence: string[],
  action: string,
): DiscoveredInsight {
  return scoreInsight({
    title,
    observation: `${observation} Aggregate-only; support: 0 inspected sessions.`,
    why_it_matters:
      "This computed corpus pattern remains useful without qualitative session evidence.",
    contrast: "The comparison comes directly from the supplied aggregate metrics.",
    competing_explanation: "Archive coverage or metric classification may affect the value.",
    action,
    confidence: "high",
    confidence_score: 0.9,
    support_count: 0,
    expected_impact: "Keeps a measurable opportunity visible without inventing session evidence.",
    supporting_session_ids: [],
    metric_evidence: metricEvidence,
    evidence: [],
    evidence_basis: "aggregate",
    lenses: ["project-health"],
    score_components: {
      surprise: 7,
      evidence_strength: 10,
      recurrence: 8,
      actionable_impact: 8,
      specificity: 10,
    },
  });
}

/** Metric-only baselines must survive an empty or failed model discovery pass. */
export function buildBaselineAggregateInsights(
  stats: unknown,
  metrics: { by_agent: Record<string, Record<string, number>> },
): DiscoveredInsight[] {
  const insights: DiscoveredInsight[] = [];
  const skills = metric(stats, "adoption", "distinct_skills");
  if (skills !== undefined)
    insights.push(
      aggregateInsight(
        skills === 0
          ? "No agent skills are currently adopted"
          : "Agent skills have an established baseline",
        `The archive reports ${skills} distinct adopted skills.`,
        [`agentsview_stats.adoption.distinct_skills = ${skills}`],
        skills === 0
          ? "Pilot one narrowly scoped provisional skill and measure its effect."
          : "Audit skill coverage before adding overlapping instructions.",
      ),
    );
  const agent = metrics.by_agent["antigravity-cli"];
  const retries = metric(agent, "retries");
  const sessions = metric(agent, "sessions");
  const failures = metric(agent, "failures") ?? 0;
  if (retries !== undefined && sessions !== undefined && retries > 0)
    insights.push(
      aggregateInsight(
        "antigravity-cli has an unusually high retry rate",
        `antigravity-cli recorded ${retries} retries across ${sessions} sessions, alongside ${failures} failures.`,
        [
          `farpoint_metrics.by_agent.antigravity-cli.sessions = ${sessions}`,
          `farpoint_metrics.by_agent.antigravity-cli.retries = ${retries}`,
          `farpoint_metrics.by_agent.antigravity-cli.failures = ${failures}`,
        ],
        "Inspect retry taxonomy and a small session sample before attributing a cause.",
      ),
    );
  const quick = metric(stats, "archetypes", "quick");
  const deep = metric(stats, "archetypes", "deep");
  if (quick !== undefined && deep !== undefined && quick > deep)
    insights.push(
      aggregateInsight(
        "Most sessions are short, quick interactions",
        `The archive contains ${quick} quick sessions versus ${deep} deep sessions.`,
        [
          `agentsview_stats.archetypes.quick = ${quick}`,
          `agentsview_stats.archetypes.deep = ${deep}`,
        ],
        "Sample both quick and deep cohorts when comparing behavior.",
      ),
    );
  const saved = metric(stats, "cache_economics", "dollars_saved_vs_uncached");
  const spent = metric(stats, "cache_economics", "dollars_spent");
  if (saved !== undefined && spent !== undefined && saved > 0)
    insights.push(
      aggregateInsight(
        "Prompt caching is producing measurable savings",
        `Estimated cache savings are USD ${saved.toFixed(2)} against USD ${spent.toFixed(2)} spent.`,
        [
          `agentsview_stats.cache_economics.dollars_saved_vs_uncached = ${saved}`,
          `agentsview_stats.cache_economics.dollars_spent = ${spent}`,
        ],
        "Preserve cache-friendly prompt structure and monitor these metrics over time.",
      ),
    );
  return insights;
}

export function reconcileInsightEvidence(
  evidence: EvidenceReference[],
  validEvidence: EvidenceReference[],
): EvidenceReference[] {
  const index = new Map(
    validEvidence.map((item) => [`${item.session_id}:${item.ordinal_start}`, item]),
  );
  return evidence.flatMap((item) => {
    const source = index.get(`${item.session_id}:${item.ordinal_start}`);
    return source ? [source] : [];
  });
}
