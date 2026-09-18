import React, { type PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

export function ChipWrap({ children }: PropsWithChildren) {
  return <View style={styles.wrap}>{children}</View>;
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
