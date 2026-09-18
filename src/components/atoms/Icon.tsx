import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';

import { useTheme } from '@/theme';

export type IconName =
  | 'refresh'
  | 'search'
  | 'filters'
  | 'close'
  | 'chevron-right'
  | 'chevron-left'
  | 'arrow-left'
  | 'offline'
  | 'alert'
  | 'paw'
  | 'external';

const FEATHER: Partial<Record<IconName, React.ComponentProps<typeof Feather>['name']>> = {
  refresh: 'refresh-cw',
  search: 'search',
  filters: 'sliders',
  close: 'x',
  'chevron-right': 'chevron-right',
  'chevron-left': 'chevron-left',
  'arrow-left': 'arrow-left',
  offline: 'wifi-off',
  alert: 'alert-triangle',
  external: 'external-link',
};

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 17, color }: IconProps) {
  const theme = useTheme();
  const tint = color ?? theme.colors.textPrimary;
  if (name === 'paw') {
    return <MaterialCommunityIcons name="paw-outline" size={size} color={tint} />;
  }
  const feather = FEATHER[name] ?? 'circle';
  return <Feather name={feather} size={size} color={tint} />;
}
