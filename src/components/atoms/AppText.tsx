import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme, type ColorPalette, type Theme } from '@/theme';

export type TextVariant =
  | 'display' // 38 serif — screen titles
  | 'title' // 34 serif — breed name on detail
  | 'heading' // 25 serif — compact detail header
  | 'subheading' // 22 serif — empty state
  | 'name' // 20 serif — breed name in list rows
  | 'body' // 14.5 sans
  | 'bodySmall' // 12.5 sans
  | 'label' // 13 sans medium — chips, buttons
  | 'labelStrong' // 13.5 sans semibold
  | 'button' // 15 sans bold
  | 'mono' // 11 mono
  | 'monoLabel' // 10.5 mono, tracked, uppercase
  | 'monoSmall'; // 10 mono

export type TextTone = keyof Pick<
  ColorPalette,
  | 'textPrimary'
  | 'textSecondary'
  | 'textTertiary'
  | 'textMuted'
  | 'textOnAccent'
  | 'textOnInverse'
  | 'accentText'
  | 'positive'
  | 'positiveText'
  | 'offlineText'
  | 'offlineTextMuted'
  | 'errorTitle'
  | 'errorText'
  | 'errorAccent'
  | 'inverseText'
>;

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  color?: string;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  align?: TextStyle['textAlign'];
}

function variantStyle(
  theme: Theme,
  variant: TextVariant,
  weight?: AppTextProps['weight'],
): TextStyle {
  const f = theme.fonts;
  const sans = {
    regular: f.sans,
    medium: f.sansMedium,
    semibold: f.sansSemiBold,
    bold: f.sansBold,
  } as const;
  switch (variant) {
    case 'display':
      return { fontFamily: f.serif, fontSize: 38, lineHeight: 38 };
    case 'title':
      return { fontFamily: f.serif, fontSize: 34, lineHeight: 35 };
    case 'heading':
      return { fontFamily: f.serif, fontSize: 25, lineHeight: 28 };
    case 'subheading':
      return { fontFamily: f.serif, fontSize: 22, lineHeight: 25 };
    case 'name':
      return { fontFamily: f.serif, fontSize: 20, lineHeight: 22 };
    case 'body':
      return { fontFamily: sans[weight ?? 'regular'], fontSize: 14.5, lineHeight: 22 };
    case 'bodySmall':
      return { fontFamily: sans[weight ?? 'regular'], fontSize: 12.5, lineHeight: 18 };
    case 'label':
      return { fontFamily: sans[weight ?? 'medium'], fontSize: 13, lineHeight: 16 };
    case 'labelStrong':
      return { fontFamily: sans[weight ?? 'semibold'], fontSize: 13.5, lineHeight: 17 };
    case 'button':
      return { fontFamily: sans[weight ?? 'bold'], fontSize: 15, lineHeight: 18 };
    case 'mono':
      return {
        fontFamily: weight === 'medium' ? f.monoMedium : f.mono,
        fontSize: 11,
        lineHeight: 15,
      };
    case 'monoLabel':
      return {
        fontFamily: weight === 'medium' ? f.monoMedium : f.mono,
        fontSize: 10.5,
        lineHeight: 14,
        letterSpacing: 1,
        textTransform: 'uppercase',
      };
    case 'monoSmall':
      return { fontFamily: f.mono, fontSize: 10, lineHeight: 13, letterSpacing: 0.6 };
  }
}

/** Single typography primitive — every visible string in the app goes through it. */
export function AppText({
  variant = 'body',
  tone = 'textPrimary',
  color,
  weight,
  align,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  return (
    <Text
      {...rest}
      style={[
        variantStyle(theme, variant, weight),
        { color: color ?? theme.colors[tone], textAlign: align },
        style,
      ]}
    />
  );
}
