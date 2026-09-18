import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  COAT_LENGTH_LABELS,
  FILTERABLE_COAT_LENGTHS,
  FILTERABLE_SIZE_BANDS,
  SIZE_BAND_FILTER_LABELS,
  THRESHOLD_TRAIT_LABELS,
} from '@/domain/labels';
import { THRESHOLD_TRAIT_KEYS } from '@/domain/types';
import type { useFilterDraft } from '@/hooks/useFilterDraft';

import { AppText, Card, Chip } from '../atoms';
import { ChipWrap, FilterSection, ScoreStepper, SegmentedControl } from '../molecules';

type Draft = ReturnType<typeof useFilterDraft>;

export interface FiltersFormProps {
  form: Draft;
}

const HYPO_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
] as const;

/** Pure presentation of the filter draft — all state lives in useFilterDraft. */
export function FiltersForm({ form }: FiltersFormProps) {
  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <FilterSection title="Breed group">
        <ChipWrap>
          {form.groups.map((g) => (
            <Chip
              key={g.id}
              label={g.label}
              selected={form.draft.groupIds.includes(g.id)}
              onPress={() => form.toggleGroup(g.id)}
              testID={`filter-group-${g.label}`}
            />
          ))}
          {form.groups.length === 0 ? (
            <AppText variant="bodySmall" tone="textMuted">
              Groups appear after the first sync.
            </AppText>
          ) : null}
        </ChipWrap>
      </FilterSection>

      <FilterSection title="Size band" hint="derived from weight range">
        <ChipWrap>
          {FILTERABLE_SIZE_BANDS.map((band) => (
            <Chip
              key={band}
              label={SIZE_BAND_FILTER_LABELS[band]}
              selected={form.draft.sizeBands.includes(band)}
              onPress={() => form.toggleSizeBand(band)}
              testID={`filter-size-${band}`}
            />
          ))}
        </ChipWrap>
      </FilterSection>

      <FilterSection title="Coat length">
        <ChipWrap>
          {FILTERABLE_COAT_LENGTHS.map((coat) => (
            <Chip
              key={coat}
              label={COAT_LENGTH_LABELS[coat]}
              selected={form.draft.coatLengths.includes(coat)}
              onPress={() => form.toggleCoatLength(coat)}
              testID={`filter-coat-${coat}`}
            />
          ))}
        </ChipWrap>
      </FilterSection>

      <FilterSection title="Hypoallergenic" inline>
        <SegmentedControl
          options={HYPO_OPTIONS}
          value={form.draft.hypoallergenic}
          onChange={form.setHypoallergenic}
          accessibilityLabel="Hypoallergenic"
        />
      </FilterSection>

      <Card style={styles.traitCard}>
        <View style={styles.traitHeader}>
          <AppText variant="monoLabel" weight="medium" tone="positive">
            Trait threshold
          </AppText>
          {form.traitEnabled ? (
            <Chip label="Off" size="sm" onPress={form.clearTrait} accessibilityLabel="Disable trait threshold" />
          ) : null}
        </View>
        <ChipWrap>
          {THRESHOLD_TRAIT_KEYS.map((trait) => (
            <Chip
              key={trait}
              label={THRESHOLD_TRAIT_LABELS[trait]}
              variant={form.traitEnabled && form.selectedTrait === trait ? 'positive' : 'outline'}
              onPress={() => form.setTrait(trait)}
              testID={`filter-trait-${trait}`}
            />
          ))}
        </ChipWrap>
        <ScoreStepper min={form.minScore} onChange={form.setMinScore} />
        <AppText variant="label" weight="regular" tone="textTertiary">
          {form.traitEnabled
            ? `Showing breeds scoring ${form.minScore} and above on this trait.`
            : 'Pick a trait to require a minimum score.'}
        </AppText>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 24, gap: 20 },
  traitCard: { gap: 12 },
  traitHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
