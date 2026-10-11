import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#F3F4F6',
    surface: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    primary: '#1F2937',
    border: '#E5E7EB',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E5E7EB',
    tint: '#1F2937',
    icon: '#6B7280',
  },
  dark: {
    background: '#111827',
    surface: '#1F2937',
    text: '#F3F4F6',
    textSecondary: '#9CA3AF',
    primary: '#FFFFFF',
    border: '#374151',
    backgroundElement: '#1F2937',
    backgroundSelected: '#374151',
    tint: '#FFFFFF',
    icon: '#9CA3AF',
  },
} as const;

export const EstadosColors = {
  recibido: '#9CA3AF',
  en_revision: '#D97706',
  asignado: '#3B82F6',
  resuelto: '#10B981',
  rechazado: '#EF4444',
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Accessibility = {
  fontSizeBase: 16,
  fontSizeLarge: 18,
  buttonMinHeight: 48,
  borderRadius: 8,
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;