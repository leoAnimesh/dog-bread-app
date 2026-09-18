import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BreedList,
  BreedListHeader,
  EmptyState,
  ErrorBoundary,
  OfflineBanner,
  PartialFailureCard,
  Screen,
} from '@/components';
import { useActiveFilterChips } from '@/hooks/useActiveFilterChips';
import { useBreedList } from '@/hooks/useBreedList';
import { useSyncActions } from '@/hooks/useSyncActions';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { useServices } from '@/services/ServicesProvider';
import { useFilterStore } from '@/store/useFilterStore';
import { useTheme } from '@/theme';
import { formatRelativeTime } from '@/utils/time';

export function BreedListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { env } = useServices();
  const list = useBreedList();
  const status = useSyncStatus();
  const chips = useActiveFilterChips();
  const { syncNow, retryFailed } = useSyncActions();

  const query = useFilterStore((s) => s.query);
  const setQuery = useFilterStore((s) => s.setQuery);
  const clearFilters = useFilterStore((s) => s.clearFilters);

  const openBreed = useCallback(
    (id: string) => router.push({ pathname: '/breed/[id]', params: { id } }),
    [router],
  );
  const openFilters = useCallback(() => router.push('/filters'), [router]);
  const clearAll = useCallback(() => {
    clearFilters();
    setQuery('');
  }, [clearFilters, setQuery]);

  const offline = !status.isOnline;
  const lastSyncedLabel = status.lastSyncedAt
    ? `Last synced ${formatRelativeTime(status.lastSyncedAt)}`
    : 'Never synced';

  const header = useMemo(
    () => (
      <BreedListHeader
        totalCount={list.totalCount}
        groupCount={list.groupCount}
        matchCount={list.matchCount}
        isFiltering={list.isFiltering}
        status={status}
        query={query}
        onQueryChange={setQuery}
        activeFilterCount={list.activeFilterCount}
        activeChips={chips}
        onOpenFilters={openFilters}
        onClearFilters={clearAll}
        onSyncNow={syncNow}
      />
    ),
    [list, status, query, setQuery, chips, openFilters, clearAll, syncNow],
  );

  const footer = useMemo(
    () =>
      status.failedPages.length > 0 ? (
        <View style={styles.padded}>
          <PartialFailureCard
            failedPages={status.failedPages}
            totalPages={status.totalPages}
            pageSize={env.apiPageSize}
            isOnline={status.isOnline}
            onRetry={retryFailed}
          />
        </View>
      ) : null,
    [status.failedPages, status.totalPages, status.isOnline, env.apiPageSize, retryFailed],
  );

  const empty = useMemo(() => {
    if (!list.hydrated) return null;
    if (list.isEmptyCache) {
      return (
        <View style={styles.padded}>
          <EmptyState
            title={offline ? 'Nothing cached yet' : status.isSyncing ? 'Fetching 283 breeds…' : 'No breeds yet'}
            body={
              offline
                ? 'Connect once to download the breed catalogue. After that the app works fully offline.'
                : status.isSyncing
                  ? 'Pages merge in as each request lands.'
                  : status.lastError ?? 'Pull to refresh or tap sync to fetch the catalogue.'
            }
            actionLabel={offline || status.isSyncing ? undefined : 'Sync now'}
            onAction={syncNow}
          />
        </View>
      );
    }
    return (
      <View style={styles.padded}>
        <EmptyState
          title="No breeds match those filters"
          body="Try removing a filter or widening the trait threshold — some combinations have no overlap in the dataset."
          actionLabel="Clear filters"
          onAction={clearAll}
        />
      </View>
    );
  }, [list.hydrated, list.isEmptyCache, offline, status.isSyncing, status.lastError, syncNow, clearAll]);

  return (
    <Screen topColor={offline ? colors.offlineBackground : undefined} testID="breed-list-screen">
      {offline ? <OfflineBanner lastSyncedLabel={lastSyncedLabel} /> : null}
      <ErrorBoundary feature="the breed list">
        <BreedList
          items={list.items}
          onPressBreed={openBreed}
          refreshing={status.isSyncing && status.state === 'syncing' && list.totalCount === 0}
          onRefresh={syncNow}
          header={header}
          footer={footer}
          empty={empty}
        />
      </ErrorBoundary>
    </Screen>
  );
}

const styles = StyleSheet.create({
  padded: { paddingHorizontal: 20 },
});
