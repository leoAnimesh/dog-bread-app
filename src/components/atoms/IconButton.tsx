import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';

export interface IconButtonProps {
  icon: IconName;
  accessibilityLabel: string;
  onPress?: () => void;
  disabled?: boolean;
  /** Filled surface (default) or dashed outline for disabled/queued */
  variant?: 'surface' | 'dashed' | 'translucent';
  tint?: string;
  size?: number;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** 44pt round tap target used for sync / back / close / gallery arrows. */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  disabled = false,
  variant = 'surface',
  tint,
  size,
  iconSize = 17,
  style,
  testID,
}: IconButtonProps) {
  const { colors, sizes } = useTheme();
  const dimension = size ?? sizes.touchTarget;
  const background =
    variant === 'translucent'
      ? 'rgba(251,248,241,0.92)'
      : variant === 'dashed'
        ? 'transparent'
        : colors.surface;
  const iconColor = tint ?? (disabled ? colors.iconMuted : colors.textPrimary);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: background,
          borderColor: variant === 'dashed' ? colors.borderStrong : colors.border,
          borderStyle: variant === 'dashed' ? 'dashed' : 'solid',
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Icon name={icon} size={iconSize} color={variant === 'translucent' ? '#1B1815' : iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
