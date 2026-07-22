import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { runAgentsView, syncAgentsView } from "../agentsview/runner";
import { computeMetrics, paginateSessions, rankCandidates, selectCorpus } from "./corpus";
import {
  buildBaselineAggregateInsights,
  buildDiscoveryCohorts,
  isUsefulInsight,
  reconcileInsightEvidence,
  scoreInsight,
} from "./insights.ts";
import type {
  AnalysisReport,
  DiscoveredInsight,
  EvidenceReference,
  ProgressUpdate,
  SessionCandidate,
  SessionFinding,
} from "./types";

type AnalyzeText = (systemPrompt: string, prompt: string) => Promise<string>;
type Message = { ordinal?: number; role?: string; content?: string };
type MessagePage = { messages?: Message[] };

const TRIAGE_BATCH_SIZE = 10;
const INITIAL_CANDIDATES = 50;
const DEEP_INSPECTION_LIMIT = 18;
const MAX_WORKERS = 3;
const MAX_EXCERPT = 500;
const MAX_PROMPT_CHARS = 70_000;

const TRIAGE_SYSTEM_PROMPT = `You are a bounded coding-session evidence analyst.
Return JSON only: {"findings":[SessionFinding,...]}.
Each SessionFinding must contain session_id, title, project, agent, outcome_assessment,
task_type (debug|feature|refactor|test|config|other), prompting_pattern
(specific|vague|mixed|unknown), friction[], recurring_mistakes[], strengths[], user_preferences[], themes[], advice[], confidence
("low"|"medium"|"high"), and evidence[].
Each evidence item must contain session_id, title, project, agent, ordinal_start,
ordinal_end, excerpt, and signal_type. Use only supplied messages. Keep excerpts under
500 characters and preserve exact message ordinals. Do not infer a user-wide pattern.`;

const DEEP_SYSTEM_PROMPT = `You are a forensic coding-session analyst. Return one JSON
SessionFinding only, using the supplied targeted transcript windows and metadata.
Every qualitative conclusion must cite an exact supplied ordinal and bounded excerpt.
Separate observed behavior from hypotheses. Give concrete session-level advice.`;

const DISCOVERY_SYSTEM_PROMPT = `You are an investigative researcher of coding-agent behavior.
Return JSON only: {"insights":[...]}. Hunt for non-obvious, useful findings through the assigned lenses.
Each insight requires: title, observation, why_it_matters, contrast, competing_explanation,
action, confidence, expected_impact, supporting_session_ids, evidence, lenses, and
score_components with 0-10 surprise, evidence_strength, recurrence, actionable_impact,
and specificity. Reject generic advice. Never claim a repeated user pattern from fewer
than three sessions. Use only supplied evidence references.`;
const AGGREGATE_SYSTEM_PROMPT = `You analyze authoritative computed metrics, not transcripts.
Return JSON only: {"insights":[...]}, using the same insight schema as the qualitative pass.
Find material anomalies, ratios, outliers, agent differences, temporal patterns, context pressure,
and project-level patterns. Return two to five high-value findings. Every claim must include
metric_evidence[] containing exact JSON paths and values from the supplied packet. These are
aggregate-only insights: set evidence to [] and supporting_session_ids to []. Never borrow a
session excerpt merely to make an aggregate claim look cited. Describe correlations, not invented
causes. Use tentative language for causes and include a competing explanation only when one is
material.`;

const SYNTHESIS_SYSTEM_PROMPT = `You are Farpoint, a precise coding-agent improvement
analyst. Return JSON only matching the requested schema. Numerical metrics are
authoritative. Every qualitative claim must state its support count in the claim itself.
Only call something a repeated user pattern when at least three distinct session ids support
it; otherwise label it session-specific or tentative. Never write "the user is", "always",
or equivalent universal language from a sample. Do not invent evidence, prices, costs, or
causes. Build the user profile from the supplied session findings and cite the exact supporting
session ids for every profile claim. Write at least one skill recommendation when a prompting
pattern or recurring mistake can be converted into a useful agent rule. A skill may be provisional
with one supporting session when it is explicitly marked provisional and narrowly scoped; otherwise
it needs two supporting sessions. Skill rules must be verbatim agent-executable instructions
beginning with Before, When, Always, Never, After, or If. A zero existing-skill count is an
opportunity, never a reason to suppress skill generation. Keep report_markdown concise and include
separate aggregate and project insight sections.`;

const SKILL_SYSTEM_PROMPT = `You design one narrow, reusable coding-agent skill from supplied
session findings. Return JSON only with a recommendation object containing title, action, kind,
source_category, supporting_session_ids, provisional, and rule. kind must be skill. Use only a
prompting-pattern or recurring-mistake visible in the packet. The rule must begin with Before,
When, Always, Never, After, or If. Use exact session ids. Mark it provisional when only one
session supports it.`;

const PROFILE_SYSTEM_PROMPT = `You infer a bounded user profile from supplied session findings.
Return JSON only with user_profile buckets: repeated_preferences, working_style,
recurring_corrections, strengths, and failure_modes. Each bucket contains claim and
supporting_session_ids. Use exact supplied ids. Do not generalize beyond the evidence; a claim
with fewer than three supporting sessions is tentative, not repeated.`;

const MATCH_STOP_WORDS = new Set([
  "about",
  "across",
  "adopted",
  "agent",
  "archive",
  "could",
  "distinct",
  "from",
  "have",
  "insight",
  "metric",
  "project",
  "recorded",
  "reports",
  "session",
  "sessions",
  "that",
  "their",
  "these",
  "this",
  "with",
]);

function matchTerms(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .match(/[a-z0-9][a-z0-9_-]*/g)
      ?.map((term) => term.replace(/ies$/, "y").replace(/ing$/, "").replace(/s$/, ""))
      .filter((term) => term.length >= 4 && !MATCH_STOP_WORDS.has(term)) ?? [],
  );
}

function sharesTerm(left: Set<string>, right: Set<string>): boolean {
  return [...left].some((term) => right.has(term));
}

function matchingAggregateSubjects(
  insight: DiscoveredInsight,
  findings: SessionFinding[],
): { kind: "agent" | "project"; value: string }[] {
  const narrative = `${insight.title} ${insight.observation}`.toLowerCase();
  const metrics = insight.metric_evidence.join(" ").toLowerCase();
  const values = (kind: "agent" | "project") => [
    ...new Set(
      findings
        .map((finding) => finding[kind])
        .filter(
          (value) =>
            value !== "unknown" &&
            (narrative.includes(value.toLowerCase()) ||
              metrics.includes(`.by_${kind}.${value.toLowerCase()}.`)),
        ),
    ),
  ];
  const agents = values("agent");
  return (agents.length > 0 ? agents : values("project")).map((value) => ({
    kind: agents.length > 0 ? "agent" : "project",
    value,
  }));
}

/** Conservatively fuse qualitative support only when subject, finding, and excerpt all match. */
function linkAggregateSessionEvidence(
  insights: DiscoveredInsight[],
  findings: SessionFinding[],
): DiscoveredInsight[] {
  return insights.map((insight) => {
    if (insight.evidence_basis !== "aggregate") return insight;
    const insightText = [
      insight.title,
      insight.observation,
      insight.action,
      ...insight.metric_evidence,
    ].join(" ");
    const subjects = matchingAggregateSubjects(insight, findings);
    if (subjects.length === 0) return insight;

    const phenomenon = matchTerms(insightText);
    for (const subject of subjects) {
      for (const term of matchTerms(subject.value)) phenomenon.delete(term);
    }
    const qualifying = findings.flatMap((finding) => {
      if (!subjects.some(({ kind, value }) => finding[kind] === value)) return [];
      const findingTerms = matchTerms(
        [finding.outcome_assessment, ...finding.friction, ...finding.advice].join(" "),
      );
      if (!sharesTerm(phenomenon, findingTerms)) return [];
      const evidence = finding.evidence.filter(
        (item) =>
          item.agent === finding.agent &&
          item.project === finding.project &&
          sharesTerm(phenomenon, matchTerms(item.excerpt)),
      );
      return evidence.length > 0 ? [{ finding, evidence }] : [];
    });
    if (qualifying.length === 0) return insight;

    const supportingSessionIds = [...new Set(qualifying.map(({ finding }) => finding.session_id))];
    return {
      ...insight,
      observation: insight.observation.replace(
        /Aggregate-only; support: 0 inspected sessions\./,
        `Aggregate plus session evidence; support: ${supportingSessionIds.length} inspected ${supportingSessionIds.length === 1 ? "session" : "sessions"}.`,
      ),
      why_it_matters: insight.why_it_matters.replace(
        /without qualitative session evidence/i,
        "with matching qualitative session evidence",
      ),
      support_count: supportingSessionIds.length,
      supporting_session_ids: supportingSessionIds,
      evidence: qualifying.flatMap(({ evidence }) => evidence),
      evidence_basis: "aggregate+session",
    };
  });
}

function alignSkillAdoptionAction(
  insights: DiscoveredInsight[],
  recommendations: AnalysisReport["recommendations"],
): DiscoveredInsight[] {
  const shippedSkill = recommendations.find(
    (recommendation) => recommendation.kind === "skill" && recommendation.provisional === false,
  );
  if (!shippedSkill) return insights;
  return insights.map((insight) =>
    insight.metric_evidence.some((metric) =>
      /agentsview_stats\.adoption\.distinct_skills\s*=\s*0\b/i.test(metric),
    )
      ? {
          ...insight,
          action: `Track whether the '${shippedSkill.title}' skill raises distinct_skills above 0 in the next report.`,
        }
      : insight,
  );
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    if (fenced) return JSON.parse(fenced);
    const start = Math.min(
      ...[trimmed.indexOf("{"), trimmed.indexOf("[")].filter((index) => index >= 0),
    );
    if (!Number.isFinite(start)) throw new Error("Analyst returned no JSON.");
    const end = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
    if (end < start) throw new Error("Analyst returned incomplete JSON.");
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}

function compactAggregateStats(value: unknown): Record<string, unknown> {
  const stats = asRecord(value);
  if (!stats) return {};
  const keys = [
    "schema_version",
    "window",
    "totals",
    "distributions",
    "archetypes",
    "velocity",
    "tool_mix",
    "agent_portfolio",
    "model_mix",
    "cache_economics",
    "adoption",
    "outcomes",
  ];
  return Object.fromEntries(
    keys.flatMap((key) => (stats[key] === undefined ? [] : [[key, stats[key]]])),
  );
}

function cleanMessageContent(content: string | undefined): string {
  if (!content) return "";
  return content
    .replace(/^\[Message\]\s+(?:\w+=\S+\s+)*content=/, "")
    .replace(/^content=/, "")
    .trim();
}

function cleanGeneratedText(text: string): string {
  return text.replace(/''/g, "'").trim();
}

function stringList(value: unknown, limit = 12): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map(cleanGeneratedText)
        .slice(0, limit)
    : [];
}

function bounded(text: string | undefined, limit: number): string {
  if (!text) return "";
  return text.length <= limit ? text : `${text.slice(0, limit)}...`;
}

async function analyzeRecord(
  analyze: AnalyzeText,
  systemPrompt: string,
  prompt: string,
): Promise<Record<string, unknown> | undefined> {
  return asRecord(extractJson(await analyze(systemPrompt, bounded(prompt, MAX_PROMPT_CHARS))));
}

function candidateMetadata(candidate: SessionCandidate) {
  return {
    id: candidate.id,
    title: candidate.display_name ?? "",
    project: candidate.project ?? "unknown",
    agent: candidate.agent ?? "unknown",
    started_at: candidate.started_at,
    ended_at: candidate.ended_at,
    outcome: candidate.outcome,
    health_score: candidate.health_score,
    message_count: candidate.message_count,
    user_message_count: candidate.user_message_count,
    total_output_tokens: candidate.total_output_tokens,
    peak_context_tokens: candidate.peak_context_tokens,
    tool_failures: candidate.tool_failure_signal_count,
    retries: candidate.tool_retry_count,
    edit_churn: candidate.edit_churn_count,
    compactions: candidate.compaction_count,
    selection_reasons: candidate.selection_reasons,
  };
}

async function fetchMessages(args: string[]): Promise<Message[]> {
  const result = (await runAgentsView(args)) as MessagePage;
  return Array.isArray(result.messages) ? result.messages : [];
}

function compactMessages(messages: Message[]): Message[] {
  const seen = new Set<number>();
  return messages
    .filter((message) => {
      if (typeof message.ordinal !== "number" || seen.has(message.ordinal)) return false;
      seen.add(message.ordinal);
      return true;
    })
    .sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0))
    .map((message) => ({
      ordinal: message.ordinal,
      role: message.role,
      content: bounded(cleanMessageContent(message.content), 320),
    }));
}

async function buildTriagePacket(candidate: SessionCandidate) {
  const [opening, recent, userMessages, toolCalls, health] = await Promise.all([
    fetchMessages(["session", "messages", candidate.id, "--from", "0", "--limit", "3", "--json"]),
    fetchMessages([
      "session",
      "messages",
      candidate.id,
      "--direction",
      "desc",
      "--limit",
      "7",
      "--json",
    ]),
    fetchMessages([
      "session",
      "messages",
      candidate.id,
      "--role",
      "user",
      "--direction",
      "desc",
      "--limit",
      "20",
      "--json",
    ]),
    runAgentsView(["session", "tool-calls", candidate.id, "--json"]),
    runAgentsView(["health", candidate.id, "--json"]),
  ]);
  return {
    metadata: candidateMetadata(candidate),
    messages: compactMessages([...opening, ...userMessages, ...recent]),
    tool_calls: JSON.stringify(toolCalls).slice(0, 1_000),
    health: JSON.stringify(health).slice(0, 800),
  };
}

function isEvidence(value: unknown, sessionIds: Set<string>): value is EvidenceReference {
  const item = asRecord(value);
  return Boolean(
    item &&
    typeof item.session_id === "string" &&
    sessionIds.has(item.session_id) &&
    typeof item.ordinal_start === "number" &&
    typeof item.ordinal_end === "number" &&
    typeof item.excerpt === "string" &&
    item.excerpt.length <= MAX_EXCERPT,
  );
}

function normalizeFinding(
  value: unknown,
  candidates: Map<string, SessionCandidate>,
): SessionFinding | undefined {
  const item = asRecord(value);
  const sessionId = typeof item?.session_id === "string" ? item.session_id : "";
  const candidate = candidates.get(sessionId);
  if (!candidate || !item) return undefined;
  const validIds = new Set([sessionId]);
  const evidence = Array.isArray(item.evidence)
    ? item.evidence.filter((entry) => isEvidence(entry, validIds)).slice(0, 12)
    : [];
  return {
    session_id: sessionId,
    title: candidate.display_name ?? sessionId,
    project: candidate.project ?? "unknown",
    agent: candidate.agent ?? "unknown",
    outcome_assessment:
      typeof item.outcome_assessment === "string"
        ? bounded(item.outcome_assessment, 800)
        : "Unclear",
    task_type:
      item.task_type === "debug" ||
      item.task_type === "feature" ||
      item.task_type === "refactor" ||
      item.task_type === "test" ||
      item.task_type === "config"
        ? item.task_type
        : "other",
    prompting_pattern:
      item.prompting_pattern === "specific" ||
      item.prompting_pattern === "vague" ||
      item.prompting_pattern === "mixed"
        ? item.prompting_pattern
        : "unknown",
    friction: stringList(item.friction),
    recurring_mistakes: stringList(item.recurring_mistakes),
    strengths: stringList(item.strengths),
    user_preferences: stringList(item.user_preferences),
    themes: stringList(item.themes),
    advice: stringList(item.advice),
    confidence: "low",
    confidence_score: 0,
    evidence,
  };
}

function calibrateFinding(finding: SessionFinding): SessionFinding {
  const evidenceCount = finding.evidence.length;
  if (evidenceCount === 0) {
    return {
      ...finding,
      outcome_assessment: "Unclear",
      friction: [],
      recurring_mistakes: [],
      strengths: [],
      user_preferences: [],
      themes: [],
      advice: [],
      confidence: "low",
      confidence_score: 0,
    };
  }
  const substantiveFields = [
    finding.outcome_assessment !== "Unclear",
    finding.friction.length > 0,
    finding.recurring_mistakes.length > 0,
    finding.strengths.length > 0,
    finding.user_preferences.length > 0,
    finding.themes.length > 0,
    finding.advice.length > 0,
  ].filter(Boolean).length;
  const score = Math.min(1, evidenceCount * 0.2 + substantiveFields * 0.04);
  return {
    ...finding,
    confidence_score: Math.round(score * 100) / 100,
    confidence: score >= 0.7 ? "high" : score >= 0.35 ? "medium" : "low",
  };
}

function reconcileEvidence(
  finding: SessionFinding,
  packet: { messages: Message[] } | undefined,
): SessionFinding {
  if (!packet) return calibrateFinding({ ...finding, evidence: [] });
  const messages = new Map(
    packet.messages.flatMap((message) =>
      typeof message.ordinal === "number" ? [[message.ordinal, message] as const] : [],
    ),
  );
  const evidence = finding.evidence.flatMap((item) => {
    const source = messages.get(item.ordinal_start);
    if (!source?.content) return [];
    return [
      {
        ...item,
        ordinal_end: messages.has(item.ordinal_end) ? item.ordinal_end : item.ordinal_start,
        excerpt: bounded(source.content, MAX_EXCERPT),
      },
    ];
  });
  return calibrateFinding({ ...finding, evidence });
}
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        const item = items[index];
        if (item !== undefined) results[index] = await worker(item, index);
      }
    }),
  );
  return results;
}

async function triageCandidates(
  candidates: SessionCandidate[],
  analyze: AnalyzeText,
): Promise<SessionFinding[]> {
  const candidateMap = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const packets = await mapLimit(candidates, MAX_WORKERS, buildTriagePacket);
  const batches: (typeof packets)[] = [];
  for (let index = 0; index < packets.length; index += TRIAGE_BATCH_SIZE) {
    batches.push(packets.slice(index, index + TRIAGE_BATCH_SIZE));
  }
  const packetMap = new Map(packets.map((packet) => [packet.metadata.id, packet]));
  const results = await mapLimit(batches, MAX_WORKERS, async (batch) => {
    const prompt = bounded(
      `Analyze these independent sessions:\n${JSON.stringify(batch)}`,
      MAX_PROMPT_CHARS,
    );
    try {
      const parsed = await analyzeRecord(analyze, TRIAGE_SYSTEM_PROMPT, prompt);
      const findings = Array.isArray(parsed?.findings) ? parsed.findings : [];
      return findings
        .map((finding) => normalizeFinding(finding, candidateMap))
        .filter((finding): finding is SessionFinding => Boolean(finding))
        .map((finding) => reconcileEvidence(finding, packetMap.get(finding.session_id)));
    } catch {
      return [];
    }
  });
  return results.flat();
}

function findingPriority(finding: SessionFinding, candidate: SessionCandidate): number {
  return (
    candidate.score +
    finding.evidence.length * 8 +
    finding.friction.length * 4 +
    finding.user_preferences.length * 3 +
    (finding.confidence === "high" ? 8 : finding.confidence === "medium" ? 3 : 0)
  );
}

async function buildDeepPacket(candidate: SessionCandidate, finding: SessionFinding) {
  const ordinals = [...new Set(finding.evidence.map((item) => item.ordinal_start))].slice(0, 6);
  const windows = await Promise.all(
    ordinals.map((ordinal) =>
      fetchMessages([
        "session",
        "messages",
        candidate.id,
        "--around",
        String(ordinal),
        "--before",
        "3",
        "--after",
        "3",
        "--json",
      ]),
    ),
  );
  const [opening, ending, overview, usage, health, toolCalls] = await Promise.all([
    fetchMessages(["session", "messages", candidate.id, "--from", "0", "--limit", "3", "--json"]),
    fetchMessages([
      "session",
      "messages",
      candidate.id,
      "--direction",
      "desc",
      "--limit",
      "8",
      "--json",
    ]),
    runAgentsView(["session", "get", candidate.id, "--format", "json"]),
    runAgentsView(["session", "usage", candidate.id, "--format", "json"]),
    runAgentsView(["health", candidate.id, "--json"]),
    runAgentsView(["session", "tool-calls", candidate.id, "--json"]),
  ]);
  return {
    metadata: candidateMetadata(candidate),
    triage_finding: finding,
    messages: compactMessages([...opening, ...windows.flat(), ...ending]),
    overview: JSON.stringify(overview).slice(0, 5_000),
    usage: JSON.stringify(usage).slice(0, 3_000),
    health: JSON.stringify(health).slice(0, 800),
    tool_calls: JSON.stringify(toolCalls).slice(0, 8_000),
  };
}

async function inspectDeeply(
  triage: SessionFinding[],
  candidateMap: Map<string, SessionCandidate>,
  analyze: AnalyzeText,
  onProgress: (update: ProgressUpdate) => void,
): Promise<SessionFinding[]> {
  const ranked = triage
    .filter((finding) => candidateMap.has(finding.session_id))
    .sort(
      (a, b) =>
        findingPriority(b, candidateMap.get(b.session_id)!) -
        findingPriority(a, candidateMap.get(a.session_id)!),
    )
    .slice(0, DEEP_INSPECTION_LIMIT);
  const deep: SessionFinding[] = [];

  for (let index = 0; index < ranked.length; index += MAX_WORKERS) {
    const batch = ranked.slice(index, index + MAX_WORKERS);
    const results = await mapLimit(batch, MAX_WORKERS, async (finding) => {
      const candidate = candidateMap.get(finding.session_id)!;
      try {
        const packet = await buildDeepPacket(candidate, finding);
        const text = await analyze(
          DEEP_SYSTEM_PROMPT,
          bounded(`Deeply inspect this session:\n${JSON.stringify(packet)}`, MAX_PROMPT_CHARS),
        );
        const normalized =
          normalizeFinding(extractJson(text), new Map([[candidate.id, candidate]])) ?? finding;
        return reconcileEvidence(normalized, packet);
      } catch {
        return finding;
      }
    });
    deep.push(...results);
    onProgress({
      stage: "inspecting",
      label: `Inspecting evidence · ${deep.length}/${ranked.length} sessions`,
    });
  }
  return deep;
}

function normalizeInsight(
  value: unknown,
  validEvidence: EvidenceReference[],
  validSessionIds: Set<string>,
  source: "session" | "aggregate",
): DiscoveredInsight | undefined {
  const item = asRecord(value);
  if (!item) return undefined;
  const text = (key: string) =>
    typeof item[key] === "string" ? bounded(cleanGeneratedText(item[key] as string), 1_200) : "";
  const components = asRecord(item.score_components);
  const evidence =
    source === "session" && Array.isArray(item.evidence)
      ? reconcileInsightEvidence(
          item.evidence.filter((entry): entry is EvidenceReference => Boolean(asRecord(entry))),
          validEvidence,
        )
      : [];
  const supporting =
    source === "session"
      ? stringList(item.supporting_session_ids).filter((id) => validSessionIds.has(id))
      : [];
  const metricEvidence = source === "aggregate" ? stringList(item.metric_evidence) : [];
  const unresolvedAggregateCause =
    metricEvidence.length > 0 &&
    /\b(?:may|might|could|unknown|incomplete|outside|without)\b/i.test(
      text("competing_explanation"),
    );
  const rawConfidence =
    metricEvidence.length > 0
      ? 0.62 + Math.min(2, metricEvidence.length) * 0.1
      : evidence.length * 0.18 + supporting.length * 0.08;
  const confidenceScore = Math.min(unresolvedAggregateCause ? 0.74 : 0.92, rawConfidence);
  const supportCount = new Set(supporting).size;
  const confidence =
    source === "session"
      ? supportCount >= 3 && confidenceScore >= 0.8
        ? "high"
        : "tentative"
      : confidenceScore >= 0.8
        ? "high"
        : confidenceScore >= 0.5
          ? "medium"
          : "low";
  const observation = text("observation");
  return scoreInsight({
    title: text("title"),
    observation:
      source === "session" && !/support:\s*\d+\s+sessions?/i.test(observation)
        ? `${observation} Support: ${supportCount} ${supportCount === 1 ? "session" : "sessions"}; ${supportCount >= 3 ? "high confidence" : "tentative"}.`
        : observation,
    why_it_matters: text("why_it_matters"),
    contrast: text("contrast"),
    competing_explanation: text("competing_explanation"),
    action: text("action"),
    confidence,
    confidence_score: Math.round(confidenceScore * 100) / 100,
    support_count: supportCount,
    expected_impact: text("expected_impact"),
    supporting_session_ids: supporting,
    metric_evidence: metricEvidence,
    evidence,
    evidence_basis: source,
    lenses: stringList(item.lenses),
    score_components: {
      surprise: typeof components?.surprise === "number" ? components.surprise : 0,
      evidence_strength:
        typeof components?.evidence_strength === "number" ? components.evidence_strength : 0,
      recurrence:
        typeof components?.recurrence === "number"
          ? metricEvidence.length > 0
            ? components.recurrence
            : Math.min(components.recurrence, supporting.length * 2)
          : 0,
      actionable_impact:
        typeof components?.actionable_impact === "number" ? components.actionable_impact : 0,
      specificity: typeof components?.specificity === "number" ? components.specificity : 0,
    },
  });
}

async function discoverInsights(
  candidates: SessionCandidate[],
  findings: SessionFinding[],
  agentsViewStats: unknown,
  projects: unknown,
  metrics: AnalysisReport["metrics"],
  analyze: AnalyzeText,
): Promise<DiscoveredInsight[]> {
  const cohorts = buildDiscoveryCohorts(candidates, findings);
  const results = await mapLimit(cohorts, MAX_WORKERS, async (cohort) => {
    const validEvidence = cohort.sessions.flatMap(({ finding }) => finding.evidence);
    const validSessionIds = new Set(cohort.sessions.map(({ metadata }) => metadata.id));
    const packet = {
      cohort_id: cohort.id,
      lenses: cohort.lenses,
      rationale: cohort.rationale,
      sessions: cohort.sessions.map(({ metadata, finding }) => ({
        metadata: candidateMetadata(metadata),
        finding,
      })),
    };
    try {
      const response = await analyzeRecord(
        analyze,
        DISCOVERY_SYSTEM_PROMPT,
        `Investigate this cohort:\n${JSON.stringify(packet)}`,
      );
      const insights = Array.isArray(response?.insights) ? response.insights : [];
      return insights
        .map((insight) => normalizeInsight(insight, validEvidence, validSessionIds, "session"))
        .filter((insight): insight is DiscoveredInsight => Boolean(insight))
        .filter(isUsefulInsight);
    } catch {
      return [];
    }
  });
  const bestByTitle = new Map<string, DiscoveredInsight>();
  let aggregateInsights = buildBaselineAggregateInsights(agentsViewStats, metrics);
  try {
    const response = await analyzeRecord(
      analyze,
      AGGREGATE_SYSTEM_PROMPT,
      `Analyze these computed aggregates:\n${JSON.stringify({ agentsview_stats: compactAggregateStats(agentsViewStats), projects, farpoint_metrics: metrics })}`,
    );
    const generatedAggregateInsights = (Array.isArray(response?.insights) ? response.insights : [])
      .map((insight) => normalizeInsight(insight, [], new Set(), "aggregate"))
      .filter((insight): insight is DiscoveredInsight => Boolean(insight))
      .filter(
        (insight) => insight.evidence_basis === "aggregate" && insight.metric_evidence.length > 0,
      )
      .filter(isUsefulInsight);
    aggregateInsights = [...aggregateInsights, ...generatedAggregateInsights];
  } catch {
    // Deterministic aggregate-only insights remain valid when the optional model pass fails.
  }
  for (const insight of [...aggregateInsights, ...results.flat()]) {
    const key = insight.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    const existing = bestByTitle.get(key);
    if (!existing || insight.score > existing.score) bestByTitle.set(key, insight);
  }
  return linkAggregateSessionEvidence(
    [...bestByTitle.values()].sort((a, b) => b.score - a.score).slice(0, 12),
    findings,
  );
}
function fallbackMarkdown(report: Omit<AnalysisReport, "report_markdown">): string {
  const findings = report.session_findings.slice(0, 8);
  return [
    "# Farpoint report",
    "",
    `Analyzed ${report.coverage.eligible} substantive sessions, triaged ${report.coverage.triaged}, and deeply inspected ${report.coverage.deeply_inspected}.`,
    "",
    "## Revealing sessions",
    "",
    ...findings.map(
      (finding) =>
        `- **${finding.title}** (${finding.project}): ${finding.outcome_assessment} ${finding.advice[0] ?? ""}`,
    ),
    "",
    "_The final synthesis response was unavailable; the structured evidence is preserved in analysis.json._",
  ].join("\n");
}

function cleanProfileClaim(text: string): string {
  return bounded(cleanGeneratedText(text), 800).replace(
    /\((\d+) sessions?: ([^)]+)\)/gi,
    (label, count: string, names: string) => {
      const projects = [...new Set(names.split(",").map((name) => name.trim()))];
      return projects.length < names.split(",").length
        ? `(${count} sessions across ${projects.join(", ")})`
        : label;
    },
  );
}

function buildUserProfile(
  value: unknown,
  validSessionIds: Set<string>,
): AnalysisReport["user_profile"] {
  const root = asRecord(value);
  const claims = (entries: unknown): AnalysisReport["user_profile"]["working_style"] =>
    Array.isArray(entries)
      ? entries.flatMap((entry) => {
          const item = asRecord(entry);
          if (typeof item?.claim !== "string") return [];
          const supporting = [
            ...new Set(
              stringList(item.supporting_session_ids).filter((id) => validSessionIds.has(id)),
            ),
          ];
          if (supporting.length < 2) return [];
          return [
            {
              claim: cleanProfileClaim(item.claim),
              supporting_session_ids: supporting,
              support_tier: supporting.length >= 3 ? ("repeated" as const) : ("tentative" as const),
            },
          ];
        })
      : [];
  return {
    repeated_preferences: claims(root?.repeated_preferences),
    working_style: claims(root?.working_style),
    recurring_corrections: claims(root?.recurring_corrections),
    strengths: claims(root?.strengths),
    failure_modes: claims(root?.failure_modes),
  };
}

function normalizeRecommendation(
  value: unknown,
  validSessionIds: Set<string>,
  forcedKind?: "skill",
): AnalysisReport["recommendations"][number] | undefined {
  const item = asRecord(value);
  if (typeof item?.title !== "string" || typeof item.action !== "string") return undefined;

  const kind =
    forcedKind ??
    (item.kind === "instruction" ||
    item.kind === "skill" ||
    item.kind === "tooling" ||
    item.kind === "prompting"
      ? item.kind
      : "workflow");
  const supporting = stringList(item.supporting_session_ids).filter((id) =>
    validSessionIds.has(id),
  );
  const rule = typeof item.rule === "string" ? bounded(item.rule.trim(), 800) : "";
  const provisional = item.provisional === true;
  const validSkill =
    (item.source_category === "prompting-pattern" ||
      item.source_category === "recurring-mistake") &&
    supporting.length >= (provisional ? 1 : 2) &&
    rule.length >= 30 &&
    /^(before|when|always|never|after|if)\b/i.test(rule);
  if (kind === "skill" && !validSkill) return undefined;

  return {
    title: cleanGeneratedText(item.title),
    action: cleanGeneratedText(item.action),
    kind,
    supporting_session_ids: supporting,
    ...(kind === "skill" ? { provisional } : {}),
    ...(rule ? { rule: cleanGeneratedText(rule) } : {}),
  };
}

async function synthesize(
  base: Omit<
    AnalysisReport,
    "user_profile" | "recommendations" | "limitations" | "report_markdown"
  >,
  analyze: AnalyzeText,
): Promise<AnalysisReport> {
  const requested = {
    schema_version: 1,
    user_profile: {
      repeated_preferences: [{ claim: "string", supporting_session_ids: ["string"] }],
      working_style: [{ claim: "string", supporting_session_ids: ["string"] }],
      recurring_corrections: [{ claim: "string", supporting_session_ids: ["string"] }],
      strengths: [{ claim: "string", supporting_session_ids: ["string"] }],
      failure_modes: [{ claim: "string", supporting_session_ids: ["string"] }],
    },
    recommendations: [
      {
        title: "string",
        action: "string",
        kind: "instruction|skill|tooling|prompting|workflow",
        supporting_session_ids: ["string"],
        source_category: "prompting-pattern|recurring-mistake|other",
        provisional: false,
        rule: "A verbatim rule beginning with Before, When, Always, Never, After, or If",
      },
    ],
    limitations: ["string"],
    report_markdown: "string",
  };
  const validSessionIds = new Set(base.session_findings.map((finding) => finding.session_id));
  const synthesisPacket = {
    claim_policy: {
      inspected_sessions: base.coverage.deeply_inspected,
      eligible_sessions: base.coverage.eligible,
      inspected_share:
        base.coverage.eligible > 0 ? base.coverage.deeply_inspected / base.coverage.eligible : 0,
    },
    agentsview_stats: compactAggregateStats(base.agentsview_stats),
    projects: base.projects,
    data_scopes: base.data_scopes,

    coverage: base.coverage,
    discovered_insights: base.discovered_insights,
    metrics: base.metrics,
    session_findings: base.session_findings.map((finding) => ({
      session_id: finding.session_id,
      title: finding.title,
      project: finding.project,
      agent: finding.agent,
      outcome_assessment: finding.outcome_assessment,
      friction: finding.friction.slice(0, 4),
      task_type: finding.task_type,
      prompting_pattern: finding.prompting_pattern,
      recurring_mistakes: finding.recurring_mistakes.slice(0, 4),

      strengths: finding.strengths.slice(0, 4),
      user_preferences: finding.user_preferences.slice(0, 4),
      themes: finding.themes.slice(0, 4),
      advice: finding.advice.slice(0, 3),
      confidence: finding.confidence,
      confidence_score: finding.confidence_score,
      evidence: finding.evidence.slice(0, 3),
    })),
  };
  try {
    const response = await analyzeRecord(
      analyze,
      SYNTHESIS_SYSTEM_PROMPT,
      `Produce the synthesis fields in this shape:\n${JSON.stringify(requested)}\nEvidence packet:\n${JSON.stringify(synthesisPacket)}`,
    );
    let userProfile = buildUserProfile(response?.user_profile, validSessionIds);
    if (
      Object.values(userProfile).every((claims) => claims.length === 0) &&
      base.session_findings.some((finding) => finding.evidence.length > 0)
    ) {
      try {
        const generated = await analyzeRecord(
          analyze,
          PROFILE_SYSTEM_PROMPT,
          `Build a profile from these findings:\n${JSON.stringify(synthesisPacket.session_findings)}`,
        );
        userProfile = buildUserProfile(generated?.user_profile, validSessionIds);
      } catch {
        // An empty profile is more honest than ungrounded fallback text.
      }
    }
    const modelRecommendations: AnalysisReport["recommendations"] = Array.isArray(
      response?.recommendations,
    )
      ? response.recommendations.flatMap((value) => {
          const recommendation = normalizeRecommendation(value, validSessionIds);
          return recommendation ? [recommendation] : [];
        })
      : [];
    let recommendations = modelRecommendations.slice(0, 12);
    if (
      !recommendations.some((recommendation) => recommendation.kind === "skill") &&
      base.session_findings.some((finding) => finding.evidence.length > 0)
    ) {
      const skillFindings = base.session_findings
        .filter((finding) => finding.evidence.length > 0)
        .map((finding) => ({
          session_id: finding.session_id,
          task_type: finding.task_type,
          prompting_pattern: finding.prompting_pattern,
          recurring_mistakes: finding.recurring_mistakes,
          user_preferences: finding.user_preferences,
          friction: finding.friction,
          advice: finding.advice,
          evidence: finding.evidence.slice(0, 2),
        }));
      try {
        const generated = await analyzeRecord(
          analyze,
          SKILL_SYSTEM_PROMPT,
          `Design one skill from these findings:\n${JSON.stringify(skillFindings)}`,
        );
        const skill = normalizeRecommendation(generated?.recommendation, validSessionIds, "skill");
        if (skill) recommendations = [...recommendations, skill];
      } catch {
        // The primary synthesis remains valid when the focused skill pass fails.
      }
    }
    const limitations = stringList(response?.limitations).filter(
      (item) => !/(?:distinct_skills\s*=\s*0|zero (?:existing )?skills)/i.test(item),
    );
    const partial: Omit<AnalysisReport, "report_markdown"> = {
      ...base,
      discovered_insights: alignSkillAdoptionAction(base.discovered_insights, recommendations),
      user_profile: userProfile,
      recommendations,
      limitations,
    };
    return {
      ...partial,
      report_markdown:
        typeof response?.report_markdown === "string"
          ? response.report_markdown
          : fallbackMarkdown(partial),
    };
  } catch (error) {
    const partial: Omit<AnalysisReport, "report_markdown"> = {
      ...base,
      user_profile: {
        repeated_preferences: [],
        working_style: [],
        recurring_corrections: [],
        strengths: [],
        failure_modes: [],
      },
      recommendations: [],
      limitations: [
        `Final model synthesis failed: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
    return { ...partial, report_markdown: fallbackMarkdown(partial) };
  }
}

async function saveReport(report: AnalysisReport): Promise<string> {
  const timestamp = report.generated_at.replace(/[:.]/g, "-");
  const directory = join(homedir(), ".farpoint", "reports", timestamp);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const path = join(directory, "analysis.json");
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  return path;
}

export async function runFullCorpusAnalysis(
  analyze: AnalyzeText,
  onProgress: (update: ProgressUpdate) => void,
): Promise<{ report: AnalysisReport; path: string }> {
  onProgress({ stage: "syncing", label: "Syncing local session archive" });
  await syncAgentsView();

  onProgress({ stage: "indexing", label: "Indexing all agent sessions" });
  const [allSessions, agentsViewStats, projects] = await Promise.all([
    paginateSessions(["--include-children", "--include-one-shot", "--include-automated"]),
    runAgentsView([
      "stats",
      "--format",
      "json",
      "--since",
      "1970-01-01",
      "--include-one-shot",
      "--include-automated",
    ]),
    runAgentsView(["projects", "--format", "json"]),
  ]);
  const corpus = selectCorpus(allSessions);

  onProgress({
    stage: "ranking",
    label: `Ranking ${corpus.eligible.length} substantive sessions`,
  });
  const metrics = computeMetrics(corpus.eligible);
  const ranked = rankCandidates(corpus.eligible);
  const candidateCount = Math.min(INITIAL_CANDIDATES, ranked.length);
  onProgress({
    stage: "triaging",
    label: `Triaging ${candidateCount} diverse candidates`,
  });
  const triage = await triageCandidates(ranked.slice(0, candidateCount), analyze);

  const candidateMap = new Map(
    ranked.slice(0, candidateCount).map((candidate) => [candidate.id, candidate]),
  );
  const deep = await inspectDeeply(triage, candidateMap, analyze, onProgress);
  const evidence = deep.flatMap((finding) => finding.evidence);

  onProgress({ stage: "discovering", label: "Mining surprising cross-session insights" });
  const discoveredInsights = await discoverInsights(
    ranked.slice(0, candidateCount),
    deep,
    agentsViewStats,
    projects,
    metrics,
    analyze,
  );

  onProgress({ stage: "synthesizing", label: "Synthesizing evidence-backed advice" });
  const report = await synthesize(
    {
      schema_version: 1,
      generated_at: new Date().toISOString(),
      coverage: {
        discovered: allSessions.length,
        eligible: corpus.eligible.length,
        triaged: candidateCount,
        triage_attempted: candidateCount,
        triage_findings: triage.length,
        deeply_inspected: deep.length,
        excluded_as_noise: corpus.excludedAsNoise,
        exceptional_noise_admitted: corpus.exceptionalNoiseAdmitted,
      },
      agentsview_stats: agentsViewStats,
      projects,
      data_scopes: {
        projects: "full AgentsView archive",
        agentsview_stats: "all-time AgentsView stats including one-shot and automated sessions",
        metrics: "eligible Farpoint cohort after automated and one-shot noise filtering",
      },
      metrics,
      session_findings: deep,
      discovered_insights: discoveredInsights,
      evidence,
    },
    analyze,
  );
  const path = await saveReport(report);
  return { report, path };
}
