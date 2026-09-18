import type { BreedGroup } from '@/domain';
import { stringArray } from '@/utils/guards';

import type { Database } from '../database';
import { serializeWrite } from '../writeQueue';

export interface GroupRepository {
  getAll(): Promise<BreedGroup[]>;
  upsertMany(groups: readonly BreedGroup[], now: number): Promise<void>;
}

interface GroupRow {
  id: string;
  name: string;
  label: string;
  breed_ids: string;
}

function parseIds(raw: string): string[] {
  try {
    return stringArray(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function createGroupRepository(db: Database): GroupRepository {
  return {
    async getAll() {
      const rows = await db.getAllAsync<GroupRow>(
        'SELECT id, name, label, breed_ids FROM groups ORDER BY name ASC',
      );
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        label: r.label,
        breedIds: parseIds(r.breed_ids),
      }));
    },

    async upsertMany(groups, now) {
      if (groups.length === 0) return;
      await serializeWrite(db, () =>
        db.withExclusiveTransactionAsync(async (tx) => {
          for (const g of groups) {
            await tx.runAsync(
              `INSERT INTO groups (id, name, label, breed_ids, updated_at) VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(id) DO UPDATE SET
                 name = excluded.name, label = excluded.label,
                 breed_ids = excluded.breed_ids, updated_at = excluded.updated_at`,
              [g.id, g.name, g.label, JSON.stringify(g.breedIds), now],
            );
          }
        }),
      );
    },
  };
}
