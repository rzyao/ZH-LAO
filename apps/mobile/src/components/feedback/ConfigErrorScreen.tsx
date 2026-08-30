import { StyleSheet, View } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';

import { CONFIG_ERROR_MESSAGE } from '../../config/env';
import { AppText } from '../common/AppText';

export interface ConfigErrorScreenProps {
  readonly detail?: string | null;
}

/**
 * Blocking configuration screen.
 *
 * A missing API base URL must fail clearly. It must never silently fall back to
 * a guessed host or a developer-machine address.
 */
export function ConfigErrorScreen({ detail }: ConfigErrorScreenProps) {
  return (
    <View style={styles.container} testID="config-error-screen">
      <TriangleAlert size={32} color="#FF3B30" />
      <AppText variant="h3" colorVariant="primary" bold center>
        配置错误
      </AppText>
      <AppText variant="bodySmall" colorVariant="secondary" center>
        {CONFIG_ERROR_MESSAGE}
      </AppText>
      {detail ? (
        <AppText variant="caption" colorVariant="hint" center testID="config-error-detail">
          {detail}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
    backgroundColor: '#F7F8FA',
  },
});
