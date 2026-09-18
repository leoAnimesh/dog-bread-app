import { StatusBar } from 'expo-status-bar';
import React, { type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export interface ScreenProps {
  /** Apply the top safe-area inset (turn off when a hero draws under it) */
  topInset?: boolean;
  /** Colour under the status bar area, e.g. the offline banner colour */
  topColor?: string;
  testID?: string;
}

/** Page template: themed background, status bar style, optional safe-area top. */
export function Screen({ topInset = true, topColor, testID, children }: PropsWithChildren<ScreenProps>) {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} testID={testID}>
      <StatusBar style={topColor ? 'light' : scheme === 'dark' ? 'light' : 'dark'} />
      {topInset ? <View style={{ height: insets.top, backgroundColor: topColor ?? colors.background }} /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
