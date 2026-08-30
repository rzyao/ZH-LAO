/**
 * Theme tokens — REUSE from the legacy product UI.
 *
 * `colors.ts` from the legacy app is intentionally NOT migrated: it statically
 * exported the first preset's palette, which bypassed the active theme. V2
 * always reads tokens from `useTheme()`.
 */

/** Theme id used when nothing is persisted yet. */
export const DEFAULT_THEME_ID = 'azure-sky';

export interface AppThemeTokens {
  accent: string;
  accentFrom: string;
  accentTo: string;
  bg: string;
  surface: string;
  surface2: string;
  success: string;
  error: string;
  locked: string;
  textPrimary: string;
  textSecondary: string;
  textHint: string;
  borderSoft: string;
  borderStrong: string;
  flame: string;
  // 兼容旧版命名别名
  text: string;
  textSub: string;
  soft: string;
  green: string;
  blue: string;
}

export interface AppTheme {
  id: string;
  name: string;
  preview: string;
  tokens: AppThemeTokens;
}

export const THEME_PRESETS: AppTheme[] = [
  {
    id: 'azure-sky',
    name: '蔚蓝晴空 (Ardot 2.0)',
    preview: '#0F6FFF',
    tokens: {
      accent: '#0F6FFF',
      accentFrom: '#0F6FFF',
      accentTo: '#3B82F6',
      bg: '#F7F8FA',
      surface: '#FFFFFF',
      surface2: '#F0F4FF',
      success: '#34C759',
      error: '#FF3B30',
      locked: '#C7C9CF',
      textPrimary: '#1A1A2E',
      textSecondary: '#4A5568',
      textHint: '#A0AEC0',
      borderSoft: '#E5E7EB',
      borderStrong: '#D8DCE3',
      flame: '#FF9500',
      text: '#1A1A2E',
      textSub: '#4A5568',
      soft: '#F0F4FF',
      green: '#34C759',
      blue: '#0F6FFF',
    },
  },
  {
    id: 'warm-orange',
    name: '暖阳橙 (经典)',
    preview: '#FF7B25',
    tokens: {
      accent: '#FF7B25',
      accentFrom: '#FFA633',
      accentTo: '#FF7A26',
      bg: '#FFF8F0',
      surface: '#FFFFFF',
      surface2: '#FFF4E5',
      success: '#7BB661',
      error: '#E07856',
      locked: '#D3D2C7',
      textPrimary: '#2A2A2A',
      textSecondary: '#5C5147',
      textHint: '#A89B8C',
      borderSoft: '#F2D8B0',
      borderStrong: '#E5C798',
      flame: '#F59E0B',
      text: '#2A2A2A',
      textSub: '#5C5147',
      soft: '#FFF4E5',
      green: '#7BB661',
      blue: '#3F88C5',
    },
  },
  {
    id: 'tropical-teal',
    name: '东南亚热带',
    preview: '#1A6B5A',
    tokens: {
      accent: '#1A6B5A',
      accentFrom: '#1A6B5A',
      accentTo: '#2D9E8A',
      bg: '#FDFAF4',
      surface: '#FFFFFF',
      surface2: '#F0FAF6',
      success: '#2ECC71',
      error: '#E53E3E',
      locked: '#C5D1CB',
      textPrimary: '#1A1A2E',
      textSecondary: '#4A6B5A',
      textHint: '#8FA89B',
      borderSoft: '#D4E8DF',
      borderStrong: '#A8C8BA',
      flame: '#D4A017',
      text: '#1A1A2E',
      textSub: '#4A6B5A',
      soft: '#F0FAF6',
      green: '#2ECC71',
      blue: '#1A6B5A',
    },
  },
  {
    id: 'midnight-blue',
    name: '深夜蓝',
    preview: '#3B5BDB',
    tokens: {
      accent: '#3B5BDB',
      accentFrom: '#3B5BDB',
      accentTo: '#5C7AEA',
      bg: '#F0F4FF',
      surface: '#FFFFFF',
      surface2: '#E8EEFF',
      success: '#40C057',
      error: '#FA5252',
      locked: '#CED4DA',
      textPrimary: '#1A1A2E',
      textSecondary: '#495057',
      textHint: '#ADB5BD',
      borderSoft: '#D0D8F0',
      borderStrong: '#A8BADE',
      flame: '#F59E0B',
      text: '#1A1A2E',
      textSub: '#495057',
      soft: '#E8EEFF',
      green: '#40C057',
      blue: '#3B5BDB',
    },
  },
  {
    id: 'cherry-blossom',
    name: '樱花粉',
    preview: '#D6336C',
    tokens: {
      accent: '#D6336C',
      accentFrom: '#D6336C',
      accentTo: '#F06595',
      bg: '#FFF0F6',
      surface: '#FFFFFF',
      surface2: '#FFE3EC',
      success: '#37B24D',
      error: '#E03131',
      locked: '#D3D2C7',
      textPrimary: '#2A2A2A',
      textSecondary: '#6B4C5A',
      textHint: '#B09BA5',
      borderSoft: '#F5C0D0',
      borderStrong: '#ECA0B8',
      flame: '#F59E0B',
      text: '#2A2A2A',
      textSub: '#6B4C5A',
      soft: '#FFE3EC',
      green: '#37B24D',
      blue: '#D6336C',
    },
  },
];
