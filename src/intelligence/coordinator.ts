import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { runAgentsView, syncAgentsView } from "../agentsview/runner";
import { computeMetrics, paginateSessions, rankCandidates, selectCorpus } from "./corpus";
import type {
  AnalysisReport,
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
const CANDIDATE_INCREMENT = 50;
const MAX_CANDIDATES = 150;
const MIN_DEEP_INSPECTIONS = 15;
const MAX_DEEP_INSPECTIONS = 30;
const MAX_WORKERS = 3;
const MAX_EXCERPT = 500;
const MAX_PROMPT_CHARS = 70_000;

const TRIAGE_SYSTEM_PROMPT = `You are a bounded coding-session evidence analyst.
Return JSON only: {"findings":[SessionFinding,...]}.
Each SessionFinding must contain session_id, title, project, agent, outcome_assessment,
friction[], strengths[], user_preferences[], themes[], advice[], confidence
("low"|"medium"|"high"), and evidence[].
Each evidence item must contain session_id, title, project, agent, ordinal_start,
ordinal_end, excerpt, and signal_type. Use only supplied messages. Keep excerpts under
500 characters and preserve exact message ordinals. Do not infer a user-wide pattern.`;

const DEEP_SYSTEM_PROMPT = `You are a forensic coding-session analyst. Return one JSON
SessionFinding only, using the supplied targeted transcript windows and metadata.
Every qualitative conclusion must cite an exact supplied ordinal and bounded excerpt.
Separate observed behavior from hypotheses. Give concrete session-level advice.`;

const SYNTHESIS_SYSTEM_PROMPT = `You are Farpoint, a precise coding-agent improvement
analyst. Return JSON only matching the requested schema. Numerical metrics are
authoritative. Only call something a repeated user pattern when at least three distinct
session ids support it; otherwise label it session-specific or tentative. Do not invent
evidence, prices, costs, or causes. Keep report_markdown concise, specific, and useful.`;

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

function bounded(text: string | undefined, limit: number): string {
  if (!text) return "";
  return text.length <= limit ? text : `${text.slice(0, limit)}…`;
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
      content: bounded(message.content, 320),
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
  const strings = (key: string) =>
    Array.isArray(item[key])
      ? item[key].filter((part): part is string => typeof part === "string").slice(0, 12)
      : [];
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
    friction: strings("friction"),
    strengths: strings("strengths"),
    user_preferences: strings("user_preferences"),
    themes: strings("themes"),
    advice: strings("advice"),
    confidence:
      item.confidence === "high" || item.confidence === "low" ? item.confidence : "medium",
    evidence,
  };
}

function reconcileEvidence(
  finding: SessionFinding,
  packet: { messages: Message[] } | undefined,
): SessionFinding {
  if (!packet) return { ...finding, evidence: [] };
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
  return { ...finding, evidence };
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
      const parsed = asRecord(extractJson(await analyze(TRIAGE_SYSTEM_PROMPT, prompt)));
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

function themeKeys(finding: SessionFinding): Set<string> {
  return new Set(
    [...finding.themes, ...finding.user_preferences]
      .map((theme) =>
        theme
          .toLowerCase()
          .replace(/[^a-z0-9 ]/g, "")
          .trim(),
      )
      .filter(Boolean),
  );
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
    .slice(0, MAX_DEEP_INSPECTIONS);
  const deep: SessionFinding[] = [];
  const themes = new Set<string>();
  let stale = 0;

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
    let added = 0;
    for (const finding of results) {
      for (const theme of themeKeys(finding)) {
        if (!themes.has(theme)) {
          themes.add(theme);
          added += 1;
        }
      }
    }
    stale = added === 0 ? stale + results.length : 0;
    onProgress({
      stage: "inspecting",
      label: `Inspecting evidence · ${deep.length}/${Math.min(MAX_DEEP_INSPECTIONS, ranked.length)} sessions`,
    });
    if (deep.length >= MIN_DEEP_INSPECTIONS && stale >= 3) break;
  }
  return deep;
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
      repeated_preferences: ["string"],
      working_style: ["string"],
      recurring_corrections: ["string"],
      strengths: ["string"],
      failure_modes: ["string"],
    },
    recommendations: [
      {
        title: "string",
        action: "string",
        kind: "instruction|skill|tooling|prompting|workflow",
        supporting_session_ids: ["string"],
      },
    ],
    limitations: ["string"],
    report_markdown: "string",
  };
  const validSessionIds = new Set(base.session_findings.map((finding) => finding.session_id));
  try {
    const response = asRecord(
      extractJson(
        await analyze(
          SYNTHESIS_SYSTEM_PROMPT,
          bounded(
            `Produce the synthesis fields in this shape:\n${JSON.stringify(requested)}\nEvidence packet:\n${JSON.stringify(base)}`,
            MAX_PROMPT_CHARS,
          ),
        ),
      ),
    );
    const profile = asRecord(response?.user_profile);
    const stringList = (value: unknown) =>
      Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string").slice(0, 12)
        : [];
    const recommendations: AnalysisReport["recommendations"] = Array.isArray(
      response?.recommendations,
    )
      ? response.recommendations.flatMap((value) => {
          const item = asRecord(value);
          if (!item || typeof item.title !== "string" || typeof item.action !== "string") return [];
          const kind =
            item.kind === "instruction" ||
            item.kind === "skill" ||
            item.kind === "tooling" ||
            item.kind === "prompting"
              ? item.kind
              : "workflow";
          const supporting = stringList(item.supporting_session_ids).filter((id) =>
            validSessionIds.has(id),
          );
          return [
            { title: item.title, action: item.action, kind, supporting_session_ids: supporting },
          ];
        })
      : [];
    const partial: Omit<AnalysisReport, "report_markdown"> = {
      ...base,
      user_profile: {
        repeated_preferences: stringList(profile?.repeated_preferences),
        working_style: stringList(profile?.working_style),
        recurring_corrections: stringList(profile?.recurring_corrections),
        strengths: stringList(profile?.strengths),
        failure_modes: stringList(profile?.failure_modes),
      },
      recommendations,
      limitations: stringList(response?.limitations),
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
  const allSessions = await paginateSessions([
    "--include-children",
    "--include-one-shot",
    "--include-automated",
  ]);
  const corpus = selectCorpus(allSessions);

  onProgress({
    stage: "ranking",
    label: `Ranking ${corpus.eligible.length} substantive sessions`,
  });
  const metrics = computeMetrics(corpus.eligible);
  const ranked = rankCandidates(corpus.eligible);
  let candidateCount = Math.min(INITIAL_CANDIDATES, ranked.length);
  let triage: SessionFinding[] = [];
  let analyzedCandidateCount = 0;

  while (candidateCount > 0) {
    onProgress({
      stage: "triaging",
      label: `Triaging ${candidateCount} diverse candidates`,
    });
    const newFindings = await triageCandidates(
      ranked.slice(analyzedCandidateCount, candidateCount),
      analyze,
    );
    const findingsBySession = new Map(
      [...triage, ...newFindings].map((finding) => [finding.session_id, finding]),
    );
    triage = [...findingsBySession.values()];
    analyzedCandidateCount = candidateCount;
    const projects = new Set(triage.map((finding) => finding.project));
    const agents = new Set(triage.map((finding) => finding.agent));
    const corpusProjects = Math.min(8, Object.keys(metrics.by_project).length);
    const corpusAgents = Math.min(5, Object.keys(metrics.by_agent).length);
    const enoughCoverage =
      triage.length >= Math.min(35, candidateCount * 0.7) &&
      projects.size >= Math.min(3, corpusProjects) &&
      agents.size >= Math.min(2, corpusAgents);
    if (enoughCoverage || candidateCount >= Math.min(MAX_CANDIDATES, ranked.length)) break;
    candidateCount = Math.min(candidateCount + CANDIDATE_INCREMENT, MAX_CANDIDATES, ranked.length);
  }

  const candidateMap = new Map(
    ranked.slice(0, candidateCount).map((candidate) => [candidate.id, candidate]),
  );
  const deep = await inspectDeeply(triage, candidateMap, analyze, onProgress);
  const evidence = deep.flatMap((finding) => finding.evidence);

  onProgress({ stage: "synthesizing", label: "Synthesizing evidence-backed advice" });
  const report = await synthesize(
    {
      schema_version: 1,
      generated_at: new Date().toISOString(),
      coverage: {
        discovered: allSessions.length,
        eligible: corpus.eligible.length,
        triaged: triage.length,
        deeply_inspected: deep.length,
        excluded_as_noise: corpus.excludedAsNoise,
        exceptional_noise_admitted: corpus.exceptionalNoiseAdmitted,
      },
      metrics,
      session_findings: deep,
      evidence,
    },
    analyze,
  );
  const path = await saveReport(report);
  return { report, path };
}
