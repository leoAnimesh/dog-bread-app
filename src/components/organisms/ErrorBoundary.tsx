import React, { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { errorMessage } from '@/utils/guards';

import { AppText, TextButton } from '../atoms';

export interface ErrorBoundaryProps {
  /** Name of the feature, shown in the fallback */
  feature: string;
  fallback?: (error: string, reset: () => void) => ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  error: string | null;
}

/**
 * Feature-level boundary: a crash inside the list, the detail pane or the
 * filters form degrades to an inline message instead of taking down the app.
 */
export class ErrorBoundary extends Component<PropsWithChildren<ErrorBoundaryProps>, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: errorMessage(error) };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
    if (process.env.NODE_ENV !== 'test') {
      console.error(`[ErrorBoundary:${this.props.feature}]`, error, info.componentStack);
    }
  }

  private reset = () => this.setState({ error: null });

  override render(): ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);
    return (
      <View style={styles.fallback} accessibilityRole="alert" testID="error-boundary-fallback">
        <AppText variant="subheading">Something went wrong in {this.props.feature}</AppText>
        <AppText variant="bodySmall" tone="textTertiary">
          {error}
        </AppText>
        <View style={styles.action}>
          <TextButton label="Try again" onPress={this.reset} variant="inverse" height={34} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  fallback: { padding: 20, gap: 10 },
  action: { flexDirection: 'row', marginTop: 4 },
});
