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
  friction: string[];
  strengths: string[];
  user_preferences: string[];
  themes: string[];
  advice: string[];
  confidence: "low" | "medium" | "high";
  evidence: EvidenceReference[];
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

export type AnalysisReport = {
  schema_version: 1;
  generated_at: string;
  coverage: {
    discovered: number;
    eligible: number;
    triaged: number;
    deeply_inspected: number;
    excluded_as_noise: number;
    exceptional_noise_admitted: number;
  };
  metrics: NumericSummary;
  session_findings: SessionFinding[];
  user_profile: {
    repeated_preferences: string[];
    working_style: string[];
    recurring_corrections: string[];
    strengths: string[];
    failure_modes: string[];
  };
  recommendations: Array<{
    title: string;
    action: string;
    kind: "instruction" | "skill" | "tooling" | "prompting" | "workflow";
    supporting_session_ids: string[];
  }>;
  evidence: EvidenceReference[];
  limitations: string[];
  report_markdown: string;
};

export type ProgressUpdate = {
  stage: "syncing" | "indexing" | "ranking" | "triaging" | "inspecting" | "synthesizing";
  label: string;
};
