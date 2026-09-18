import React from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';

export type StatusTone = 'positive' | 'warning' | 'accent' | 'muted';

export function StatusDot({ tone = 'positive', size = 7 }: { tone?: StatusTone; size?: number }) {
  const { colors } = useTheme();
  const color = {
    positive: colors.positive,
    warning: colors.warning,
    accent: colors.accent,
    muted: colors.iconMuted,
  }[tone];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
  );
}
