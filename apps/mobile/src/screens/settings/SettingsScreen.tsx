import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ChevronRight, Palette, ShieldCheck } from 'lucide-react-native';

import { AppScrollView } from '../../components/common/AppScrollView';
import { AppText } from '../../components/common/AppText';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useAuth } from '../../auth/context/AuthProvider';
import { useI18n } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export interface SettingsScreenProps {
  readonly navigation: NativeStackNavigationProp<RootStackParamList>;
}

/**
 * Foundation settings screen.
 *
 * Only locally-owned preferences are shown: theme, language direction and
 * session/storage diagnostics. The legacy screen's profile fetch and social
 * toggle belong to Identity / Social and are intentionally NOT migrated.
 */
export function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { colors, theme } = useTheme();
  const { session, isSecureStorageAvailable, signOut } = useAuth();
  const { t, lang, learningLanguage } = useI18n();

  const learningLangName = learningLanguage === 'zh' ? '中文' : 'ພາສາລາວ';

  return (
    <ScreenContainer testID="settings-screen">
      <AppScrollView contentContainerStyle={styles.content}>
        <AppText variant="h2" colorVariant="primary" bold testID="settings-title">
          {t.settings?.title ?? '设置'}
        </AppText>

        <View style={styles.section}>
          <TouchableOpacity
            onPress={() => navigation.navigate('LanguageSetting')}
            style={[styles.row, { backgroundColor: colors.surface }]}
            activeOpacity={0.7}
            accessibilityRole="button"
            testID="settings-language"
          >
            <AppText variant="body" colorVariant="primary" medium>
              {t.settings?.learningLang ?? '学习语言'}
            </AppText>
            <View style={styles.rowRight}>
              <AppText variant="body" colorVariant="secondary">
                {learningLangName}
              </AppText>
              <ChevronRight size={16} color={colors.textHint} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Theme')}
            style={[styles.row, { backgroundColor: colors.surface }]}
            activeOpacity={0.7}
            accessibilityRole="button"
            testID="settings-theme"
          >
            <View style={styles.rowLeft}>
              <Palette size={16} color={colors.textSecondary} />
              <AppText variant="body" colorVariant="primary" medium>
                {t.settings?.theme ?? '主题外观'}
              </AppText>
            </View>
            <View style={styles.rowRight}>
              <AppText variant="body" colorVariant="secondary">
                {theme.name}
              </AppText>
              <ChevronRight size={16} color={colors.textHint} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ShieldCheck size={14} color={colors.textSecondary} />
            <AppText variant="bodySmall" colorVariant="secondary" medium>
              Session / Storage（Foundation 诊断）
            </AppText>
          </View>
          <View style={[styles.diagnostics, { backgroundColor: colors.surface, borderColor: colors.borderSoft }]}>
            <Diagnostic label="Session status" value={session.status} testID="settings-session-status" />
            <Diagnostic label="Bootstrap reason" value={session.reason} />
            <Diagnostic
              label="Stored credential"
              value={session.hasStoredCredential ? 'present' : 'none'}
            />
            <Diagnostic
              label="Secure storage"
              value={isSecureStorageAvailable ? 'Keychain / KeyStore' : 'unsupported (web)'}
              testID="settings-secure-storage"
            />
            <Diagnostic label="Interface language" value={lang} />
          </View>
          <AppText variant="caption" colorVariant="hint">
            认证流程等待 Identity Domain API 冻结后接入；Foundation 不调用任何 Identity 接口。
          </AppText>
          {session.status === 'authenticated' ? (
            <TouchableOpacity onPress={() => void signOut()} style={styles.signOut} testID="settings-sign-out">
              <AppText variant="body" colorVariant="error" medium>
                清除本地会话
              </AppText>
            </TouchableOpacity>
          ) : null}
        </View>
      </AppScrollView>
    </ScreenContainer>
  );
}

function Diagnostic({
  label,
  value,
  testID,
}: {
  readonly label: string;
  readonly value: string;
  readonly testID?: string;
}) {
  return (
    <View style={styles.diagnosticRow}>
      <AppText variant="caption" colorVariant="secondary">
        {label}
      </AppText>
      <AppText variant="caption" colorVariant="primary" medium testID={testID}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 150,
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diagnostics: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  diagnosticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  signOut: {
    paddingVertical: 10,
  },
});
