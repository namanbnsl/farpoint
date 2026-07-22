export type SessionSummary = {
  id: string;
  project?: string;
  machine?: string;
  agent?: string;
  display_name?: string;
  first_message?: string;
  started_at?: string;
  ended_at?: string;
  message_count?: number;
  user_message_count?: number;
  total_output_tokens?: number;
  peak_context_tokens?: number;
  is_automated?: boolean;
  tool_failure_signal_count?: number;
  tool_retry_count?: number;
  edit_churn_count?: number;
  compaction_count?: number;
  mid_task_compaction_count?: number;
  health_score?: number;
  health_grade?: string;
  outcome?: string;
  outcome_confidence?: string;
  cwd?: string;
  quality_signals?: Record<string, unknown>;
};

export type SessionCandidate = SessionSummary & {
  score: number;
  selection_reasons: string[];
};

export type EvidenceReference = {
  session_id: string;
  title: string;
  project: string;
  agent: string;
  ordinal_start: number;
  ordinal_end: number;
  excerpt: string;
  signal_type: string;
};

export type SessionFinding = {
  session_id: string;
  title: string;
  project: string;
  agent: string;
  outcome_assessment: string;
  task_type: "debug" | "feature" | "refactor" | "test" | "config" | "other";
  prompting_pattern: "specific" | "vague" | "mixed" | "unknown";
  friction: string[];
  recurring_mistakes: string[];
  strengths: string[];
  user_preferences: string[];
  confidence_score: number;
  themes: string[];
  advice: string[];
  confidence: "low" | "medium" | "high";
  evidence: EvidenceReference[];
};

export type DiscoveredInsight = {
  title: string;
  observation: string;
  why_it_matters: string;
  contrast: string;
  competing_explanation: string;
  action: string;
  confidence: "low" | "medium" | "high" | "tentative";
  confidence_score: number;
  support_count: number;
  metric_evidence: string[];
  expected_impact: string;
  supporting_session_ids: string[];
  evidence: EvidenceReference[];
  evidence_basis: "aggregate" | "aggregate+session" | "session";
  lenses: string[];
  score: number;
  score_components: {
    surprise: number;
    evidence_strength: number;
    recurrence: number;
    actionable_impact: number;
    specificity: number;
  };
  score_weights: Record<string, number>;
};
export type NumericSummary = {
  sessions: number;
  totals: Record<string, number>;
  averages: Record<string, number>;
  percentiles: Record<string, Record<string, number>>;
  by_agent: Record<string, Record<string, number>>;
  by_project: Record<string, Record<string, number>>;
  outcomes: Record<string, number>;
};

export type UserProfileClaim = {
  claim: string;
  supporting_session_ids: string[];
  support_tier: "tentative" | "repeated";
};

export type AnalysisReport = {
  schema_version: 1;
  generated_at: string;
  coverage: {
    discovered: number;
    eligible: number;
    triaged: number;
    triage_attempted: number;
    triage_findings: number;
    deeply_inspected: number;
    excluded_as_noise: number;
    exceptional_noise_admitted: number;
  };
  metrics: NumericSummary;
  agentsview_stats: unknown;
  projects: unknown;
  session_findings: SessionFinding[];
  discovered_insights: DiscoveredInsight[];
  data_scopes: {
    projects: string;
    agentsview_stats: string;
    metrics: string;
  };
  user_profile: {
    repeated_preferences: UserProfileClaim[];
    working_style: UserProfileClaim[];
    recurring_corrections: UserProfileClaim[];
    strengths: UserProfileClaim[];
    failure_modes: UserProfileClaim[];
  };
  recommendations: Array<{
    title: string;
    action: string;
    rule?: string;
    kind: "instruction" | "skill" | "tooling" | "prompting" | "workflow";
    provisional?: boolean;
    supporting_session_ids: string[];
  }>;
  evidence: EvidenceReference[];
  limitations: string[];
  report_markdown: string;
};

export type ProgressUpdate = {
  stage:
    | "syncing"
    | "indexing"
    | "ranking"
    | "triaging"
    | "inspecting"
    | "discovering"
    | "synthesizing";
  label: string;
};
