import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import React, { useCallback, type ReactElement } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { BreedListItem } from '@/hooks/useBreedList';
import { useTheme } from '@/theme';

import { BreedRow, GroupHeader } from '../molecules';

export interface BreedListProps {
  items: BreedListItem[];
  onPressBreed: (id: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
  header: ReactElement;
  footer?: ReactElement | null;
  empty?: ReactElement | null;
}

/**
 * Virtualised list of 283 heavy rows. Two item types (header/row) let
 * FlashList recycle cells by type; rows are memoised and fixed-height.
 */
export function BreedList({
  items,
  onPressBreed,
  refreshing,
  onRefresh,
  header,
  footer,
  empty,
}: BreedListProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<BreedListItem>) =>
      <View style={styles.item}>
        {item.kind === 'header' ? (
          <GroupHeader label={item.label} count={item.count} />
        ) : (
          <BreedRow breed={item.breed} onPress={onPressBreed} />
        )}
      </View>,
    [onPressBreed],
  );

  return (
    <FlashList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      ListHeaderComponent={header}
      ListFooterComponent={footer ?? undefined}
      ListEmptyComponent={empty ?? undefined}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.positive} />
      }
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      drawDistance={600}
      testID="breed-list"
    />
  );
}

const keyExtractor = (item: BreedListItem) => item.key;
const getItemType = (item: BreedListItem) => item.kind;

const styles = StyleSheet.create({
  item: { paddingHorizontal: 20 },
});
