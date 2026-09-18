import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText, Icon } from '../atoms';

export interface OfflineBannerProps {
  lastSyncedLabel: string;
  compact?: boolean;
}

/** Persistent (not a toast) — sits above the title while offline. */
export function OfflineBanner({ lastSyncedLabel, compact = false }: OfflineBannerProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.banner, { backgroundColor: colors.offlineBackground }, compact && styles.compact]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      testID="offline-banner"
    >
      <Icon name="offline" size={18} color={colors.offlineText} />
      <View style={styles.text}>
        <AppText variant="labelStrong" weight="bold" tone="offlineText">
          You&apos;re offline — showing cached breeds
        </AppText>
        {!compact ? (
          <AppText variant="monoLabel" tone="offlineTextMuted">
            {lastSyncedLabel}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
  },
  compact: { paddingVertical: 11, borderRadius: 10 },
  text: { flex: 1, minWidth: 0, gap: 2 },
});
