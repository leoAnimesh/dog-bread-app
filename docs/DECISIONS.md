# Technical decisions

## State management: Zustand

**Chosen:** Zustand with three small stores (`useBreedStore`, `useSyncStore`,
`useFilterStore`).

**Why:** the app has exactly one entity graph (breeds ↔ groups) and a handful of
UI/sync flags. Redux Toolkit would add boilerplate for no benefit; Context +
reducer re-renders every consumer on any change, which is exactly what a
283-row list must avoid. Zustand gives per-selector subscriptions
(`useBreedStore((s) => s.breedsById[id])`), works outside React (the
`SyncService` event binding in `useAppBootstrap` writes to the stores directly),
and is ~1 KB.

**Normalised cache:** `breedsById: Record<id, Breed>` + sorted `breedIds`, same
for groups. A `breed-refreshed` event replaces one entry; `mergeBreeds` from a
sync page replaces 48. Derived views (grouped sections, filtered lists) are
memoised in hooks, not stored.

## Persistence: expo-sqlite

**Chosen:** `expo-sqlite` (async API, WAL mode, prepared statements in
exclusive transactions).

**Why not AsyncStorage:** it is a key/value blob store with a ~2 MB per-item
soft limit on Android; the full dataset serialises to ~1.5 MB and would have to
be rewritten wholesale on every page merge. Partial writes (one page of 48)
and an indexed image-cache table with LRU ordering are natural in SQL and awkward
in AsyncStorage.

**Why not WatermelonDB:** excellent for large, relational, observable datasets,
but it brings a JSI native module, a schema/model DSL and lazy observables that
this 283-row problem doesn't need. expo-sqlite works in Expo Go, so `npm run ios`
"just works" without a dev-client build.

**Schema:** hybrid indexed-columns + JSON payload — see ARCHITECTURE.md.

## API layer: custom client, not React Query

**Chosen:** a small `HttpClient` (timeout, retry with exponential backoff +
jitter, retryable-status classification) → `DogApi` (endpoints, JSON:API
parsing, DTO → domain mapping) → `SyncService`.

**Why not React Query/SWR:** they are request-centric caches keyed by query.
Here the cache is SQLite and the unit of work is "assemble 6 pages into one
dataset, persist each as it lands, remember which failed". Modelling that as
six `useQuery`s plus a merge step would put sync orchestration in render
lifecycle, and we'd have two caches (RQ's in-memory + SQLite) to keep coherent.
A dedicated service with an event stream is simpler to test (`sync.SyncService.test.ts`
covers assembly, partial failure, retry-only-failed and coalescing with fakes)
and to reason about.

**Retry policy:** 4 attempts, 400 ms base, ×2 per attempt, capped at 6 s, +25 %
jitter. 5xx/408/429 and network errors retry; other 4xx fail fast.

**Page assembly:** page 1 first (it carries `pagination.last`), then remaining
pages with concurrency 3. Each page is its own transaction + store merge, so
the UI shows progress and never has to wait for all six. Failed pages are
recorded in `sync_meta` and retried in isolation.

## Offline sync strategy

- **Cache-first, always.** Cold start reads SQLite → renders → then decides
  whether to talk to the network.
- **Freshness window:** 60 min (`EXPO_PUBLIC_STALE_AFTER_MINUTES`). Past it, the
  status dot turns amber and a *Refresh* action appears; the coordinator also
  auto-syncs on app foreground and on reconnect.
- **Reconnect:** `NetworkMonitor` transitions offline→online run a queued
  manual sync if one exists, otherwise a staleness/failed-pages check.
- **Partial failure:** shown as a card under the list, never an error screen.
  Data from pages that did land is used.
- **Detail enrichment:** opening a breed fires `GET /breeds/:id` in the
  background and upserts the fresh record; the footer says when it was last
  refreshed ("Detail refreshed 4 min ago"). Offline, it says so and shows the cached record.

## Navigation: expo-router

Typed routes (`experiments.typedRoutes`) make `router.push({ pathname:
'/breed/[id]', params: { id } })` type-checked. The detail tab lives in the URL
(`?tab=`), so it is deep-linkable and survives back navigation.

## List performance: FlashList v2 with a flattened, typed item list

**The trade-off called out by the brief:** 283 rows is not many, but each row
object is heavy — nested traits (11 numbers + tags), coat (type/colours/length),
origin, `other_names`, `recognized_by`, `sources`, and up to 10 images each with
3 URLs + attribution. Naïvely each row render would touch ~1.5 KB of object
graph and every store update would re-render every row.

What we do about it:

1. **Derive once at mapping time.** `sizeBand`, normalised `coat.length` and a
   lower-cased `searchText` are computed when the DTO is mapped, stored in
   SQLite and never recomputed per render or per keystroke.
2. **Rows only read what they show.** `BreedRow` renders name, first
   thumbnail URL, two other names and a meta line — all derived by tiny pure
   functions (`breedMetaLine`, `otherNamesLine`). It is `memo`ised and its
   props are the breed reference + a stable `onPress`; a sync merging page 4
   does not re-render rows from page 1 because their object identity is
   unchanged.
3. **Flattened sections.** Section headers are list items too (`kind:
   'header' | 'row'`), so FlashList recycles cells by `getItemType` instead of
   nesting a list per group. Fixed row height (84 pt) means no layout
   thrash.
4. **Thumbnails, not payloads.** Only the `thumb` variant of the first image
   is loaded in the list, through the LRU disk cache; `expo-image` gets a
   `recyclingKey` so recycled cells don't flash stale bitmaps.
5. **Search is debounced (300 ms)** and filtering runs over the pre-derived
   fields in a single `useMemo` pass — ~283 string `includes` checks.

## Image caching

Documented in ARCHITECTURE.md → *Image caching policy*. Summary: thumb in
list, medium in the swipeable hero, large in the gallery carousel (visible slide + neighbours only); 60 MB LRU
budget; rows dropped if the OS purged the file.

## Design fidelity

Tokens (palette, type scale, radii, sizes) were transcribed from the supplied
design into `src/theme/tokens.ts` — both the light parchment theme and the dark
theme. Fonts are the design's Karla / Instrument Serif / IBM Plex Mono via
`@expo-google-fonts`.

## What was consciously left out

- No Reanimated/Gesture Handler at runtime. They are installed (expo-router
  peers) but nothing imports them, which keeps ~1 MB of JS out of the bundle
  (see PERFORMANCE.md).
- No push-to-SQL filtering — in-memory is faster at this scale and keeps
  `matchesFilters` a pure, unit-tested function.
- No background fetch task. "Background sync when network returns" is
  implemented as foreground reconnect + app-active checks, which is what an
  Expo Go–runnable app can do without a dev-client build.
