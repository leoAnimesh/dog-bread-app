import { Image } from 'expo-image';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import type { ImageVariant } from '@/data/db/repositories/ImageCacheRepository';
import type { BreedImage } from '@/domain';
import { useCachedImage } from '@/hooks/useCachedImage';
import { useTheme } from '@/theme';

import { Icon } from '../atoms';

export interface ImageCarouselProps {
  images: readonly BreedImage[];
  /** Which variant to load for each slide — medium in the hero, large in the gallery */
  variant: Exclude<ImageVariant, 'thumb'>;
  /** Controlled index; arrows / thumbnails set it, swipes report it */
  index: number;
  onIndexChange: (index: number) => void;
  breedName: string;
  testID?: string;
}

/** Page index for a horizontal offset. Exported for tests. */
export function pageForOffset(offsetX: number, pageWidth: number, count: number): number {
  if (pageWidth <= 0 || count === 0) return 0;
  return Math.max(0, Math.min(count - 1, Math.round(offsetX / pageWidth)));
}

/**
 * Swipeable, paged image carousel. Only the visible slide and its neighbours
 * are mounted (windowSize 3), so only those variants are fetched into the
 * disk cache — a 10-image gallery never downloads 10 large files up front.
 */
export function ImageCarousel({
  images,
  variant,
  index,
  onIndexChange,
  breedName,
  testID,
}: ImageCarouselProps) {
  const listRef = useRef<FlatList<BreedImage>>(null);
  const [width, setWidth] = useState(0);
  const reported = useRef(index);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(Math.round(e.nativeEvent.layout.width));
  }, []);

  // Index changed from outside (arrow / thumbnail) → scroll to it.
  useEffect(() => {
    if (width === 0 || reported.current === index) return;
    reported.current = index;
    listRef.current?.scrollToOffset({ offset: index * width, animated: true });
  }, [index, width]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = pageForOffset(e.nativeEvent.contentOffset.x, width, images.length);
      if (page !== reported.current) {
        reported.current = page;
        onIndexChange(page);
      }
    },
    [width, images.length, onIndexChange],
  );

  const renderItem = useCallback(
    ({ item, index: i }: ListRenderItemInfo<BreedImage>) => (
      <Slide
        url={item[variant]}
        variant={variant}
        width={width}
        label={`${breedName}, image ${i + 1} of ${images.length}`}
      />
    ),
    [variant, width, breedName, images.length],
  );

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} testID={testID}>
      {width > 0 ? (
        <FlatList
          ref={listRef}
          data={images as BreedImage[]}
          keyExtractor={(img) => img.id}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={images.length > 1}
          scrollEnabled={images.length > 1}
          initialScrollIndex={Math.min(index, Math.max(0, images.length - 1))}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={onMomentumScrollEnd}
          initialNumToRender={1}
          windowSize={3}
          maxToRenderPerBatch={1}
          removeClippedSubviews
          accessibilityRole="adjustable"
          accessibilityLabel={`${breedName} photos`}
          accessibilityValue={{ min: 1, max: images.length, now: index + 1 }}
          onAccessibilityAction={(e) => {
            const next = e.nativeEvent.actionName === 'increment' ? index + 1 : index - 1;
            if (next >= 0 && next < images.length) onIndexChange(next);
          }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          testID={testID ? `${testID}-list` : undefined}
        />
      ) : null}
    </View>
  );
}

const Slide = memo(function Slide({
  url,
  variant,
  width,
  label,
}: {
  url: string;
  variant: ImageVariant;
  width: number;
  label: string;
}) {
  const { colors } = useTheme();
  const { uri } = useCachedImage(url, variant);
  return (
    <View style={[styles.slide, { width }]}>
      <Icon name="paw" size={48} color={colors.placeholderIcon} />
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          cachePolicy="memory"
          accessibilityLabel={label}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  slide: { height: '100%', alignItems: 'center', justifyContent: 'center' },
});
