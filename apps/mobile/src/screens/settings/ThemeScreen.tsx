import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Check, ChevronLeft } from 'lucide-react-native';

import { AppScrollView } from '../../components/common/AppScrollView';
import { AppText } from '../../components/common/AppText';
import { LaoText } from '../../components/common/LaoText';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { fmt, useI18n } from '../../i18n';
import { THEME_PRESETS } from '../../theme/presets';
import type { AppTheme } from '../../theme/presets';
import { useTheme } from '../../theme/ThemeProvider';

export interface ThemeScreenProps {
  readonly navigation: { goBack: () => void };
}

/**
 * REUSE from the legacy product UI.
 *
 * Zero API dependency: theme selection is a pure client preference. This screen
 * is the primary representative migration proving the
 * Theme -> Navigation -> Shared Component -> Screen reuse path.
 */
export function ThemeScreen({ navigation }: ThemeScreenProps) {
  const { themeId, setThemeId, colors } = useTheme();
  const { t, lang } = useI18n();
  const isLao = lang === 'lo';

  return (
    <ScreenContainer muted testID="theme-screen">
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="返回"
          testID="theme-back"
        >
          <ChevronLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        {isLao ? (
          <LaoText variant="laoTitle" bold style={{ color: colors.textPrimary }}>
            {t.theme?.title ?? 'ຮູບແບບສີສັນ'}
          </LaoText>
        ) : (
          <AppText variant="h3" colorVariant="primary" bold testID="theme-title">
            {t.theme?.title ?? '主题外观'}
          </AppText>
        )}
      </View>

      <AppScrollView contentContainerStyle={styles.scrollContent}>
        {isLao ? (
          <LaoText variant="laoBodySmall" style={[styles.tipText, { color: colors.textSecondary }]}>
            {t.theme?.tip ?? 'ເລືອກຮູບແບບສີສັນທີ່ທ່ານມັກ'}
          </LaoText>
        ) : (
          <AppText variant="caption" colorVariant="secondary" style={styles.tipText}>
            {t.theme?.tip ?? '选择你喜欢的 App 视觉配色风格，即时生效'}
          </AppText>
        )}

        <View style={styles.list}>
          {THEME_PRESETS.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isSelected={themeId === theme.id}
              isLao={isLao}
              onSelect={setThemeId}
            />
          ))}
        </View>
      </AppScrollView>
    </ScreenContainer>
  );
}

function ThemeCard({
  theme,
  isSelected,
  isLao,
  onSelect,
}: {
  readonly theme: AppTheme;
  readonly isSelected: boolean;
  readonly isLao: boolean;
  readonly onSelect: (id: string) => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => onSelect(theme.id)}
      style={[
        styles.themeCard,
        { backgroundColor: theme.tokens.surface },
        isSelected && { borderColor: theme.tokens.accent, borderWidth: 2 },
      ]}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={theme.name}
      testID={`theme-option-${theme.id}`}
    >
      <View style={styles.colorRow}>
        <View style={[styles.mainColorDot, { backgroundColor: theme.tokens.accent }]} />
        <View style={[styles.subColorDot, { backgroundColor: theme.tokens.bg }]} />
        <View style={[styles.subColorDot, { backgroundColor: theme.tokens.surface2 }]} />
        <View style={[styles.subColorDot, { backgroundColor: theme.tokens.success }]} />
      </View>

      <View style={styles.themeInfo}>
        <View style={styles.titleRow}>
          <AppText variant="h4" colorVariant="primary" bold>
            {theme.name}
          </AppText>
          {theme.id === 'azure-sky' ? (
            <View style={[styles.defaultTag, { backgroundColor: theme.tokens.accent }]}>
              {isLao ? (
                <LaoText variant="micro" bold style={{ color: '#ffffff' }}>
                  {t_default(isLao)}
                </LaoText>
              ) : (
                <AppText variant="micro" colorVariant="white" bold>
                  {t_default(isLao)}
                </AppText>
              )}
            </View>
          ) : null}
        </View>
        <AppText variant="micro" colorVariant="secondary">
          {fmt('主色调: {color}', { color: theme.tokens.accent })}
        </AppText>
      </View>

      {isSelected ? (
        <View
          style={[styles.checkCircle, { backgroundColor: theme.tokens.accent }]}
          testID={`theme-selected-${theme.id}`}
        >
          <Check size={14} color="#ffffff" />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function t_default(isLao: boolean): string {
  return isLao ? 'ຄ່າເລີ່ມຕົ້ນ' : '默认';
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
    gap: 14,
  },
  tipText: {
    marginBottom: 4,
  },
  list: {
    gap: 12,
  },
  themeCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: 'rgba(102,51,0,0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mainColorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  subColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themeInfo: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  defaultTag: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
