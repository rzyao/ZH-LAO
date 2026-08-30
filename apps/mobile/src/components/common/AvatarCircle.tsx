import { Image, StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

import { AppText } from './AppText';

export interface AvatarCircleProps {
  /** Remote URL or empty. The legacy `preset:N` contract is NOT supported. */
  readonly url?: string | null;
  /** Fallback glyph (usually the first character of a display name). */
  readonly fallbackGlyph?: string;
  readonly size?: number;
  readonly testID?: string;
}

function isRenderableUrl(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^(https?:\/\/|file:\/\/|blob:|data:)/i.test(value);
}

/**
 * Generic circular avatar.
 *
 * The V2 Foundation does not inherit the legacy `preset:N` avatar contract —
 * that belongs to the Identity/Social domain.
 */
export function AvatarCircle({
  url,
  fallbackGlyph = 'Z',
  size = 56,
  testID,
}: AvatarCircleProps) {
  const { colors } = useTheme();

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: colors.accent,
  };

  if (isRenderableUrl(url)) {
    return (
      <Image
        source={{ uri: url }}
        style={[containerStyle, styles.image]}
        resizeMode="cover"
        testID={testID ?? 'avatar-circle-image'}
      />
    );
  }

  return (
    <View
      style={[containerStyle, styles.glyphContainer]}
      testID={testID ?? 'avatar-circle-fallback'}
    >
      <AppText
        colorVariant="white"
        bold
        style={{
          fontSize: Math.round(size * 0.38),
          lineHeight: Math.round(size * 0.44),
        }}
      >
        {fallbackGlyph.slice(0, 1)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  glyphContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    overflow: 'hidden',
  },
});
