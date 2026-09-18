import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, TextButton } from '../atoms';

export interface EmptyStateProps {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, body, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container} testID="empty-state">
      <AppText variant="subheading">{title}</AppText>
      <AppText variant="bodySmall" tone="textTertiary">
        {body}
      </AppText>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <TextButton label={actionLabel} onPress={onAction} variant="inverse" height={34} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 40, gap: 10 },
  action: { flexDirection: 'row', marginTop: 4 },
});
