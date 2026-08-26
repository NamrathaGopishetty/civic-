import { DefaultTheme } from 'react-native-paper';

export const COLORS = {
  primary: '#0284C7',
  primaryLight: '#0EA5E9',
  primaryDark: '#075985',
  primarySurface: '#E0F2FE',
  accent: '#FF6F00',
  accentLight: '#FFA000',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  error: '#D32F2F',
  errorSurface: '#FFEBEE',
  success: '#2E7D32',
  successSurface: '#E8F5E9',
  warning: '#F57F17',
  warningSurface: '#FFF8E1',
  info: '#0369A1',
  infoSurface: '#E1F5FE',
  border: '#E2E8F0',
  divider: '#EEF2F6',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
  white: '#FFFFFF',
  black: '#000000',
  heroGradientStart: '#0E7490',
  heroGradientMid: '#0369A1',
  heroGradientEnd: '#075985',
  tealLight: '#BAE6FD',
  tealSurface: '#F0F9FF',
  cardBorder: '#EEF2F6',
  categoryBg: '#F8FAFC',
  inputBg: '#F8FAFC',
  locationBg: '#F1F5F9',
};

export const STATUS_COLORS = {
  Pending: COLORS.warning,
  Acknowledged: COLORS.info,
  'In Progress': COLORS.primaryLight,
  Resolved: COLORS.success,
};

export const PRIORITY_COLORS = {
  High: COLORS.error,
  Medium: COLORS.warning,
  Low: COLORS.info,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 24,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    accent: COLORS.accent,
    background: COLORS.background,
    surface: COLORS.surface,
    text: COLORS.text,
    error: COLORS.error,
    placeholder: COLORS.textMuted,
    backdrop: COLORS.overlay,
  },
  roundness: RADIUS.md,
};
