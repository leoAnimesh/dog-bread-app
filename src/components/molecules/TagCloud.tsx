import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText, Chip } from '../atoms';

export interface TagCloudProps {
  tags: readonly string[];
  /** Pill chips (temperament) or small square mono tags (kennel clubs) */
  variant?: 'pill' | 'mono';
}

export function TagCloud({ tags, variant = 'pill' }: TagCloudProps) {
  const { colors, radii } = useTheme();
  if (tags.length === 0) {
    return (
      <AppText variant="bodySmall" tone="textMuted">
        None listed
      </AppText>
    );
  }
  return (
    <View style={styles.wrap}>
      {tags.map((tag) =>
        variant === 'pill' ? (
          <Chip key={tag} label={capitalise(tag)} variant="muted" size="sm" />
        ) : (
          <View
            key={tag}
            style={[
              styles.monoTag,
              { backgroundColor: colors.surface, borderColor: colors.divider, borderRadius: radii.sm + 1 },
            ]}
          >
            <AppText variant="mono" tone="textTertiary">
              {tag}
            </AppText>
          </View>
        ),
      )}
    </View>
  );
}

function capitalise(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  monoTag: { height: 27, paddingHorizontal: 10, borderWidth: 1, justifyContent: 'center' },
});
