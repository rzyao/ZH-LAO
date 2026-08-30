import { View, StyleSheet } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

export interface WaveformProps {
  readonly isRecording: boolean;
  /** dB level, typically -160..0. */
  readonly metering: number | null;
  /** Overrides the theme accent when provided. */
  readonly activeColor?: string;
  readonly inactiveColor?: string;
}

/**
 * Recording level indicator.
 *
 * REFACTORED from the legacy component: the legacy version imported a static
 * palette object, which pinned the waveform to the default theme. V2 reads the
 * active theme instead.
 */
export function Waveform({
  isRecording,
  metering,
  activeColor,
  inactiveColor,
}: WaveformProps) {
  const { colors } = useTheme();

  const level = metering ?? -160;
  // Map -60..0 dB onto a 0..1 range.
  const normalized = Math.max(0, Math.min(1, (level + 60) / 60));
  const barHeight = isRecording ? Math.max(10, normalized * 36) : 6;

  const active = activeColor ?? colors.accent;
  const inactive = inactiveColor ?? colors.locked;

  return (
    <View style={styles.container} testID="waveform">
      {[0.4, 0.7, 1.0, 0.8, 0.5, 0.9, 0.6].map((scale, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            {
              height: isRecording ? Math.max(6, barHeight * scale) : 6,
              backgroundColor: isRecording ? active : inactive,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 44,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});
