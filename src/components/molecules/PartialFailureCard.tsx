import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText, Icon, TextButton } from '../atoms';

export interface PartialFailureCardProps {
  failedPages: number[];
  totalPages: number;
  pageSize: number;
  isOnline: boolean;
  onRetry: () => void;
}

export function describeFailedPages(failedPages: number[], totalPages: number): string {
  if (failedPages.length === 1) return `Page ${failedPages[0]} of ${totalPages} failed to sync`;
  return `${failedPages.length} of ${totalPages} pages failed to sync`;
}

/** Partial data is shown, never hidden behind an error screen. */
export function PartialFailureCard({
  failedPages,
  totalPages,
  pageSize,
  isOnline,
  onRetry,
}: PartialFailureCardProps) {
  const { colors, radii } = useTheme();
  const affected = failedPages.length * pageSize;
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.errorBackground,
          borderColor: colors.errorBorder,
          borderRadius: radii.xl,
        },
      ]}
      accessibilityRole="alert"
      testID="partial-failure-card"
    >
      <Icon name="alert" size={18} color={colors.errorAccent} />
      <View style={styles.body}>
        <AppText variant="labelStrong" weight="bold" tone="errorTitle">
          {describeFailedPages(failedPages, totalPages)}
        </AppText>
        <AppText variant="bodySmall" tone="errorText">
          Up to {affected} breeds may be out of date. Everything else is current.
        </AppText>
        <View style={styles.actions}>
          <TextButton
            label={isOnline ? 'Retry now' : 'Retry when online'}
            onPress={onRetry}
            variant="error"
            height={34}
            disabled={!isOnline}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginTop: 16,
  },
  body: { flex: 1, minWidth: 0, gap: 6 },
  actions: { flexDirection: 'row', marginTop: 2 },
});
