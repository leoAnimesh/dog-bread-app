import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

export type ChipVariant = 'outline' | 'selected' | 'inverse' | 'positive' | 'muted';

export interface ChipProps {
  label: string;
  variant?: ChipVariant;
  onPress?: () => void;
  /** Renders an × and makes the chip removable */
  onRemove?: () => void;
  selected?: boolean;
  size?: 'sm' | 'md';
  accessibilityLabel?: string;
  testID?: string;
}

/** Pill chip used for filters, active-filter tokens, and detail tags. */
export function Chip({
  label,
  variant = 'outline',
  onPress,
  onRemove,
  selected = false,
  size = 'md',
  accessibilityLabel,
  testID,
}: ChipProps) {
  const { colors, radii } = useTheme();
  const resolved: ChipVariant = selected ? 'selected' : variant;

  const palette = {
    outline: { bg: colors.surface, fg: colors.textSecondary, border: colors.border },
    selected: { bg: colors.inverse, fg: colors.inverseText, border: colors.inverse },
    inverse: { bg: colors.inverse, fg: colors.inverseText, border: colors.inverse },
    positive: { bg: colors.positive, fg: colors.positiveText, border: colors.positive },
    muted: { bg: colors.chipMuted, fg: colors.textSecondary, border: colors.chipMuted },
  }[resolved];

  const height = size === 'sm' ? 26 : 34;
  const interactive = onPress !== undefined || onRemove !== undefined;

  const content = (
    <View
      style={[
        styles.chip,
        {
          height,
          paddingHorizontal: size === 'sm' ? 10 : 12,
          borderRadius: radii.pill,
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
      ]}
    >
      <AppText
        variant={size === 'sm' ? 'bodySmall' : 'label'}
        weight={resolved === 'selected' || resolved === 'positive' ? 'semibold' : 'medium'}
        color={palette.fg}
        numberOfLines={1}
      >
        {label}
      </AppText>
      {onRemove ? <Icon name="close" size={11} color={palette.fg} /> : null}
    </View>
  );

  if (!interactive) return content;

  return (
    <Pressable
      onPress={onRemove ?? onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (onRemove ? `Remove ${label} filter` : label)}
      accessibilityState={{ selected }}
      hitSlop={4}
      testID={testID}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
});
