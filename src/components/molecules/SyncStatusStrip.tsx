import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { SyncStatusView } from '@/hooks/useSyncStatus';

import { AppText, ProgressBar, StatusDot, TextButton } from '../atoms';

export interface SyncStatusStripProps {
  status: SyncStatusView;
  onRefresh?: () => void;
}

/**
 * The freshness strip under the title. Maps the six designed states:
 * fresh (sage dot) · syncing (progress bar) · stale (amber dot + Refresh) ·
 * offline / partial (handled by banner + card, strip shows last sync).
 */
export function SyncStatusStrip({ status, onRefresh }: SyncStatusStripProps) {
  if (status.state === 'syncing') {
    return (
      <View style={styles.column} accessibilityLiveRegion="polite">
        <View style={styles.row}>
          <AppText variant="mono" tone="textSecondary">
            {status.label}
          </AppText>
          <View style={styles.spacer} />
          <AppText variant="mono" tone="textMuted">
            {status.detail}
          </AppText>
        </View>
        <ProgressBar ratio={status.progressRatio ?? 0} />
      </View>
    );
  }

  const tone =
    status.state === 'fresh'
      ? 'positive'
      : status.state === 'stale' || status.state === 'never'
        ? 'warning'
        : status.state === 'partial'
          ? 'accent'
          : 'muted';

  return (
    <View style={styles.row} accessibilityLiveRegion="polite">
      <StatusDot tone={tone} />
      <AppText variant="mono" tone="textTertiary">
        {status.label}
      </AppText>
      <View style={styles.spacer} />
      {(status.state === 'stale' || status.state === 'never') && onRefresh && status.isOnline ? (
        <TextButton label="Refresh" onPress={onRefresh} height={30} />
      ) : status.queuedSync ? (
        <AppText variant="mono" tone="textMuted">
          Sync queued for reconnect
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 30 },
  column: { gap: 8 },
  spacer: { flexGrow: 1 },
});
