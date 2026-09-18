import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Breed, BreedGroup } from '@/domain';
import { formatRange, SIZE_BAND_LABELS } from '@/domain/labels';
import { useTheme } from '@/theme';

import { AppText, Chip, Icon, IconButton } from '../atoms';
import { ImageCarousel } from './ImageCarousel';

export interface DetailHeroProps {
  breed: Breed;
  group: BreedGroup | null;
  onBack: () => void;
}

/** Swipeable medium-variant hero with back button, plus title + tag row. */
export function DetailHero({ breed, group, onBack }: DetailHeroProps) {
  const { colors, sizes } = useTheme();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const count = breed.images.length;
  const weightLabel =
    breed.sizeBand === 'unknown'
      ? null
      : `${SIZE_BAND_LABELS[breed.sizeBand]} · ${formatRange(breed.maleWeight, 'kg')}`;

  return (
    <View>
      <View
        style={[
          styles.hero,
          {
            height: sizes.hero + insets.top,
            backgroundColor: colors.surfaceHero,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {count > 0 ? (
          <ImageCarousel
            images={breed.images}
            variant="medium"
            index={index}
            onIndexChange={setIndex}
            breedName={breed.name}
            testID="hero-carousel"
          />
        ) : (
          <View style={styles.placeholder} pointerEvents="none">
            <Icon name="paw" size={56} color={colors.placeholderIcon} />
          </View>
        )}

        {/* Overlay passes touches through so the carousel underneath stays swipeable. */}
        <View
          style={[styles.overlay, { paddingTop: insets.top + 8 }]}
          pointerEvents="box-none"
        >
          <View pointerEvents="box-none">
            <IconButton
              icon="arrow-left"
              accessibilityLabel="Back to breeds"
              onPress={onBack}
              variant="translucent"
              testID="detail-back"
            />
          </View>
          <View style={styles.heroFooter} pointerEvents="none">
            <View />
            {count > 0 ? (
              <View style={styles.pill} testID="hero-counter">
                <AppText variant="monoSmall" color="#FBF8F1">
                  {index + 1} / {count}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.titleBlock}>
        <AppText variant="title" accessibilityRole="header">
          {breed.name}
        </AppText>
        {breed.otherNames.length > 0 ? (
          <AppText variant="monoLabel" tone="textMuted" numberOfLines={1}>
            Also: {breed.otherNames.join(' · ')}
          </AppText>
        ) : null}
        <View style={styles.tags}>
          {group ? <Chip label={group.label} variant="positive" size="sm" /> : null}
          {weightLabel ? <Chip label={weightLabel} size="sm" /> : null}
          {breed.hypoallergenic !== null ? (
            <Chip
              label={breed.hypoallergenic ? 'Hypoallergenic' : 'Not hypoallergenic'}
              size="sm"
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderBottomWidth: 1, overflow: 'hidden' },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    paddingHorizontal: 20,
    paddingBottom: 14,
    justifyContent: 'space-between',
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  pill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(27,24,21,0.72)',
  },
  titleBlock: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingTop: 2 },
});
