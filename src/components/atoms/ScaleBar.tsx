import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

export interface ScaleBarProps {
  /** 0..segments */
  value: number;
  segments?: number;
  tone: 'accent' | 'positive';
  accessibilityLabel?: string;
}

/** Five-segment visual scale used for the 1–5 trait scores. */
export function ScaleBar({ value, segments = 5, tone, accessibilityLabel }: ScaleBarProps) {
  const { colors } = useTheme();
  const fill = tone === 'accent' ? colors.accent : colors.positive;
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: segments, now: value }}
    >
      {Array.from({ length: segments }, (_, i) => (
        <View
          key={i}
          style={[styles.segment, { backgroundColor: i < value ? fill : colors.traitTrack }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 6, borderRadius: 3 },
});
