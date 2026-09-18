import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, ErrorBoundary, FiltersForm, FooterStrip, IconButton, Screen, TextButton } from '@/components';
import { useFilterDraft } from '@/hooks/useFilterDraft';

export function FiltersScreen() {
  const router = useRouter();
  const form = useFilterDraft();

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  const apply = useCallback(() => {
    form.apply();
    close();
  }, [form, close]);

  return (
    <Screen testID="filters-screen">
      <View style={styles.header}>
        <AppText variant="display" style={{ fontSize: 32, lineHeight: 32 }} accessibilityRole="header">
          Refine
        </AppText>
        <IconButton icon="close" accessibilityLabel="Close filters" onPress={close} testID="close-filters" />
      </View>
      <ErrorBoundary feature="the filters">
        <FiltersForm form={form} />
      </ErrorBoundary>
      <FooterStrip height={88}>
        <TextButton label="Reset" onPress={form.reset} variant="ghost" height={48} testID="reset-filters" />
        <TextButton
          label={`Apply · ${form.matchCount} breeds`}
          badge={String(form.activeCount)}
          onPress={apply}
          variant="primary"
          height={48}
          grow
          testID="apply-filters"
          accessibilityLabel={`Apply ${form.activeCount} filters, ${form.matchCount} breeds match`}
        />
      </FooterStrip>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
});
