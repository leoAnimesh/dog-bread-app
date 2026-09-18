/**
 * Schema design (documented in docs/ARCHITECTURE.md):
 *
 * Hybrid "indexed columns + JSON payload". The 283 breed rows are rich
 * (nested traits, coat, origin, up to 10 images each) and are always read as a
 * whole set, so the full domain object is stored as JSON in `payload`. The
 * columns the filters depend on are also projected out so they can be indexed
 * and queried in SQL if the dataset ever outgrows in-memory filtering.
 */

export const SCHEMA_VERSION = 1;

export const MIGRATIONS: Record<number, string> = {
  1: `
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS groups (
      id          TEXT PRIMARY KEY NOT NULL,
      name        TEXT NOT NULL,
      label       TEXT NOT NULL,
      breed_ids   TEXT NOT NULL DEFAULT '[]',
      updated_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS breeds (
      id                  TEXT PRIMARY KEY NOT NULL,
      name                TEXT NOT NULL,
      group_id            TEXT,
      size_band           TEXT NOT NULL,
      coat_length         TEXT NOT NULL,
      hypoallergenic      INTEGER,
      good_with_children  INTEGER,
      good_with_dogs      INTEGER,
      good_with_strangers INTEGER,
      search_text         TEXT NOT NULL,
      payload             TEXT NOT NULL,
      page_number         INTEGER,
      updated_at          INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_breeds_group ON breeds(group_id);
    CREATE INDEX IF NOT EXISTS idx_breeds_name  ON breeds(name);

    CREATE TABLE IF NOT EXISTS sync_meta (
      key    TEXT PRIMARY KEY NOT NULL,
      value  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS image_cache (
      url          TEXT PRIMARY KEY NOT NULL,
      local_uri    TEXT NOT NULL,
      variant      TEXT NOT NULL,
      bytes        INTEGER NOT NULL,
      last_access  INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_image_cache_access ON image_cache(last_access);
  `,
};
