import React, { type PropsWithChildren } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { colors, radii } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.divider,
          borderWidth: 1,
          borderRadius: radii.xl,
          padding: 16,
          gap: 9,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
