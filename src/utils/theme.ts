// PoolD Brand Theme
// Colours extracted from the official PoolD logo

export const Colors = {
  // Primary — from the logo gradient
  green: '#44F786',       // pin top
  teal: '#04D6BF',        // pin middle
  blue: '#016CEB',        // pin lower
  greenDeep: '#1BB870',
  tealDeep: '#039BAA',

  // Backgrounds — matching the logo's dark navy tile
  bgPrimary: '#000719',   // deepest (logo bg)
  bgSecondary: '#06112A',
  bgCard: '#0A1830',
  bgTile: '#0B1A33',      // app icon tile navy
  roadNavy: '#0A1B30',    // the road colour inside pin

  // Text
  textPrimary: '#EAF4F9',
  textSecondary: '#8CA0B8',
  textMuted: '#3D5068',

  // Status
  success: '#44F786',
  warning: '#FBBF24',
  error: '#FF5A5A',
  info: '#016CEB',

  // Misc
  border: '#13233D',
  borderLight: '#1C3050',
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,7,25,0.85)',
};

// The signature gradient used in the logo
export const Gradients = {
  brand: ['#44F786', '#04D6BF', '#016CEB'],   // green → teal → blue
  brandShort: ['#44F786', '#016CEB'],
  brandTeal: ['#04D6BF', '#016CEB'],
};

export const Typography = {
  heading: 'System',
  body: 'System',
  xs: 11, sm: 13, base: 15, md: 17, lg: 20,
  xl: 24, '2xl': 30, '3xl': 38, '4xl': 48,
};

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48, '3xl': 64,
};

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 20, '2xl': 28, full: 999,
};

export const Brand = {
  name: 'PoolD',
  nameArabic: 'بول دي',
  tagline: 'Share the ride. Save more. Move together.',
  taglineArabic: 'شارك الرحلة · وفّر · تنقّل معاً',
  taglineShort: 'Share · Save · Sustain',
};