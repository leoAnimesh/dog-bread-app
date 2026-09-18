import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { ActiveFilterChip } from '@/hooks/useActiveFilterChips';
import type { SyncStatusView } from '@/hooks/useSyncStatus';
import { useTheme } from '@/theme';

import { AppText, Chip, Icon, IconButton } from '../atoms';
import { SearchField, SyncStatusStrip } from '../molecules';

export interface BreedListHeaderProps {
  totalCount: number;
  groupCount: number;
  matchCount: number;
  isFiltering: boolean;
  status: SyncStatusView;
  query: string;
  onQueryChange: (q: string) => void;
  activeFilterCount: number;
  activeChips: ActiveFilterChip[];
  onOpenFilters: () => void;
  onClearFilters: () => void;
  onSyncNow: () => void;
}

/** Title block + freshness strip + search/filters row + active chips + result count. */
export function BreedListHeader({
  totalCount,
  groupCount,
  matchCount,
  isFiltering,
  status,
  query,
  onQueryChange,
  activeFilterCount,
  activeChips,
  onOpenFilters,
  onClearFilters,
  onSyncNow,
}: BreedListHeaderProps) {
  const { colors, radii, sizes } = useTheme();
  const offline = !status.isOnline;

  return (
    <View style={[styles.container, { paddingTop: offline ? 16 : 4 }]}>
      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <AppText variant="display" accessibilityRole="header">
            Breeds
          </AppText>
          <AppText variant="monoLabel" tone="textMuted">
            {offline ? `${totalCount} cached` : `${totalCount} records`} · {groupCount} groups
          </AppText>
        </View>
        <IconButton
          icon="refresh"
          accessibilityLabel={offline ? 'Queue a sync for when you are back online' : 'Sync now'}
          onPress={onSyncNow}
          disabled={status.isSyncing}
          variant={offline ? 'dashed' : 'surface'}
          tint={offline ? colors.iconMuted : colors.positive}
          testID="sync-now"
        />
      </View>

      <SyncStatusStrip status={status} onRefresh={onSyncNow} />

      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <SearchField
            value={query}
            onChangeText={onQueryChange}
            placeholder={offline ? `Search ${totalCount} cached breeds` : 'Name or other names'}
            testID="breed-search"
          />
        </View>
        <Pressable
          onPress={onOpenFilters}
          accessibilityRole="button"
          accessibilityLabel={`Filters, ${activeFilterCount} active`}
          testID="open-filters"
          style={({ pressed }) => [
            styles.filtersButton,
            {
              width: sizes.searchField,
              height: sizes.searchField,
              borderRadius: radii.lg,
              backgroundColor: colors.inverse,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Icon name="filters" size={18} color={colors.inverseText} />
          {activeFilterCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.accent, borderColor: colors.background }]}>
              <AppText variant="monoSmall" color={colors.textOnAccent}>
                {activeFilterCount}
              </AppText>
            </View>
          ) : null}
        </Pressable>
      </View>

      {activeChips.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          keyboardShouldPersistTaps="handled"
        >
          {activeChips.map((chip) => (
            <Chip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
          ))}
          <Pressable
            onPress={onClearFilters}
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
            hitSlop={8}
            testID="clear-filters"
            style={styles.clearAll}
          >
            <AppText variant="label" weight="semibold" tone="accentText">
              Clear all
            </AppText>
          </Pressable>
        </ScrollView>
      ) : null}

      <AppText variant="monoLabel" tone="textMuted" accessibilityLiveRegion="polite">
        {isFiltering ? `${matchCount} of ${totalCount} breeds` : `${totalCount} breeds`} · sorted by
        group
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, gap: 12 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: { gap: 4 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchField: { flex: 1, minWidth: 0 },
  filtersButton: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  clearAll: { paddingHorizontal: 6, height: 34, justifyContent: 'center' },
});
