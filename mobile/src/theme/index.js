import { DefaultTheme } from 'react-native-paper';

export const COLORS = {
  primary: '#1565C0',
  primaryLight: '#1E88E5',
  primaryDark: '#0D47A1',
  primarySurface: '#E3F2FD',
  accent: '#FF6F00',
  accentLight: '#FFA000',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F4F8',
  text: '#1A1A2E',
  textSecondary: '#5A6577',
  textMuted: '#8E99A4',
  error: '#D32F2F',
  errorSurface: '#FFEBEE',
  success: '#2E7D32',
  successSurface: '#E8F5E9',
  warning: '#F57F17',
  warningSurface: '#FFF8E1',
  info: '#0277BD',
  infoSurface: '#E1F5FE',
  border: '#E0E4E8',
  divider: '#EEF0F2',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
  white: '#FFFFFF',
  black: '#000000',
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
