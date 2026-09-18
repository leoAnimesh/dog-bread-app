import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { Breed, TraitKey } from '@/domain';
import { CARE_TRAIT_KEYS, SOCIAL_TRAIT_KEYS, TRAIT_LABELS } from '@/domain/labels';

import { AppText, Card } from '../atoms';
import { TagCloud, TraitScale } from '../molecules';

/** exercise_minutes is the one trait not on a 1–5 scale; bucket it for the bar. */
export function exerciseToScore(minutes: number | null): number | null {
  if (minutes === null) return null;
  if (minutes <= 30) return 1;
  if (minutes <= 60) return 2;
  if (minutes <= 90) return 3;
  if (minutes <= 120) return 4;
  return 5;
}

export function traitValueLabel(key: TraitKey, value: number | null): string {
  if (value === null) return 'n/a';
  return key === 'exercise_minutes' ? `${value} min/day` : `${value} / 5`;
}

export function traitScore(key: TraitKey, value: number | null): number | null {
  return key === 'exercise_minutes' ? exerciseToScore(value) : value;
}

function TraitGroup({
  title,
  keys,
  breed,
  tone,
}: {
  title: string;
  keys: TraitKey[];
  breed: Breed;
  tone: 'accent' | 'positive';
}) {
  return (
    <View>
      <AppText
        variant="monoLabel"
        weight="medium"
        tone={tone === 'accent' ? 'accentText' : 'positive'}
        style={styles.groupTitle}
      >
        {title}
      </AppText>
      {keys.map((key) => {
        const raw = breed.traits[key];
        return (
          <TraitScale
            key={key}
            label={TRAIT_LABELS[key]}
            score={traitScore(key, raw)}
            valueLabel={traitValueLabel(key, raw)}
            tone={tone}
          />
        );
      })}
    </View>
  );
}

export function TraitsTab({ breed }: { breed: Breed }) {
  return (
    <View style={styles.container}>
      <TraitGroup title="Daily life & care" keys={CARE_TRAIT_KEYS} breed={breed} tone="accent" />
      <TraitGroup title="Sociability" keys={SOCIAL_TRAIT_KEYS} breed={breed} tone="positive" />
      <Card style={styles.card}>
        <AppText variant="monoLabel" weight="medium" tone="textMuted">
          Temperament
        </AppText>
        <TagCloud tags={breed.traits.temperament} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24, gap: 14 },
  groupTitle: { paddingBottom: 4 },
  card: { paddingVertical: 14 },
});
