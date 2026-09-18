import React, { type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

/** Bottom bar with top border — used on list, detail and filters screens. */
export function FooterStrip({ children, height = 52 }: PropsWithChildren<{ height?: number }>) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.strip,
        {
          height: height + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: colors.backgroundElevated,
          borderTopColor: colors.divider,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
});
