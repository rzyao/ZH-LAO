import { TextStyle, Platform } from 'react-native';

export const FONT_FAMILIES = {
  // 老挝语专用字体（已通过 expo-font 加载 TTF）
  laoRegular: 'NotoSansLao-Regular',
  laoBold: 'NotoSansLao-Bold',
  // 中文/通用 UI 字体 —— 对应 app 端 --font-lao-zh:
  //   'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif
  // iOS: PingFang SC（苹方，系统内置），Android: Noto Sans SC 或 sans-serif fallback
  zh: Platform.select({
    ios: 'PingFang SC',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
  // 数字/计数字体 —— 对应 app 端 --font-lao-num:
  //   'Inter Tight', 'DM Sans', 'Noto Sans SC', sans-serif
  // iOS: Helvetica Neue（数字等宽感强），Android: sans-serif-medium
  num: Platform.select({
    ios: 'Helvetica Neue',
    android: 'sans-serif-medium',
    default: 'sans-serif',
  }),
  // 系统字体（兜底/保留兼容）
  system: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'normal',
  }),
};

export const FONT_SIZES = {
  hero: 40,
  display: 32,
  h1: 24,
  h2: 20,
  h3: 17,
  h4: 15,
  body: 14,
  bodySmall: 13,
  caption: 12,
  micro: 10,
} as const;

export const LINE_HEIGHTS = {
  hero: 56,
  display: 44,
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 22,
  body: 20,
  bodySmall: 18,
  caption: 16,
  micro: 14,
} as const;

export const TYPOGRAPHY: Record<string, TextStyle> = {
  // 老挝语专用 Token（包含安全防截断设置）
  laoHero: {
    fontSize: FONT_SIZES.hero,
    lineHeight: LINE_HEIGHTS.hero,
    fontFamily: FONT_FAMILIES.laoBold,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  laoDisplay: {
    fontSize: FONT_SIZES.display,
    lineHeight: 46,
    fontFamily: FONT_FAMILIES.laoBold,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  laoBig: {
    fontSize: FONT_SIZES.h1,
    lineHeight: 36,
    fontFamily: FONT_FAMILIES.laoBold,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  laoTitle: {
    fontSize: FONT_SIZES.h2,
    lineHeight: 30,
    fontFamily: FONT_FAMILIES.laoBold,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  laoBody: {
    fontSize: 16,
    lineHeight: 26,
    fontFamily: FONT_FAMILIES.laoRegular,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  laoBodySmall: {
    fontSize: FONT_SIZES.bodySmall,
    lineHeight: 20,
    fontFamily: FONT_FAMILIES.laoRegular,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  // 通用西文/中文排版 Token
  hero: {
    fontSize: FONT_SIZES.hero,
    lineHeight: LINE_HEIGHTS.hero,
    fontWeight: '700',
  },
  display: {
    fontSize: FONT_SIZES.display,
    lineHeight: LINE_HEIGHTS.display,
    fontWeight: '700',
  },
  h1: {
    fontSize: FONT_SIZES.h1,
    lineHeight: LINE_HEIGHTS.h1,
    fontWeight: '700',
  },
  h2: {
    fontSize: FONT_SIZES.h2,
    lineHeight: LINE_HEIGHTS.h2,
    fontWeight: '700',
  },
  h3: {
    fontSize: FONT_SIZES.h3,
    lineHeight: LINE_HEIGHTS.h3,
    fontWeight: '600',
  },
  h4: {
    fontSize: FONT_SIZES.h4,
    lineHeight: LINE_HEIGHTS.h4,
    fontWeight: '600',
  },
  body: {
    fontSize: FONT_SIZES.body,
    lineHeight: LINE_HEIGHTS.body,
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: FONT_SIZES.bodySmall,
    lineHeight: LINE_HEIGHTS.bodySmall,
    fontWeight: '400',
  },
  caption: {
    fontSize: FONT_SIZES.caption,
    lineHeight: LINE_HEIGHTS.caption,
    fontWeight: '400',
  },
  micro: {
    fontSize: FONT_SIZES.micro,
    lineHeight: LINE_HEIGHTS.micro,
    fontWeight: '500',
  },
};

export type TypographyVariant =
  | 'laoHero'
  | 'laoDisplay'
  | 'laoBig'
  | 'laoTitle'
  | 'laoBody'
  | 'laoBodySmall'
  | 'hero'
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'micro';
