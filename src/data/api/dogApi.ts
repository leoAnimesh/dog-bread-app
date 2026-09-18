import type { Breed, BreedGroup } from '@/domain';

import { parseCollection, parseSingle, type JsonApiPagination } from './dto';
import type { HttpClient } from './httpClient';
import { mapBreed, mapGroup } from './mappers';

export interface BreedPage {
  breeds: Breed[];
  pagination: JsonApiPagination;
}

/** Interface the sync layer depends on (DIP) — swap for a fake in tests. */
export interface DogApi {
  fetchBreedPage(page: number, signal?: AbortSignal): Promise<BreedPage>;
  fetchBreed(id: string, signal?: AbortSignal): Promise<Breed>;
  fetchGroups(signal?: AbortSignal): Promise<BreedGroup[]>;
}

export function createDogApi(http: HttpClient, pageSize: number): DogApi {
  return {
    async fetchBreedPage(page, signal) {
      const payload = await http.getJson(
        `breeds?page[number]=${page}&page[size]=${pageSize}`,
        signal,
      );
      const collection = parseCollection(payload);
      return {
        breeds: collection.data.map(mapBreed),
        pagination: collection.meta?.pagination ?? {
          current: page,
          next: null,
          last: page,
          records: collection.data.length,
        },
      };
    },

    async fetchBreed(id, signal) {
      const payload = await http.getJson(`breeds/${encodeURIComponent(id)}`, signal);
      return mapBreed(parseSingle(payload).data);
    },

    async fetchGroups(signal) {
      const payload = await http.getJson('groups', signal);
      return parseCollection(payload).data.map(mapGroup);
    },
  };
}
