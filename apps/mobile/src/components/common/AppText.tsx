import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { TYPOGRAPHY, TypographyVariant, FONT_FAMILIES } from '../../theme/typography';

export type TextColorVariant =
  | 'primary'
  | 'secondary'
  | 'hint'
  | 'accent'
  | 'success'
  | 'error'
  | 'white'
  | 'inherit';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  colorVariant?: TextColorVariant;
  bold?: boolean;
  medium?: boolean;
  isLao?: boolean;
  /** true = 数字/计数内容，应用 num 字体棆（对应 app 端 font-lao-num） */
  isNum?: boolean;
  center?: boolean;
}

/**
 * 统一通用文本组件：
 * 1. 强制规范字号、行高与字重（Typography Tokens）；
 * 2. 主题色语义化映射（colorVariant）；
 * 3. 自动老挝语上下标防截断保护与字体适配（isLao / lao* variants）。
 */
export function AppText({
  variant = 'body',
  colorVariant = 'primary',
  bold = false,
  medium = false,
  isLao = false,
  isNum = false,
  center = false,
  style,
  children,
  ...props
}: AppTextProps) {
  const { colors } = useTheme();

  const colorMap: Record<TextColorVariant, string | undefined> = {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    hint: colors.textHint,
    accent: colors.accent,
    success: colors.success,
    error: colors.error,
    white: '#FFFFFF',
    inherit: undefined,
  };

  const baseStyle: TextStyle = {
    ...TYPOGRAPHY[variant],
    textAlign: center ? 'center' : undefined,
  };

  const color = colorMap[colorVariant];
  if (color) {
    baseStyle.color = color;
  }

  const isLaoVariant = isLao || variant.startsWith('lao');
  if (isLaoVariant) {
    // 老挝语：赋 NotoSansLao 字体 + 防截断保护
    const isBold = bold || variant === 'laoHero' || variant === 'laoDisplay' || variant === 'laoBig' || variant === 'laoTitle';
    baseStyle.fontFamily = isBold ? FONT_FAMILIES.laoBold : FONT_FAMILIES.laoRegular;
    baseStyle.includeFontPadding = false;
    baseStyle.textAlignVertical = 'center';
  } else if (isNum) {
    // 数字/计数：应用 num 字体（对应 app 端 font-lao-num）
    baseStyle.fontFamily = FONT_FAMILIES.num;
    if (bold) {
      baseStyle.fontWeight = '700';
    } else if (medium) {
      baseStyle.fontWeight = '600';
    }
  } else {
    // 中文/通用 UI：应用 zh 字体（对应 app 端 font-lao-zh）
    baseStyle.fontFamily = FONT_FAMILIES.zh;
    if (bold) {
      baseStyle.fontWeight = '700';
    } else if (medium) {
      baseStyle.fontWeight = '600';
    }
  }

  return (
    <RNText style={[baseStyle, style]} {...props}>
      {children}
    </RNText>
  );
}
