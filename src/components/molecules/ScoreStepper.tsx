import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from '../atoms';

export interface ScoreStepperProps {
  /** Selected minimum score (1..5) */
  min: number;
  onChange: (min: number) => void;
  steps?: number;
}

/** 1–5 boxes; everything at or above the chosen minimum fills sage. */
export function ScoreStepper({ min, onChange, steps = 5 }: ScoreStepperProps) {
  const { colors, radii, fonts } = useTheme();
  return (
    <View style={styles.row} accessibilityRole="adjustable" accessibilityLabel="Minimum trait score">
      {Array.from({ length: steps }, (_, i) => i + 1).map((n) => {
        const on = min <= n;
        const edge = min === n;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            accessibilityRole="button"
            accessibilityLabel={`Minimum score ${n}`}
            accessibilityState={{ selected: edge }}
            style={[
              styles.step,
              {
                borderRadius: radii.lg,
                backgroundColor: on ? colors.positive : colors.surface,
                borderColor: edge ? colors.positiveStrong : on ? colors.positive : colors.border,
              },
            ]}
          >
            <AppText
              style={{ fontFamily: fonts.mono, fontSize: 15 }}
              color={on ? colors.positiveText : colors.textMuted}
            >
              {n}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  step: { width: 46, height: 46, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
