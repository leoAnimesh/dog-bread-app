import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from '../atoms';

export function SpecRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderTopColor: colors.dividerSubtle }]}>
      <AppText variant="monoLabel" tone="textMuted">
        {label}
      </AppText>
      <AppText variant="labelStrong" weight="regular" align="right" style={styles.value}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 9,
    borderTopWidth: 1,
  },
  value: { flex: 1, minWidth: 0 },
});
