import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { Breed } from '@/domain';
import { useGallery } from '@/hooks/useGallery';
import { useTheme } from '@/theme';

import { AppText, IconButton } from '../atoms';
import { AttributionCard, BreedThumbnail } from '../molecules';
import { ImageCarousel } from './ImageCarousel';

/** Large variant is fetched only when the image is shown — thumbs power the strip. */
export function GalleryTab({ breed }: { breed: Breed }) {
  const { colors, radii, sizes } = useTheme();
  const gallery = useGallery(breed.images);

  if (breed.images.length === 0 || !gallery.current) {
    return (
      <View style={styles.container}>
        <AppText variant="bodySmall" tone="textMuted">
          No images are available for this breed.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.stage,
          { backgroundColor: colors.surfaceHero, borderColor: colors.border, borderRadius: radii.xxl },
        ]}
      >
        <ImageCarousel
          images={breed.images}
          variant="large"
          index={gallery.index}
          onIndexChange={gallery.goTo}
          breedName={breed.name}
          testID="gallery-carousel"
        />
        <View style={styles.stageTop} pointerEvents="none">
          <View style={[styles.pill, { backgroundColor: 'rgba(27,24,21,0.72)' }]} testID="gallery-counter">
            <AppText variant="monoSmall" color="#FBF8F1">
              {gallery.index + 1} / {gallery.count}
            </AppText>
          </View>
        </View>
        <View style={styles.stageMiddle} pointerEvents="box-none">
          <IconButton
            icon="chevron-left"
            accessibilityLabel="Previous image"
            onPress={gallery.prev}
            variant="translucent"
            disabled={gallery.count < 2}
            testID="gallery-prev"
          />
          <View />
          <IconButton
            icon="chevron-right"
            accessibilityLabel="Next image"
            onPress={gallery.next}
            variant="translucent"
            disabled={gallery.count < 2}
            testID="gallery-next"
          />
        </View>
        <View style={styles.dots} pointerEvents="none">
          {gallery.dots.map((dot) => (
            <View
              key={dot.id}
              style={[styles.dot, { backgroundColor: dot.active ? '#FBF8F1' : 'rgba(251,248,241,0.45)' }]}
            />
          ))}
        </View>
      </View>

      <AttributionCard attribution={gallery.current.attribution} />

      <View style={styles.stripSection}>
        <View style={styles.stripHeader}>
          <AppText variant="monoLabel" weight="medium" tone="textMuted">
            All images
          </AppText>
          <AppText variant="monoLabel" tone="textMuted">
            Thumb variant
          </AppText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
          {breed.images.map((image, i) => (
            <Pressable
              key={image.id}
              onPress={() => gallery.goTo(i)}
              accessibilityRole="button"
              accessibilityLabel={`Show image ${i + 1}`}
              accessibilityState={{ selected: i === gallery.index }}
              style={[
                styles.thumbFrame,
                { borderColor: i === gallery.index ? colors.accent : 'transparent', borderRadius: radii.md + 2 },
              ]}
            >
              <BreedThumbnail url={image.thumb} size={sizes.galleryThumb} recyclingKey={image.id} />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 14 },
  stage: { height: 292, borderWidth: 1, padding: 14, justifyContent: 'space-between', overflow: 'hidden' },
  stageTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stageMiddle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  pill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  stripSection: { gap: 8 },
  stripHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  strip: { flexDirection: 'row', gap: 8 },
  thumbFrame: { borderWidth: 2, padding: 1 },
});
