import type { Breed } from '@/domain';
import { isRecord } from '@/utils/guards';

import type { Database } from '../database';

export interface BreedRepository {
  getAll(): Promise<Breed[]>;
  getById(id: string): Promise<Breed | null>;
  count(): Promise<number>;
  /** Upserts one API page worth of breeds atomically. */
  upsertMany(breeds: readonly Breed[], pageNumber: number | null, now: number): Promise<void>;
  upsert(breed: Breed, now: number): Promise<void>;
  clear(): Promise<void>;
}

interface BreedRow {
  payload: string;
}

const UPSERT_SQL = `
  INSERT INTO breeds (
    id, name, group_id, size_band, coat_length, hypoallergenic,
    good_with_children, good_with_dogs, good_with_strangers,
    search_text, payload, page_number, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    group_id = excluded.group_id,
    size_band = excluded.size_band,
    coat_length = excluded.coat_length,
    hypoallergenic = excluded.hypoallergenic,
    good_with_children = excluded.good_with_children,
    good_with_dogs = excluded.good_with_dogs,
    good_with_strangers = excluded.good_with_strangers,
    search_text = excluded.search_text,
    payload = excluded.payload,
    page_number = COALESCE(excluded.page_number, breeds.page_number),
    updated_at = excluded.updated_at
`;

function toParams(breed: Breed, pageNumber: number | null, now: number) {
  return [
    breed.id,
    breed.name,
    breed.groupId,
    breed.sizeBand,
    breed.coat.length,
    breed.hypoallergenic === null ? null : breed.hypoallergenic ? 1 : 0,
    breed.traits.good_with_children,
    breed.traits.good_with_dogs,
    breed.traits.good_with_strangers,
    breed.searchText,
    JSON.stringify(breed),
    pageNumber,
    now,
  ];
}

function parsePayload(row: BreedRow): Breed | null {
  try {
    const parsed: unknown = JSON.parse(row.payload);
    return isRecord(parsed) && typeof parsed.id === 'string' ? (parsed as unknown as Breed) : null;
  } catch {
    return null;
  }
}

export function createBreedRepository(db: Database): BreedRepository {
  return {
    async getAll() {
      const rows = await db.getAllAsync<BreedRow>('SELECT payload FROM breeds ORDER BY name ASC');
      return rows.map(parsePayload).filter((b): b is Breed => b !== null);
    },

    async getById(id) {
      const row = await db.getFirstAsync<BreedRow>('SELECT payload FROM breeds WHERE id = ?', id);
      return row ? parsePayload(row) : null;
    },

    async count() {
      const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM breeds');
      return row?.n ?? 0;
    },

    async upsertMany(breeds, pageNumber, now) {
      if (breeds.length === 0) return;
      await db.withExclusiveTransactionAsync(async (tx) => {
        const statement = await tx.prepareAsync(UPSERT_SQL);
        try {
          for (const breed of breeds) {
            await statement.executeAsync(toParams(breed, pageNumber, now));
          }
        } finally {
          await statement.finalizeAsync();
        }
      });
    },

    async upsert(breed, now) {
      await db.runAsync(UPSERT_SQL, toParams(breed, null, now));
    },

    async clear() {
      await db.execAsync('DELETE FROM breeds');
    },
  };
}
