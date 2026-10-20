export enum RequestState {
  Received = 'Received',
  Triaged = 'Triaged',
  Draft = 'Draft',
  NeedsReview = 'Needs Review',
  Approved = 'Approved',
  Open = 'Open',
  Rejected = 'Rejected',
  Merged = 'Merged',
}

export enum Role {
  Viewer = 'Viewer',
  Manager = 'Manager',
}

export enum Department {
  IT = 'IT',
  Marketing = 'Marketing',
  Ecommerce = 'E-commerce',
  CustomerService = 'Customer Service',
  SCM = 'SCM',
  Finance = 'Finance',
  HR = 'HR',
  Production = 'Production',
  NeedsReview = 'Needs Review',
}

export enum Priority {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export enum RiskFlag {
  Duplicate = 'duplicate',
  Conflict = 'conflict',
  Security = 'security',
  Privacy = 'privacy',
  MissingInformation = 'missing-information',
}

export enum RecommendedState {
  Draft = 'Draft',
  NeedsReview = 'Needs Review',
}

export enum AuditAction {
  Imported = 'imported',
  Triaged = 'triaged',
  AiFailed = 'ai_failed',
  Approved = 'approved',
  Edited = 'edited',
  Rejected = 'rejected',
  Merged = 'merged',
  Opened = 'opened',
  Clarification = 'clarification',
  RoleDenied = 'role_denied',
}
