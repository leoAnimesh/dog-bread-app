import React, { type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../atoms';

export interface FilterSectionProps {
  title: string;
  hint?: string;
  /** Lay the title and children out on one row (used for the segmented control) */
  inline?: boolean;
}

export function FilterSection({
  title,
  hint,
  inline = false,
  children,
}: PropsWithChildren<FilterSectionProps>) {
  return (
    <View style={inline ? styles.inline : styles.stack}>
      <View style={styles.titleRow}>
        <AppText variant="monoLabel" weight="medium" tone="positive">
          {title}
        </AppText>
        {hint ? (
          <AppText variant="bodySmall" tone="textMuted">
            {hint}
          </AppText>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 10 },
  inline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
});
