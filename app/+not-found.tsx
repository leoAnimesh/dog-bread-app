import { Link } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Screen } from '@/components';

export default function NotFoundRoute() {
  return (
    <Screen>
      <View style={styles.center}>
        <AppText variant="subheading">That page doesn&apos;t exist</AppText>
        <Link href="/" accessibilityRole="link">
          <AppText variant="label" weight="semibold" tone="accentText">
            Back to breeds
          </AppText>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
});
