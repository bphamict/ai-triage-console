export type Role = "Viewer" | "Manager";

export type RequestState =
  | "Received"
  | "Triaged"
  | "Draft"
  | "Needs Review"
  | "Approved"
  | "Open"
  | "Rejected"
  | "Merged";

export interface TriageRequest {
  id: string;
  externalId: string;
  source: string;
  departmentHint: string | null;
  requesterRole: string;
  submittedAt: string;
  content: string;
  state: RequestState;
  department: string | null;
  priority: string | null;
  riskFlags: string[] | null;
  duplicateOf: string | null;
  triageError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Proposal {
  id: string;
  requestId: string;
  version: number;
  department: string;
  priority: string;
  confidence: number;
  summary: string;
  proposedOwner: string;
  proposedSteps: Array<{ action: string; completion_condition: string }>;
  riskFlags: string[];
  recommendedState: string;
  isCurrent: boolean;
  editedByRole: string | null;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  requestId: string | null;
  actorRole: string;
  action: string;
  reason: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
}

export interface RequestDetail {
  request: TriageRequest;
  proposal: Proposal | null;
  audit: AuditEvent[];
}
