import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback } from 'react';

import { isDetailTab, type DetailTab } from '@/components/molecules/DetailTabBar';
import { BreedDetailScreen } from '@/screens/BreedDetailScreen';

/**
 * /breed/:id?tab=overview|traits|gallery
 * The tab lives in the URL so deep links and back navigation restore it.
 */
export default function BreedDetailRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; tab?: string }>();
  const id = typeof params.id === 'string' ? params.id : null;
  const tab: DetailTab = isDetailTab(params.tab) ? params.tab : 'overview';

  const onTabChange = useCallback((next: DetailTab) => router.setParams({ tab: next }), [router]);

  if (!id) return <Redirect href="/" />;
  return <BreedDetailScreen id={id} tab={tab} onTabChange={onTabChange} />;
}
