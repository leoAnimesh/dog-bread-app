/**
 * Loosely-typed shapes of the JSON:API payload returned by dogapi.dog v2.
 * Everything is optional/nullable on purpose: the source data is messy and
 * the mapper (mappers.ts) is responsible for producing a clean domain model.
 */

import { isRecord, isString } from '@/utils/guards';

export interface JsonApiResource {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, unknown>;
}

export interface JsonApiPagination {
  current: number;
  next: number | null;
  last: number;
  records: number;
}

export interface JsonApiCollection {
  data: JsonApiResource[];
  meta?: { pagination?: JsonApiPagination };
}

export interface JsonApiSingle {
  data: JsonApiResource;
}

export function isJsonApiResource(value: unknown): value is JsonApiResource {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.type) &&
    isRecord(value.attributes)
  );
}

export function parseCollection(payload: unknown): JsonApiCollection {
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    throw new TypeError('Malformed JSON:API collection: missing data array');
  }
  const data = payload.data.filter(isJsonApiResource);
  let pagination: JsonApiPagination | undefined;
  if (isRecord(payload.meta) && isRecord(payload.meta.pagination)) {
    const p = payload.meta.pagination;
    pagination = {
      current: typeof p.current === 'number' ? p.current : 1,
      next: typeof p.next === 'number' ? p.next : null,
      last: typeof p.last === 'number' ? p.last : 1,
      records: typeof p.records === 'number' ? p.records : data.length,
    };
  }
  return { data, meta: pagination ? { pagination } : undefined };
}

export function parseSingle(payload: unknown): JsonApiSingle {
  if (!isRecord(payload) || !isJsonApiResource(payload.data)) {
    throw new TypeError('Malformed JSON:API resource');
  }
  return { data: payload.data };
}
