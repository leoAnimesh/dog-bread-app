import { render, type RenderOptions } from '@testing-library/react-native';
import React, { type ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Breed, BreedGroup } from '@/domain';
import { mapBreed, mapGroup } from '@/data/api/mappers';
import { parseCollection } from '@/data/api/dto';
import type { ImageCacheService } from '@/data/images/ImageCacheService';
import type { Services } from '@/services/createServices';
import { ServicesProvider } from '@/services/ServicesProvider';
import { ThemeProvider } from '@/theme';

import breedsPage from './fixtures/breeds-page.json';
import groupsPayload from './fixtures/groups.json';

export const fixtureBreeds: Breed[] = parseCollection(breedsPage).data.map(mapBreed);
export const fixtureGroups: BreedGroup[] = parseCollection(groupsPayload).data.map(mapGroup);

export function breedNamed(name: string): Breed {
  const breed = fixtureBreeds.find((b) => b.name === name);
  if (!breed) throw new Error(`No fixture breed named ${name}`);
  return breed;
}

export function createFakeImageCache(): ImageCacheService {
  return {
    hydrate: jest.fn(() => Promise.resolve()),
    getLocalUri: jest.fn(() => null),
    ensure: jest.fn((url: string) => Promise.resolve(url)),
    prefetch: jest.fn(),
    totalBytes: () => 0,
    clear: jest.fn(() => Promise.resolve()),
    subscribe: jest.fn(() => () => undefined),
  };
}

/** Minimal Services double — only what components reach for. */
export function createFakeServices(overrides: Partial<Services> = {}): Services {
  const base = {
    env: {
      apiBaseUrl: 'https://example.test',
      apiPageSize: 48,
      staleAfterMs: 3_600_000,
      imageCacheLimitBytes: 1_000_000,
      searchDebounceMs: 0,
    },
    images: createFakeImageCache(),
    sync: {
      syncAll: jest.fn(),
      retryFailedPages: jest.fn(),
      refreshBreed: jest.fn(() => Promise.reject(new Error('offline'))),
      subscribe: jest.fn(() => () => undefined),
      isRunning: () => false,
    },
    coordinator: {
      syncIfNeeded: jest.fn(() => Promise.resolve()),
      requestSync: jest.fn(() => Promise.resolve()),
      hasQueuedSync: () => false,
      subscribeQueued: jest.fn(() => () => undefined),
      start: jest.fn(() => () => undefined),
    },
    network: {
      isOnline: () => true,
      subscribe: jest.fn(() => () => undefined),
      refresh: jest.fn(() => Promise.resolve(true)),
    },
  };
  return { ...(base as unknown as Services), ...overrides };
}

const TEST_SAFE_AREA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/** RNTL 14 renders asynchronously (React 19 concurrent mode) — always await. */
export async function renderWithProviders(
  ui: ReactElement,
  options: { services?: Services; scheme?: 'light' | 'dark' } & RenderOptions = {},
) {
  const { services: givenServices, scheme, ...renderOptions } = options;
  const services = givenServices ?? createFakeServices();
  return render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>
      <ThemeProvider scheme={scheme ?? 'light'}>
        <ServicesProvider services={services}>{ui}</ServicesProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
    renderOptions,
  );
}
