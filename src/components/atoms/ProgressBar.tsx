import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

export function ProgressBar({ ratio }: { ratio: number }) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <View
      style={[styles.track, { backgroundColor: colors.traitTrack }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <View
        style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: colors.positive }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});
