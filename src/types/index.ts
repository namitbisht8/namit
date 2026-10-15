export type UserRole =
  | 'operator'
  | 'owner'
  | 'manager'
  | 'hr'
  | 'intern'
  | 'finance'
  | 'legal'
  | 'engineering'
  | 'auditor'
  | 'security_analyst';

export type PermissionType =
  | 'view'
  | 'edit'
  | 'upload'
  | 'download'
  | 'delete'
  | 'share'
  | 'administer';

export type DocumentClassification =
  | 'Public'
  | 'Internal'
  | 'Confidential'
  | 'Highly Restricted';

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  defaultPermissions: PermissionType[];
  color: string;
  department: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  title: string;
  role: UserRole;
  department: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  avatarUrl?: string;
  initials: string;
  lastLogin: string;
  tokenExpiry: string;
  sessionToken: string;
  activeSessionsCount?: number;
  assignedResources?: string[]; // Resource IDs explicitly assigned
}

export type ActionStatus = 'ALLOWED' | 'MASKED' | 'BLOCKED' | 'ALERTED';

export type SourcePage =
  | 'Chat'
  | 'Documents'
  | 'Red Team'
  | 'Threat Scanner'
  | 'Gateway API'
  | 'Access Control'
  | 'Testing Center';

export interface InterceptedEvent {
  id: string;
  time: string;
  timestampUtc: string;
  actorId: string;
  actorName: string;
  source: SourcePage;
  role: string;
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
  resourceId?: string;
  resourceName?: string;
  securitySeverity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  correlationId?: string;
  denialReason?: string;
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

export interface DocumentCitation {
  documentId: string;
  documentName: string;
  classification: DocumentClassification;
  section: string;
  snippet: string;
  confidenceScore: number;
}

export interface ChatResponsePayload {
  answer: string;
  inspection: InspectionReport;
  citations: DocumentCitation[];
  authorizedDocumentsQueried: number;
  blockedDocumentsFiltered: number;
  evidenceStatus: 'VERIFIED_FACT' | 'REASONABLE_INFERENCE' | 'INSUFFICIENT_EVIDENCE' | 'SAFE_REFUSAL';
  securityMetadata: {
    instructionHierarchyApplied: boolean;
    contextIsolationActive: boolean;
    egressScrubbed: boolean;
    actorRole: string;
    actorId: string;
    model: string;
  };
}

export interface ManagedDocument {
  id: string;
  name: string;
  size: string;
  bytes: number;
  type: string;
  mimeType: string;
  fingerprint: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  department: string;
  classification: DocumentClassification;
  ownerId: string;
  ownerName: string;
  allowedRoles: UserRole[];
  explicitUserIds: string[];
  quarantineStatus: 'CLEAN' | 'QUARANTINED' | 'PENDING';
  malwareScanResult: 'PASSED' | 'FLAGGED' | 'SUSPICIOUS';
  content: string;
  summary: string;
  totalEntities: number;
  isArchived: boolean;
  retentionExpires?: string;
}

export interface AccessMatrixEntry {
  resourceId: string;
  resourceName: string;
  resourceType: 'document' | 'folder' | 'system_api';
  classification: DocumentClassification;
  department: string;
  rolePermissions: Record<string, PermissionType[]>;
}

export interface AccessRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  requesterDepartment: string;
  resourceId: string;
  resourceName: string;
  requestedPermission: PermissionType;
  justification: string;
  expiresInHours?: number;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  decidedBy?: string;
  decidedByName?: string;
  decidedAt?: string;
  decisionNote?: string;
}

export interface PermissionChangeAudit {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  targetType: 'role' | 'user' | 'document';
  targetId: string;
  targetName: string;
  action: 'GRANT' | 'REVOKE' | 'UPDATE_CLASSIFICATION' | 'CREATE_ROLE';
  details: string;
  isDangerousChange: boolean;
}

export interface AuditMetricsSummary {
  totalRequests: number;
  successfulOperations: number;
  failedOperations: number;
  partiallyCompleted: number;
  blockedInjections: number;
  dataLeakageBlocked: number;
  unauthorizedAccessAttempts: number;
  filesProcessed: number;
  activeUsers: number;
  successRate: number;
  operationalSuccess: number;
  securityEffectivenessRate: number;
  averageLatencyMs: number;
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
  strictInstructionHierarchy: boolean;
  denyByDefaultRAG: boolean;
  requireOwnerApprovalForSecrets: boolean;
}

export interface DocumentFinding {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  count: number;
  lines: number[];
  category: 'credential' | 'card' | 'pii' | 'name' | 'injection';
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
  malwareStatus: 'CLEAN' | 'SUSPICIOUS';
  mimeTypeValidated: boolean;
}

export type RedTeamSuiteType =
  | 'Direct injection'
  | 'Indirect injection'
  | 'Multi-turn jailbreaks'
  | 'System prompt extraction'
  | 'Data exfiltration'
  | 'Role escalation'
  | 'Cross-role document access'
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
  targetRole?: UserRole;
  confidentialDataExpected?: boolean;
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
  suiteStats: Record<string, { total: number; passed: number }>;
  results: Record<string, RedTeamScenarioResult>;
  executedBy: string;
  regressionStatus: 'PASSED' | 'WARNING' | 'REGRESSION_DETECTED';
}
