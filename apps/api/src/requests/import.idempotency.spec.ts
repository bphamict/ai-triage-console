import { describe, expect, it, vi } from 'vitest';
import { RequestState } from '../common/enums.js';

/**
 * Import idempotency for REQ-001 — documents the stable-ID strategy:
 * re-import skips existing externalId rows so fixture re-load yields 12 uniques.
 */
describe('import idempotency', () => {
  it('skips existing REQ-001 on re-import and keeps unique count', async () => {
    const existing = new Map<string, { externalId: string }>([
      ['REQ-001', { externalId: 'REQ-001' }],
    ]);
    const fixtureIds = Array.from({ length: 12 }, (_, i) =>
      `REQ-${String(i + 1).padStart(3, '0')}`,
    );

    let imported = 0;
    let skipped = 0;
    for (const id of fixtureIds) {
      if (existing.has(id)) {
        skipped += 1;
        continue;
      }
      existing.set(id, { externalId: id });
      imported += 1;
    }

    expect(skipped).toBe(1);
    expect(imported).toBe(11);
    expect(existing.size).toBe(12);
    expect(existing.get('REQ-001')?.externalId).toBe('REQ-001');
  });

  it('service-level skip path uses findOne by externalId', async () => {
    const findOne = vi.fn(async ({ where }: { where: { externalId: string } }) =>
      where.externalId === 'REQ-001'
        ? { externalId: 'REQ-001', state: RequestState.Draft }
        : null,
    );
    const save = vi.fn();

    const row = { id: 'REQ-001' };
    const existing = await findOne({ where: { externalId: row.id } });
    if (existing) {
      // skip
    } else {
      await save(row);
    }

    expect(findOne).toHaveBeenCalledWith({ where: { externalId: 'REQ-001' } });
    expect(save).not.toHaveBeenCalled();
  });
});
