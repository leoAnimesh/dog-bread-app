import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { ImageVariant } from '@/data/db/repositories/ImageCacheRepository';
import { useCachedImage } from '@/hooks/useCachedImage';
import { useTheme } from '@/theme';

import { Icon } from '../atoms';

export interface BreedThumbnailProps {
  url: string | null;
  size: number;
  variant?: ImageVariant;
  radius?: number;
  /** Keeps the same native view when the row is recycled for another breed */
  recyclingKey?: string;
  accessibilityLabel?: string;
}

/** Thumbnail routed through the LRU disk cache with a paw placeholder. */
export function BreedThumbnail({
  url,
  size,
  variant = 'thumb',
  radius,
  recyclingKey,
  accessibilityLabel,
}: BreedThumbnailProps) {
  const { colors, radii } = useTheme();
  const { uri } = useCachedImage(url, variant);

  return (
    <View
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: radius ?? radii.md,
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.divider,
        },
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      <Icon name="paw" size={Math.round(size * 0.4)} color={colors.placeholderIcon} />
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={120}
          recyclingKey={recyclingKey}
          cachePolicy="memory"
          accessible={false}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
