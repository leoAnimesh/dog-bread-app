import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { Breed } from '@/domain';
import { formatRange } from '@/domain/labels';

import { AppText } from '../atoms';
import { SpecRow, TagCloud } from '../molecules';

function rangePair(male: Breed['maleWeight'], female: Breed['femaleWeight'], unit: string): string {
  const m = formatRange(male, unit);
  const f = formatRange(female, unit);
  if (m === '—' && f === '—') return '—';
  return `Male ${m} · Female ${f}`;
}

function originLine(origin: Breed['origin']): string {
  const parts = [origin.country, origin.region].filter((p): p is string => p !== null);
  return parts.length > 0 ? parts.join(' · ') : '—';
}

export function OverviewTab({ breed }: { breed: Breed }) {
  const specs: { label: string; value: string }[] = [
    { label: 'Life span', value: formatRange(breed.life, 'years') },
    { label: 'Weight', value: rangePair(breed.maleWeight, breed.femaleWeight, 'kg') },
    { label: 'Height', value: rangePair(breed.maleHeight, breed.femaleHeight, 'cm') },
    { label: 'Origin', value: originLine(breed.origin) },
    { label: 'Era', value: breed.origin.era ?? '—' },
  ];
  if (breed.coat.colors.length > 0) {
    specs.push({ label: 'Coat colours', value: breed.coat.colors.join(', ') });
  }

  return (
    <View style={styles.container}>
      {breed.description ? (
        <AppText variant="body" tone="textSecondary">
          {breed.description}
        </AppText>
      ) : (
        <AppText variant="bodySmall" tone="textMuted">
          No description available for this breed.
        </AppText>
      )}

      <View>
        {specs.map((s) => (
          <SpecRow key={s.label} label={s.label} value={s.value} />
        ))}
      </View>

      <View style={styles.section}>
        <AppText variant="monoLabel" weight="medium" tone="positive">
          Recognised by
        </AppText>
        <TagCloud tags={breed.recognizedBy} variant="mono" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 16 },
  section: { gap: 9 },
});
