import * as Linking from 'expo-linking';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { ImageAttribution } from '@/domain';
import { useTheme } from '@/theme';

import { AppText, Card, Icon } from '../atoms';

/** Every gallery image carries author/licence/source — surfaced, never dropped. */
export function AttributionCard({ attribution }: { attribution: ImageAttribution }) {
  const { colors, radii } = useTheme();
  const sourceUrl = attribution.sourceUrl ?? attribution.licenseUrl;
  const sourceLabel = attribution.source ? attribution.source.replace(/_/g, ' ') : 'source';

  return (
    <Card style={styles.card}>
      <AppText variant="monoLabel" weight="medium" tone="positive">
        Attribution
      </AppText>
      <AppText variant="body" numberOfLines={2}>
        {attribution.author ?? 'Unknown author'}
      </AppText>
      <View style={styles.row}>
        {attribution.license ? (
          <Pressable
            onPress={attribution.licenseUrl ? () => Linking.openURL(attribution.licenseUrl!) : undefined}
            accessibilityRole={attribution.licenseUrl ? 'link' : 'text'}
            accessibilityLabel={`Licence ${attribution.license}`}
            style={[styles.licence, { backgroundColor: colors.chipMuted, borderRadius: radii.sm }]}
          >
            <AppText variant="monoLabel" tone="textTertiary" style={{ textTransform: 'none' }}>
              {attribution.license}
            </AppText>
          </Pressable>
        ) : null}
        {sourceUrl ? (
          <Pressable
            onPress={() => Linking.openURL(sourceUrl)}
            accessibilityRole="link"
            accessibilityLabel={`View ${sourceLabel}`}
            style={styles.link}
          >
            <AppText variant="label" weight="semibold" tone="accentText">
              View {sourceLabel}
            </AppText>
            <Icon name="external" size={12} color={colors.accentText} />
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: 14, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  licence: { height: 24, paddingHorizontal: 9, justifyContent: 'center' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
