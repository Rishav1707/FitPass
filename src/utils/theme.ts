// ─────────────────────────────────────────────────
// FitPass Design System
// Dark luxe fitness aesthetic with emerald accents
// ─────────────────────────────────────────────────

export const COLORS = {
  // Core backgrounds
  bg: '#0A0E1A',
  bgCard: '#131829',
  bgCardHover: '#1A2038',
  bgElevated: '#1E2540',

  // Accent palette
  accent: '#00E5A0',
  accentDim: '#00C98A',
  accentGlow: 'rgba(0, 229, 160, 0.15)',
  accentGlow2: 'rgba(0, 229, 160, 0.08)',
  accentMuted: 'rgba(0, 229, 160, 0.4)',

  // Secondary accents
  orange: '#FF6B35',
  orangeGlow: 'rgba(255, 107, 53, 0.15)',
  premium: '#C9A44C',
  premiumGlow: 'rgba(201, 164, 76, 0.15)',

  // Text hierarchy
  textPrimary: '#F0F2F8',
  textSecondary: '#8B92A8',
  textMuted: '#5A6178',
  textInverse: '#0A0E1A',

  // Borders
  border: '#1E2540',
  borderLight: '#2A3155',

  // Status
  success: '#00E5A0',
  warning: '#FFB84D',
  danger: '#FF5A5A',

  // Overlays
  overlay: 'rgba(10, 14, 26, 0.8)',
  shimmer: 'rgba(255, 255, 255, 0.05)',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const FONTS = {
  // Display / headings
  displayBold: {
    fontFamily: 'Sora-Bold',
    fontWeight: '800' as const,
  },
  displaySemibold: {
    fontFamily: 'Sora-SemiBold',
    fontWeight: '700' as const,
  },
  // Body text
  bodyBold: {
    fontFamily: 'DMSans-Bold',
    fontWeight: '700' as const,
  },
  bodySemibold: {
    fontFamily: 'DMSans-SemiBold',
    fontWeight: '600' as const,
  },
  bodyMedium: {
    fontFamily: 'DMSans-Medium',
    fontWeight: '500' as const,
  },
  bodyRegular: {
    fontFamily: 'DMSans-Regular',
    fontWeight: '400' as const,
  },
} as const;

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  glow: {
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
