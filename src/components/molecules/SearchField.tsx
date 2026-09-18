import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/theme';

import { Icon } from '../atoms';

export interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  accessibilityLabel?: string;
  testID?: string;
}

export function SearchField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel = 'Search breeds',
  testID,
}: SearchFieldProps) {
  const { colors, fonts, radii, sizes } = useTheme();
  return (
    <View
      style={[
        styles.container,
        {
          height: sizes.searchField,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radii.lg,
        },
      ]}
    >
      <Icon name="search" size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={accessibilityLabel}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="while-editing"
        testID={testID}
        style={[styles.input, { fontFamily: fonts.sans, color: colors.textPrimary }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    paddingVertical: 0,
  },
});
