import { StyleSheet } from 'react-native';

import { AppScrollView } from '../components/common/AppScrollView';
import { AppText } from '../components/common/AppText';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { AssetLabSection } from '../features/foundation/components/AssetLabSection';
import { AudioLabSection } from '../features/foundation/components/AudioLabSection';
import { FormLabSection } from '../features/foundation/components/FormLabSection';
import { RealtimeLabSection } from '../features/foundation/components/RealtimeLabSection';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Foundation capability lab.
 *
 * A neutral screen used to validate Audio / Asset / Realtime / Form foundations
 * on device. It contains no business domain logic and no API calls.
 */
export function LabScreen() {
  const { colors } = useTheme();

  return (
    <ScreenContainer testID="lab-screen">
      <AppScrollView contentContainerStyle={styles.content}>
        <AppText variant="h2" colorVariant="primary" bold testID="lab-title">
          能力实验室
        </AppText>
        <AppText variant="bodySmall" colorVariant="secondary">
          Foundation 基础能力自检：Audio / Asset / Realtime / Form
        </AppText>
        <AppText variant="caption" colorVariant="hint">
          {`accent ${colors.accent}`}
        </AppText>

        <AudioLabSection />
        <FormLabSection />
        <AssetLabSection />
        <RealtimeLabSection />
      </AppScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 160,
    gap: 14,
  },
});
