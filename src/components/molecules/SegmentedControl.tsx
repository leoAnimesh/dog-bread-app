import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from '../atoms';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

/** The Any / Yes / No pill switch. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const { colors, radii } = useTheme();
  return (
    <View
      style={[styles.track, { backgroundColor: colors.surfaceMuted, borderRadius: radii.pill }]}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const on = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={option.label}
            style={[
              styles.segment,
              { borderRadius: radii.pill, backgroundColor: on ? colors.positive : 'transparent' },
            ]}
          >
            <AppText
              variant="label"
              weight="semibold"
              color={on ? colors.positiveText : colors.textTertiary}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', gap: 4, padding: 3 },
  segment: {
    height: 34,
    minWidth: 56,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
