import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppText, ErrorBoundary } from '@/components';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import { ServicesProvider } from '@/services/ServicesProvider';
import { ThemeProvider, useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync();


function Navigation() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="breed/[id]" />
      <Stack.Screen name="filters" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

function BootGate() {
  const { colors } = useTheme();
  const { ready, services, error } = useAppBootstrap();

  useEffect(() => {
    if (ready || error) void SplashScreen.hideAsync();
  }, [ready, error]);

  if (error && !services) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]} accessibilityRole="alert">
        <AppText variant="subheading">The app couldn&apos;t start</AppText>
        <AppText variant="bodySmall" tone="textTertiary" align="center">
          {error}
        </AppText>
      </View>
    );
  }
  if (!ready || !services) return <View style={[styles.center, { backgroundColor: colors.background }]} />;

  return (
    <ServicesProvider services={services}>
      <ErrorBoundary feature="the app">
        <Navigation />
      </ErrorBoundary>
    </ServicesProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <BootGate />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
});
