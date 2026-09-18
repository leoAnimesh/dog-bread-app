import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  AppText,
  CompactDetailHeader,
  DetailHero,
  DetailTabBar,
  EmptyState,
  ErrorBoundary,
  FooterStrip,
  GalleryTab,
  OverviewTab,
  Screen,
  StatusDot,
  TraitsTab,
  type DetailTab,
} from '@/components';
import { useBreedDetail } from '@/hooks/useBreedDetail';
import { useNow } from '@/hooks/useNow';
import { formatRelativeTime } from '@/utils/time';

export interface BreedDetailScreenProps {
  id: string;
  /** Controlled by the route so `?tab=` deep links and back navigation restore it */
  tab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
}

export function BreedDetailScreen({ id, tab, onTabChange }: BreedDetailScreenProps) {
  const router = useRouter();
  const detail = useBreedDetail(id);
  const now = useNow(30_000);

  const back = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);


  if (!detail.breed) {
    return (
      <Screen testID="breed-detail-screen">
        <CompactDetailHeader name="Breed" subtitle="Not in cache" onBack={back} />
        <View style={styles.padded}>
          <EmptyState
            title="This breed isn't cached yet"
            body={
              detail.isOnline
                ? detail.refreshing
                  ? 'Fetching it now…'
                  : detail.refreshError ?? 'Go back and sync the catalogue first.'
                : 'Connect to the internet to load it.'
            }
            actionLabel="Back to breeds"
            onAction={back}
          />
        </View>
      </Screen>
    );
  }

  const { breed, group } = detail;
  const groupLabel = group?.label.toUpperCase() ?? 'UNGROUPED';
  const footerLabel = detail.refreshing
    ? 'Refreshing detail…'
    : detail.refreshedAt
      ? `Detail refreshed ${formatRelativeTime(detail.refreshedAt, now)}`
      : detail.isOnline
        ? detail.refreshError
          ? 'Showing cached detail · refresh failed'
          : 'Showing cached detail'
        : 'Offline · showing cached detail';

  return (
    <Screen topInset={tab !== 'overview'} testID="breed-detail-screen">
      <ScrollView contentContainerStyle={styles.scroll} stickyHeaderIndices={[1]}>
        {tab === 'overview' ? (
          <DetailHero breed={breed} group={group} onBack={back} />
        ) : (
          <CompactDetailHeader
            name={breed.name}
            subtitle={
              tab === 'traits'
                ? `${groupLabel} · 11 TRAIT SCORES`
                : `${breed.images.length} IMAGES · 3 VARIANTS EACH`
            }
            onBack={back}
          />
        )}
        <StickyTabs active={tab} onChange={onTabChange} />
        <ErrorBoundary feature="the breed details">
          {tab === 'overview' ? <OverviewTab breed={breed} /> : null}
          {tab === 'traits' ? <TraitsTab breed={breed} /> : null}
          {tab === 'gallery' ? <GalleryTab breed={breed} /> : null}
        </ErrorBoundary>
      </ScrollView>
      <FooterStrip>
        <View style={styles.footerRow}>
          <StatusDot tone={detail.refreshError ? 'accent' : detail.isOnline ? 'positive' : 'muted'} />
          <AppText variant="monoLabel" tone="textTertiary" style={{ textTransform: 'none' }} numberOfLines={1}>
            {footerLabel}
          </AppText>
        </View>
      </FooterStrip>
    </Screen>
  );
}

/** Wrapped so the sticky header has an opaque background while scrolling. */
function StickyTabs({ active, onChange }: { active: DetailTab; onChange: (t: DetailTab) => void }) {
  return (
    <View style={styles.sticky}>
      <DetailTabBar active={active} onChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 12 },
  padded: { paddingHorizontal: 20 },
  sticky: { backgroundColor: 'transparent' },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
});
