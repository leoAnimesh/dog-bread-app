import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

export interface TextButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'outline' | 'primary' | 'inverse' | 'ghost' | 'error';
  /** Optional mono badge rendered after the label (e.g. active filter count) */
  badge?: string;
  height?: number;
  grow?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export function TextButton({
  label,
  onPress,
  variant = 'outline',
  badge,
  height = 40,
  grow = false,
  disabled = false,
  accessibilityLabel,
  testID,
}: TextButtonProps) {
  const { colors, radii, fonts } = useTheme();
  const palette = {
    outline: { bg: 'transparent', fg: colors.accentText, border: colors.borderStrong },
    primary: { bg: colors.accent, fg: colors.textOnAccent, border: colors.accent },
    inverse: { bg: colors.inverse, fg: colors.inverseText, border: colors.inverse },
    ghost: { bg: 'transparent', fg: colors.textSecondary, border: colors.borderStrong },
    error: { bg: 'transparent', fg: colors.errorAccent, border: colors.errorBorder },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          flexGrow: grow ? 1 : 0,
          borderRadius: radii.pill,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <AppText
        variant={variant === 'primary' ? 'button' : 'label'}
        weight={variant === 'primary' ? 'bold' : 'semibold'}
        color={palette.fg}
      >
        {label}
      </AppText>
      {badge !== undefined ? (
        <View style={[styles.badge, { backgroundColor: 'rgba(255,253,248,0.22)' }]}>
          <AppText style={{ fontFamily: fonts.mono, fontSize: 11 }} color={palette.fg}>
            {badge}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
