import React from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';

export function Divider({ subtle = false, flex = false }: { subtle?: boolean; flex?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height: 1,
        flexGrow: flex ? 1 : 0,
        alignSelf: flex ? 'auto' : 'stretch',
        backgroundColor: subtle ? colors.dividerSubtle : colors.divider,
      }}
    />
  );
}
