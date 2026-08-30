import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { TYPOGRAPHY, TypographyVariant, FONT_FAMILIES } from '../../theme/typography';

export interface LaoTextProps extends TextProps {
  variant?: TypographyVariant;
  bold?: boolean;
}

/** 老挝语组合符号码点集（非独立字符：下加连字符 ຼ、上下标元音、声调等） */
const LAO_COMBINING_MARKS = new Set([
  0x0eb1, // ັ
  0x0eb4, 0x0eb5, 0x0eb6, 0x0eb7, 0x0eb8, 0x0eb9, // ິ ີ ຶ ື ຸ ູ
  0x0ebb, // ົ
  0x0ebc, // ຼ (LAO SEMIVOWEL SIGN LO / 辅音下加连字符)
  0x0ecd, // ໍ
  0x0ec8, 0x0ec9, 0x0eca, 0x0ecb, 0x0ecc, // ่ ້ ໊ ໋ ໌ (声调及特殊修饰符)
]);

/** 占位虚线圆圈字符（Unicode DOTTED CIRCLE） */
const DOTTED_CIRCLE = '◌';

/**
 * 标准化老挝文字符串：
 * 若文本以非独立组合符号（如孤立的连字符 ຼ 或上下标元音）开头，
 * 自动前置虚线基底符号 ◌ (◌)，使其在移动端原生文本排版引擎（HarfBuzz/CoreText）中能够作为独立图元正常可见。
 */
export function normalizeLaoText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  const firstCp = text.codePointAt(0);
  if (firstCp && LAO_COMBINING_MARKS.has(firstCp)) {
    return DOTTED_CIRCLE + text;
  }
  return text;
}

/**
 * 老挝语专用排版文本组件：
 * 1. 自动绑定 NotoSansLao 字体；
 * 2. 禁用 Android 默认字体填充 (includeFontPadding: false)，防止上标元音和声调符号被截断或错位；
 * 3. 自动将孤立非独立符号（如 ຼ、ິ、່ 等）附着于 ◌ 占位符渲染，彻底解决移动端宽度为 0 导致隐形的问题；
 * 4. 支持无缝传入排版规范 Token (variant)。
 */
export function LaoText({
  variant = 'laoBody',
  bold = false,
  style,
  children,
  ...props
}: LaoTextProps) {
  const typographyStyle = TYPOGRAPHY[variant] || TYPOGRAPHY.laoBody;

  const renderedContent =
    typeof children === 'string'
      ? normalizeLaoText(children)
      : React.Children.map(children, (child) =>
          typeof child === 'string' ? normalizeLaoText(child) : child,
        );

  return (
    <RNText
      style={[
        styles.base,
        typographyStyle,
        bold && styles.bold,
        style,
      ]}
      {...props}
    >
      {renderedContent}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: FONT_FAMILIES.laoRegular,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  bold: {
    fontFamily: FONT_FAMILIES.laoBold,
  },
});
