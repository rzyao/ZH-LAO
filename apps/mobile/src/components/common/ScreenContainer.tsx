import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../theme/ThemeProvider';

export interface ScreenContainerProps {
  readonly children: React.ReactNode;
  /** Use the page background instead of the surface colour. */
  readonly muted?: boolean;
  readonly testID?: string;
}

/** Standard screen shell: safe area + theme background. */
export function ScreenContainer({ children, muted = false, testID }: ScreenContainerProps) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: muted ? colors.bg : colors.surface2 }]}
      edges={['top']}
      testID={testID}
    >
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
});
