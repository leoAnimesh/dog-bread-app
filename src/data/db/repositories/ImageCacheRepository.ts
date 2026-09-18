import type { Database } from '../database';

export type ImageVariant = 'thumb' | 'medium' | 'large';

export interface ImageCacheEntry {
  url: string;
  localUri: string;
  variant: ImageVariant;
  bytes: number;
  lastAccess: number;
}

export interface ImageCacheRepository {
  getAll(): Promise<ImageCacheEntry[]>;
  upsert(entry: ImageCacheEntry): Promise<void>;
  touch(url: string, now: number): Promise<void>;
  remove(urls: readonly string[]): Promise<void>;
  totalBytes(): Promise<number>;
  clear(): Promise<void>;
}

interface Row {
  url: string;
  local_uri: string;
  variant: string;
  bytes: number;
  last_access: number;
}

function toVariant(raw: string): ImageVariant {
  return raw === 'medium' || raw === 'large' ? raw : 'thumb';
}

export function createImageCacheRepository(db: Database): ImageCacheRepository {
  return {
    async getAll() {
      const rows = await db.getAllAsync<Row>(
        'SELECT url, local_uri, variant, bytes, last_access FROM image_cache ORDER BY last_access ASC',
      );
      return rows.map((r) => ({
        url: r.url,
        localUri: r.local_uri,
        variant: toVariant(r.variant),
        bytes: r.bytes,
        lastAccess: r.last_access,
      }));
    },

    async upsert(entry) {
      await db.runAsync(
        `INSERT INTO image_cache (url, local_uri, variant, bytes, last_access) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(url) DO UPDATE SET
           local_uri = excluded.local_uri, variant = excluded.variant,
           bytes = excluded.bytes, last_access = excluded.last_access`,
        [entry.url, entry.localUri, entry.variant, entry.bytes, entry.lastAccess],
      );
    },

    async touch(url, now) {
      await db.runAsync('UPDATE image_cache SET last_access = ? WHERE url = ?', [now, url]);
    },

    async remove(urls) {
      if (urls.length === 0) return;
      const placeholders = urls.map(() => '?').join(', ');
      await db.runAsync(`DELETE FROM image_cache WHERE url IN (${placeholders})`, [...urls]);
    },

    async totalBytes() {
      const row = await db.getFirstAsync<{ total: number | null }>(
        'SELECT SUM(bytes) AS total FROM image_cache',
      );
      return row?.total ?? 0;
    },

    async clear() {
      await db.execAsync('DELETE FROM image_cache');
    },
  };
}
