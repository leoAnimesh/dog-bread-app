import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Divider } from '../atoms';

export function GroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <View style={styles.row} accessibilityRole="header">
      <AppText variant="monoLabel" weight="medium" tone="positive">
        {label}
      </AppText>
      <Divider flex />
      <AppText variant="monoLabel" tone="textMuted">
        {count}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 14,
    paddingBottom: 6,
  },
});
