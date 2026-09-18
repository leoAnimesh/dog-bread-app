import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, IconButton } from '../atoms';

export interface CompactDetailHeaderProps {
  name: string;
  subtitle: string;
  onBack: () => void;
}

/** Header used on the Traits and Gallery tabs (no hero image). */
export function CompactDetailHeader({ name, subtitle, onBack }: CompactDetailHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.row, { paddingTop: insets.top + 8 }]}>
      <IconButton icon="arrow-left" accessibilityLabel="Back to breeds" onPress={onBack} testID="detail-back" />
      <View style={styles.text}>
        <AppText variant="heading" numberOfLines={1} accessibilityRole="header">
          {name}
        </AppText>
        <AppText variant="monoSmall" tone="textMuted" numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 12 },
  text: { flex: 1, minWidth: 0 },
});
