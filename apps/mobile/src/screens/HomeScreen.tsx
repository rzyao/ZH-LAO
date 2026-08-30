import { StyleSheet, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { readAppConfig, validateAppConfig } from '../config/env';
import { AppButton } from '../components/common/AppButton';
import { AppScrollView } from '../components/common/AppScrollView';
import { AppText } from '../components/common/AppText';
import { ScreenContainer } from '../components/common/ScreenContainer';
import { useAuth } from '../auth/context/AuthProvider';
import { useI18n } from '../i18n';
import type { RootStackParamList } from '../navigation/types';
import { formatDateTimeWithSeconds } from '../api/contracts/time';
import { useTheme } from '../theme/ThemeProvider';

export interface HomeScreenProps {
  readonly navigation: NativeStackNavigationProp<RootStackParamList>;
}

/** Fixed UUID used to demonstrate the UUID route contract. */
const DEMO_RESOURCE_ID = '3f2f8c1e-5b7a-4a1d-9c6e-8d0b2f4a7e11';

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { colors, theme, themeId } = useTheme();
  const { session, isSecureStorageAvailable } = useAuth();
  const { lang, learningLanguage } = useI18n();

  const config = readAppConfig();
  const configIssues = validateAppConfig(config);

  return (
    <ScreenContainer testID="home-screen">
      <AppScrollView contentContainerStyle={styles.content}>
        <AppText variant="h2" colorVariant="primary" bold testID="home-title">
          ZH-LAO V2 Mobile Foundation
        </AppText>
        <AppText variant="bodySmall" colorVariant="secondary">
          Infrastructure ready. No domain API is integrated in this phase.
        </AppText>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSoft }]}>
          <Row label="Theme" value={`${theme.name} (${themeId})`} testID="home-theme" />
          <Row label="Interface language" value={lang} />
          <Row label="Learning language" value={learningLanguage} />
          <Row label="Session status" value={session.status} testID="home-session-status" />
          <Row label="Session reason" value={session.reason} />
          <Row
            label="Secure storage"
            value={isSecureStorageAvailable ? 'available' : 'unsupported on this platform'}
            testID="home-secure-storage"
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSoft }]}>
          <AppText variant="h4" colorVariant="primary" bold>
            Environment
          </AppText>
          <Row label="App env" value={config.appEnv} />
          <Row label="Platform" value={config.platform} />
          <Row
            label="API base URL"
            value={config.apiBaseUrl || '(not configured)'}
            testID="home-api-base-url"
          />
          <Row
            label="Config status"
            value={configIssues.length === 0 ? 'valid' : `${configIssues.length} issue(s)`}
            testID="home-config-status"
          />
          <Row label="Started at" value={formatDateTimeWithSeconds(STARTED_AT, { timeZone: 'utc' })} />
        </View>

        <View style={styles.actions}>
          <AppButton
            title="主题外观"
            onPress={() => navigation.navigate('Theme')}
            testID="home-open-theme"
          />
          <AppButton
            title="语言设置"
            variant="secondary"
            onPress={() => navigation.navigate('LanguageSetting')}
            testID="home-open-language"
          />
          <AppButton
            title="UUID 路由示例"
            variant="ghost"
            onPress={() => navigation.navigate('ResourceDetail', { resourceId: DEMO_RESOURCE_ID })}
            testID="home-open-resource"
          />
        </View>
      </AppScrollView>
    </ScreenContainer>
  );
}

const STARTED_AT = new Date().toISOString();

function Row({
  label,
  value,
  testID,
}: {
  readonly label: string;
  readonly value: string;
  readonly testID?: string;
}) {
  return (
    <View style={styles.row}>
      <AppText variant="bodySmall" colorVariant="secondary">
        {label}
      </AppText>
      <AppText variant="bodySmall" colorVariant="primary" medium testID={testID}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 140,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  actions: {
    gap: 10,
  },
});
