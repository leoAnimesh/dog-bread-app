import React, { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { breedMetaLine, otherNamesLine, type Breed } from '@/domain';
import { useTheme } from '@/theme';

import { AppText, Icon } from '../atoms';
import { BreedThumbnail } from './BreedThumbnail';

export interface BreedRowProps {
  breed: Breed;
  onPress: (id: string) => void;
}

export const BREED_ROW_HEIGHT = 84;

/**
 * One list row. Memoised and fed only primitives-derived strings so the 283
 * heavy breed objects don't cause re-renders on unrelated store updates.
 */
export const BreedRow = memo(function BreedRow({ breed, onPress }: BreedRowProps) {
  const { colors, sizes } = useTheme();
  const alt = otherNamesLine(breed.otherNames);
  const meta = breedMetaLine(breed);
  const thumb = breed.images[0]?.thumb ?? null;

  return (
    <Pressable
      onPress={() => onPress(breed.id)}
      accessibilityRole="button"
      accessibilityLabel={`${breed.name}${alt ? `, also ${breed.otherNames.slice(0, 2).join(', ')}` : ''}. ${meta}`}
      accessibilityHint="Opens breed details"
      testID={`breed-row-${breed.id}`}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.dividerSubtle, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <BreedThumbnail url={thumb} size={sizes.thumb} recyclingKey={breed.id} />
      <View style={styles.text}>
        <AppText variant="name" numberOfLines={1}>
          {breed.name}
        </AppText>
        {alt ? (
          <AppText variant="monoSmall" tone="textMuted" numberOfLines={1}>
            {alt}
          </AppText>
        ) : null}
        <AppText variant="bodySmall" tone="textTertiary" numberOfLines={1}>
          {meta}
        </AppText>
      </View>
      <Icon name="chevron-right" size={16} color={colors.chevron} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    height: BREED_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  text: { flex: 1, minWidth: 0, gap: 3 },
});
