import { describe, expect, it } from 'vitest';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { RequestState, Role } from '../common/enums.js';
import { assertManager, assertTransition } from './workflow.transitions.js';

describe('workflow transitions', () => {
  it('allows Manager to approve from Draft toward Open', () => {
    expect(() =>
      assertTransition(RequestState.Draft, RequestState.Approved, Role.Manager),
    ).not.toThrow();
    expect(() =>
      assertTransition(RequestState.Approved, RequestState.Open, Role.Manager),
    ).not.toThrow();
  });

  it('denies Viewer from changing state toward Open', () => {
    expect(() =>
      assertTransition(RequestState.Draft, RequestState.Approved, Role.Viewer),
    ).toThrow(ForbiddenException);
    expect(() => assertManager(Role.Viewer, 'approve')).toThrow(
      ForbiddenException,
    );
  });

  it('rejects invalid transitions', () => {
    expect(() =>
      assertTransition(RequestState.Received, RequestState.Open, Role.Manager),
    ).toThrow(BadRequestException);
    expect(() =>
      assertTransition(RequestState.Rejected, RequestState.Open, Role.Manager),
    ).toThrow(BadRequestException);
  });
});
