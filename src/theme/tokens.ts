/**
 * Design tokens transcribed from the "Dog Breed Explorer" design file.
 * Warm parchment palette, rust accent, sage for "good / synced" states.
 */

export const fontFamilies = {
  /** Body copy, buttons, chips */
  sans: 'Karla_400Regular',
  sansMedium: 'Karla_500Medium',
  sansSemiBold: 'Karla_600SemiBold',
  sansBold: 'Karla_700Bold',
  /** Display: screen titles and breed names */
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  /** Meta labels, counts, sync status */
  mono: 'IBMPlexMono_400Regular',
  monoMedium: 'IBMPlexMono_500Medium',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  sm: 6,
  md: 9,
  lg: 12,
  xl: 14,
  xxl: 16,
  pill: 999,
} as const;

export const sizes = {
  touchTarget: 44,
  thumb: 62,
  galleryThumb: 58,
  chip: 34,
  searchField: 46,
  hero: 240,
} as const;

export interface ColorPalette {
  /** Page background */
  background: string;
  /** Slightly raised surfaces: footers, sticky bars */
  backgroundElevated: string;
  /** Cards, inputs */
  surface: string;
  /** Muted fill for thumbnails / placeholders / inactive segment tracks */
  surfaceMuted: string;
  /** Hero / large image placeholders */
  surfaceHero: string;

  border: string;
  borderStrong: string;
  divider: string;
  dividerSubtle: string;

  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  textOnAccent: string;
  textOnInverse: string;

  /** Inverse (dark on light / light on dark) - used by primary chips */
  inverse: string;
  inverseText: string;

  /** Rust accent - primary actions, care traits */
  accent: string;
  accentText: string;
  /** Sage - "good" states, synced, sociability traits */
  positive: string;
  positiveStrong: string;
  positiveText: string;
  /** Amber - stale */
  warning: string;

  /** Offline banner */
  offlineBackground: string;
  offlineText: string;
  offlineTextMuted: string;

  /** Partial failure card */
  errorBackground: string;
  errorBorder: string;
  errorTitle: string;
  errorText: string;
  errorAccent: string;

  /** Traits */
  traitTrack: string;
  chipMuted: string;

  /** Icons */
  iconMuted: string;
  chevron: string;
  placeholderIcon: string;
}

export const lightColors: ColorPalette = {
  background: '#F7F3EA',
  backgroundElevated: '#FBF8F1',
  surface: '#FFFDF8',
  surfaceMuted: '#EDE6D6',
  surfaceHero: '#EAE2D0',

  border: '#D8CFBC',
  borderStrong: '#C9BFA9',
  divider: '#E3DCCD',
  dividerSubtle: '#E8E1D2',

  textPrimary: '#1B1815',
  textSecondary: '#3A342D',
  textTertiary: '#6B6259',
  textMuted: '#8A8074',
  textOnAccent: '#FFFDF8',
  textOnInverse: '#F7F3EA',

  inverse: '#1B1815',
  inverseText: '#F7F3EA',

  accent: '#A9542B',
  accentText: '#A9542B',
  positive: '#4C6B4F',
  positiveStrong: '#2F4534',
  positiveText: '#FBF8F1',
  warning: '#C08A3C',

  offlineBackground: '#7E3B1E',
  offlineText: '#FBF1E7',
  offlineTextMuted: '#E8C6AF',

  errorBackground: '#FBEFE4',
  errorBorder: '#E3C3A6',
  errorTitle: '#6E3517',
  errorText: '#7A4527',
  errorAccent: '#8A431F',

  traitTrack: '#E3DCCD',
  chipMuted: '#F2EBDC',

  iconMuted: '#B0A48F',
  chevron: '#B0A48F',
  placeholderIcon: '#B3A68F',
};

export const darkColors: ColorPalette = {
  background: '#14120E',
  backgroundElevated: '#1A1712',
  surface: '#201D17',
  surfaceMuted: '#221E17',
  surfaceHero: '#1E1B15',

  border: '#342F26',
  borderStrong: '#423B30',
  divider: '#2C271F',
  dividerSubtle: '#251F18',

  textPrimary: '#F2EDE2',
  textSecondary: '#E5DDCF',
  textTertiary: '#A29A8C',
  textMuted: '#8C8375',
  textOnAccent: '#FFFDF8',
  textOnInverse: '#14120E',

  inverse: '#F2EDE2',
  inverseText: '#14120E',

  accent: '#A9542B',
  accentText: '#D98456',
  positive: '#8FB08F',
  positiveStrong: '#A9C4A9',
  positiveText: '#14120E',
  warning: '#D9A04E',

  offlineBackground: '#7E3B1E',
  offlineText: '#FBF1E7',
  offlineTextMuted: '#E8C6AF',

  errorBackground: '#2A1E15',
  errorBorder: '#57503F',
  errorTitle: '#EBA277',
  errorText: '#C8BFAE',
  errorAccent: '#EBA277',

  traitTrack: '#2C271F',
  chipMuted: '#2C271F',

  iconMuted: '#6A6355',
  chevron: '#6A6355',
  placeholderIcon: '#57503F',
};

export type ColorSchemeName = 'light' | 'dark';

export interface Theme {
  scheme: ColorSchemeName;
  colors: ColorPalette;
  fonts: typeof fontFamilies;
  spacing: typeof spacing;
  radii: typeof radii;
  sizes: typeof sizes;
}

export const buildTheme = (scheme: ColorSchemeName): Theme => ({
  scheme,
  colors: scheme === 'dark' ? darkColors : lightColors,
  fonts: fontFamilies,
  spacing,
  radii,
  sizes,
});
