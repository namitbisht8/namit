export type UserRole = 'operator';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  title: string;
  role: string;
  avatarUrl?: string;
  initials: string;
  lastLogin: string;
  tokenExpiry: string;
}

export type ActionStatus = 'ALLOWED' | 'MASKED' | 'BLOCKED' | 'ALERTED';

export type SourcePage = 'Chat' | 'Documents' | 'Red Team' | 'Threat Scanner' | 'Gateway API';

export interface InterceptedEvent {
  id: string;
  time: string;
  source: SourcePage;
  role: string; // "Operator" or "External"
  description: string;
  action: ActionStatus;
  vector?: string;
  rawPayload?: string;
  sanitizedPayload?: string;
  latencyMs: number;
  stageTriggered?: number;
  sha256?: string;
  ruleId?: string;
  matchedRuleName?: string;
  category?: string;
  explanation?: string;
  riskScore: number;
  modelUsed?: string;
  maskedItems?: Array<{ type: string; count: number }>;
}

export interface PipelineStageResult {
  stage: number;
  name: string;
  status: 'passed' | 'modified' | 'blocked';
  latencyMs: number;
  technique: string;
  detail: string;
}

export interface FiredRule {
  id: string;
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  stage: number;
  description: string;
}

export interface InspectionReport {
  overallAction: ActionStatus;
  originalText: string;
  processedText: string;
  totalLatencyMs: number;
  threatDetected: boolean;
  threatType?: string;
  detectedPII: Array<{
    type: string;
    value: string;
    masked: string;
    line?: number;
  }>;
  stageResults: PipelineStageResult[];
  sha256: string;
  ruleTriggered?: string;
  riskScore: number; // 0 to 100
  firedRules: FiredRule[];
  whyDecision: string;
  safeRewrite?: string;
}

export type RedTeamSuiteType =
  | 'Direct injection'
  | 'Multi-turn jailbreaks'
  | 'Data exfiltration'
  | 'Role escalation'
  | 'Obfuscated/encoded attacks'
  | 'Fake secrets'
  | 'Harmless prompts';

export interface RedTeamScenario {
  id: string;
  title: string;
  suite: RedTeamSuiteType;
  prompt: string;
  expectedDecision: ActionStatus;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  isHardCase?: boolean;
  improvementNote?: string;
}

export interface RedTeamScenarioResult {
  scenarioId: string;
  actualDecision: ActionStatus;
  expectedDecision: ActionStatus;
  passed: boolean;
  latencyMs: number;
  riskScore: number;
  ruleFired: string;
  details: string;
}

export interface RedTeamRun {
  id: string;
  date: string;
  timestamp: number;
  total: number;
  passedCount: number;
  failedCount: number;
  detectionRate: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  fastestBlockMs: number;
  slowestBlockMs: number;
  suiteStats: Record<RedTeamSuiteType, { total: number; passed: number }>;
  results: Record<string, RedTeamScenarioResult>;
}

export interface DocumentPolicyCard {
  id: string;
  name: string;
  type: string;
  sensitivity: 'Public' | 'Internal' | 'Confidential';
  whyHidden?: string;
  isProtected: boolean;
  icon: string;
  tone: 'teal' | 'violet' | 'rose';
  content: string;
}

export interface DocumentFinding {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  count: number;
  lines: number[];
  category: 'credential' | 'card' | 'pii' | 'name';
}

export interface UploadedFileScan {
  id: string;
  name: string;
  size: string;
  type: string;
  fingerprint: string;
  timestamp: string;
  findings: DocumentFinding[];
  originalText: string;
  sanitizedText: string;
  decision: 'SANITIZED' | 'BLOCKED';
  maskNames: boolean;
  latencyMs: number;
}

export interface PolicySettings {
  panAction: 'MASK' | 'BLOCK' | 'ALLOW';
  aadhaarAction: 'MASK' | 'BLOCK' | 'ALLOW';
  phoneAction: 'MASK' | 'BLOCK' | 'ALLOW';
  emailAction: 'MASK' | 'BLOCK' | 'ALLOW';
  apiKeyAction: 'BLOCK' | 'MASK' | 'ALLOW';
  salaryAction: 'BLOCK' | 'MASK' | 'ALLOW';
  blockThreshold: number; // e.g. 70
  maskThreshold: number;  // e.g. 30
  rulesOnlyMode: boolean; // bypass LLM egress if true
}
