import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { WorkflowService } from './workflow.service.js';
import { RequestState, Role } from '../common/enums.js';
import type { RequestEntity } from '../entities/request.entity.js';

function mockRepo<T extends object>(initial?: T) {
  const store = { entity: initial ?? null };
  return {
    store,
    findOne: vi.fn(async () => store.entity),
    save: vi.fn(async (e: T) => {
      store.entity = e;
      return e;
    }),
    create: vi.fn((e: T) => e),
    update: vi.fn(),
  };
}

describe('WorkflowService role gates', () => {
  let service: WorkflowService;
  let requestRepo: ReturnType<typeof mockRepo<RequestEntity>>;
  let audit: { append: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    requestRepo = mockRepo<RequestEntity>({
      id: 'uuid-1',
      externalId: 'REQ-001',
      state: RequestState.Draft,
    } as RequestEntity);
    const proposalRepo = mockRepo();
    const mergeRepo = mockRepo();
    audit = { append: vi.fn(async (e) => e) };
    service = new WorkflowService(
      requestRepo as never,
      proposalRepo as never,
      mergeRepo as never,
      audit as never,
    );
  });

  it('Manager approval gate — only Manager can move toward Open', async () => {
    const result = await service.approve(
      'uuid-1',
      Role.Manager,
      'Looks correct; open task',
    );
    expect(result.state).toBe(RequestState.Open);
    expect(audit.append).toHaveBeenCalled();
  });

  it('Viewer denial — Viewer cannot change state', async () => {
    await expect(
      service.approve('uuid-1', Role.Viewer, 'should fail'),
    ).rejects.toThrow(ForbiddenException);
    expect(requestRepo.store.entity?.state).toBe(RequestState.Draft);
  });

  it('duplicate merge from REQ-002 → REQ-001', async () => {
    const duplicate: RequestEntity = {
      id: 'uuid-2',
      externalId: 'REQ-002',
      state: RequestState.NeedsReview,
    } as RequestEntity;
    const canonical: RequestEntity = {
      id: 'uuid-1',
      externalId: 'REQ-001',
      state: RequestState.Draft,
    } as RequestEntity;

    requestRepo.findOne = vi.fn(async ({ where }: { where: Record<string, string> }) => {
      if (where.id === 'uuid-2') return duplicate;
      if (where.externalId === 'REQ-001') return canonical;
      return null;
    });
    requestRepo.save = vi.fn(async (e: RequestEntity) => e);

    const mergeRepo = {
      create: vi.fn((e) => e),
      save: vi.fn(async (e) => e),
    };
    const proposalRepo = mockRepo();
    service = new WorkflowService(
      requestRepo as never,
      proposalRepo as never,
      mergeRepo as never,
      audit as never,
    );

    const merged = await service.merge(
      'uuid-2',
      'REQ-001',
      Role.Manager,
      'Duplicate checkout incident',
    );
    expect(merged.state).toBe(RequestState.Merged);
    expect(merged.duplicateOf).toBe('REQ-001');
    expect(mergeRepo.save).toHaveBeenCalled();
  });
});
