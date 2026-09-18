import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, ScaleBar } from '../atoms';

export interface TraitScaleProps {
  label: string;
  /** 0..5 for the bar */
  score: number | null;
  /** Human-readable value, e.g. "4 / 5" or "120 min/day" */
  valueLabel: string;
  tone: 'accent' | 'positive';
}

export function TraitScale({ label, score, valueLabel, tone }: TraitScaleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="labelStrong" weight="regular" tone="textSecondary">
          {label}
        </AppText>
        <AppText variant="mono" tone="textTertiary">
          {valueLabel}
        </AppText>
      </View>
      <ScaleBar value={score ?? 0} tone={tone} accessibilityLabel={`${label}: ${valueLabel}`} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6, paddingVertical: 7 },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
  },
});
