import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from '../atoms';

export const DETAIL_TABS = ['overview', 'traits', 'gallery'] as const;
export type DetailTab = (typeof DETAIL_TABS)[number];

const LABELS: Record<DetailTab, string> = {
  overview: 'Overview',
  traits: 'Traits',
  gallery: 'Gallery',
};

export function isDetailTab(value: unknown): value is DetailTab {
  return typeof value === 'string' && (DETAIL_TABS as readonly string[]).includes(value);
}

export function DetailTabBar({
  active,
  onChange,
}: {
  active: DetailTab;
  onChange: (tab: DetailTab) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.bar, { borderBottomColor: colors.divider }]} accessibilityRole="tablist">
      {DETAIL_TABS.map((tab) => {
        const on = tab === active;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={LABELS[tab]}
            testID={`detail-tab-${tab}`}
            style={[styles.tab, { borderBottomColor: on ? colors.accent : 'transparent' }]}
          >
            <AppText
              variant="label"
              weight={on ? 'bold' : 'medium'}
              style={{ fontSize: 14 }}
              color={on ? colors.textPrimary : colors.textMuted}
            >
              {LABELS[tab]}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', gap: 24, paddingHorizontal: 20, borderBottomWidth: 1 },
  tab: { paddingTop: 10, paddingBottom: 11, borderBottomWidth: 2 },
});
