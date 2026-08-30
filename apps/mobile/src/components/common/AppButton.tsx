import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

import { AppText } from './AppText';

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface AppButtonProps {
  readonly title: string;
  readonly onPress: () => void;
  readonly variant?: AppButtonVariant;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly testID?: string;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
  /** Renders the label with the Lao-aware text component. */
  readonly isLao?: boolean;
}

/**
 * Standard button.
 *
 * Disabled and loading states are both honoured so business screens cannot
 * accidentally allow double submission.
 */
export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  testID,
  accessibilityLabel,
  style,
}: AppButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const palette = {
    primary: { background: colors.accent, text: '#FFFFFF', border: colors.accent },
    secondary: { background: colors.surface2, text: colors.textPrimary, border: colors.borderSoft },
    ghost: { background: 'transparent', text: colors.textPrimary, border: colors.borderSoft },
    danger: { background: colors.error, text: '#FFFFFF', border: colors.error },
  }[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={accessibilityLabel ?? title}
      testID={testID}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: palette.background,
          borderColor: palette.border,
          opacity: isDisabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <View style={styles.row} testID={testID ? `${testID}-loading` : undefined}>
          <ActivityIndicator size="small" color={palette.text} />
          <AppText variant="body" medium style={{ color: palette.text }}>
            {title}
          </AppText>
        </View>
      ) : (
        <AppText variant="body" medium style={{ color: palette.text }} testID={testID ? `${testID}-label` : undefined}>
          {title}
        </AppText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
