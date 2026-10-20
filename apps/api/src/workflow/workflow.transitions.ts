import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { RequestState, Role } from '../common/enums.js';

/** Allowed transitions. Manager-only actions are gated separately. */
const ALLOWED: Record<RequestState, RequestState[]> = {
  [RequestState.Received]: [RequestState.Triaged],
  [RequestState.Triaged]: [RequestState.Draft, RequestState.NeedsReview],
  [RequestState.Draft]: [
    RequestState.Approved,
    RequestState.Rejected,
    RequestState.NeedsReview,
    RequestState.Merged,
  ],
  [RequestState.NeedsReview]: [
    RequestState.Approved,
    RequestState.Rejected,
    RequestState.Merged,
    RequestState.Draft,
  ],
  [RequestState.Approved]: [RequestState.Open],
  [RequestState.Open]: [],
  [RequestState.Rejected]: [],
  [RequestState.Merged]: [],
};

const MANAGER_ONLY_TARGETS = new Set<RequestState>([
  RequestState.Approved,
  RequestState.Rejected,
  RequestState.Merged,
  RequestState.Open,
]);

export function assertTransition(
  from: RequestState,
  to: RequestState,
  role: Role,
): void {
  const allowed = ALLOWED[from] ?? [];
  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `Invalid transition: ${from} → ${to}`,
    );
  }
  if (MANAGER_ONLY_TARGETS.has(to) && role !== Role.Manager) {
    throw new ForbiddenException(
      `Only Manager can transition to ${to}. Viewer cannot change state.`,
    );
  }
}

export function assertManager(role: Role, action: string): void {
  if (role !== Role.Manager) {
    throw new ForbiddenException(
      `Viewer cannot ${action}. Manager role required.`,
    );
  }
}
