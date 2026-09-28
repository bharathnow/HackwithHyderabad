export interface Recommendation {
  rank: number;
  fix_title: string;
  description: string;
  past_success_rate: number;
  times_tried: number;
  times_worked: number;
  last_engineer: string;
  status_badge: string;
  rationale: string;
}

export interface MemoryEvidence {
  incident_id: string;
  summary: string;
  relevance_reason: string;
}

export interface AnalysisResponse {
  likely_root_cause: string;
  confidence: number;
  recommendations: Recommendation[];
  memory_evidence: MemoryEvidence[];
  hindsight_reflection: string;
  recalled_raw_memories?: Array<{ text: string; type: string; score: number }>;
  memory_enabled: boolean;
}

export interface LearningCurveStats {
  points: Array<{ interaction: number; timestamp: string; success_rate: number; outcome: string }>;
  current_success_rate: number;
  initial_success_rate: number;
  improvement_pct: number;
  total_interactions: number;
}

export interface ProactiveWarningResponse {
  risk_score: number;
  risk_level: string;
  summary: string;
  similar_past_incidents: string[];
  preventative_recommendations: string[];
  recalled_raw_memories?: Array<{ text: string }>;
}

const API_BASE = '/api';

export async function analyzeAlert(
  service: string,
  error_code: string,
  log_snippet: string,
  memory_enabled: boolean = true
): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE}/alerts/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ service, error_code, log_snippet, memory_enabled }),
  });
  if (!res.ok) throw new Error(`Analysis failed: ${res.statusText}`);
  return res.json();
}

export async function submitFeedback(
  incident_id: string,
  service: string,
  fix_applied: string,
  outcome: 'worked' | 'failed',
  engineer: string = 'On-Call Engineer'
) {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ incident_id, service, fix_applied, outcome, engineer }),
  });
  if (!res.ok) throw new Error(`Feedback submission failed: ${res.statusText}`);
  return res.json();
}

export async function seedDatabase() {
  const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
  if (!res.ok) throw new Error(`Seed failed: ${res.statusText}`);
  return res.json();
}

export async function fetchMemories() {
  const res = await fetch(`${API_BASE}/memories?limit=50`);
  if (!res.ok) throw new Error(`Failed to fetch memories: ${res.statusText}`);
  return res.json();
}

export async function fetchStats(): Promise<LearningCurveStats> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.statusText}`);
  return res.json();
}

export async function evaluateProactiveWarning(deployment_description: string): Promise<ProactiveWarningResponse> {
  const res = await fetch(`${API_BASE}/proactive-warning`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deployment_description }),
  });
  if (!res.ok) throw new Error(`Proactive warning evaluation failed: ${res.statusText}`);
  return res.json();
}
