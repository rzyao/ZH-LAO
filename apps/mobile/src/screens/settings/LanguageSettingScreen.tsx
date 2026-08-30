import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react-native';

import { AppScrollView } from '../../components/common/AppScrollView';
import { AppText } from '../../components/common/AppText';
import { LaoText } from '../../components/common/LaoText';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { toast } from '../../components/feedback/Toast';
import { useI18n } from '../../i18n';
import type { LanguageCode } from '../../i18n';
import { useTheme } from '../../theme/ThemeProvider';

export interface LanguageSettingScreenProps {
  readonly navigation: { goBack: () => void };
}

const OPTIONS: readonly ({ value: LanguageCode; zh: string; lo: string })[] = [
  { value: 'lo', zh: '老挝语', lo: 'ພາສາລາວ' },
  { value: 'zh', zh: '中文', lo: 'ພາສາຈີນ' },
];

/**
 * REPRESENTATIVE MIGRATION SCREEN (REFACTOR).
 *
 * The UI comes from the legacy product; the storage behind it is V2: language
 * preference lives in the AsyncStorage-backed preferences store instead of the
 * legacy `user_profile` blob that mixed profile data with credentials.
 */
export function LanguageSettingScreen({ navigation }: LanguageSettingScreenProps) {
  const { colors } = useTheme();
  const { t, lang, learningLanguage, setLearningLanguage } = useI18n();
  const isLao = lang === 'lo';

  const title = t.languageSetting?.title ?? (isLao ? 'ການຕັ້ງຄ່າພາສາ' : '语言设置');
  const subtitle = isLao ? 'ເລືອກພາສາທີ່ທ່ານຕ້ອງການຮຽນ' : '选择你要学习的语言';

  const handleSelect = (value: LanguageCode) => {
    if (value === learningLanguage) {
      return;
    }
    setLearningLanguage(value);
    toast.success(isLao ? 'ອັບເດດພາສາແລ້ວ' : '学习语言已更新');
  };

  return (
    <ScreenContainer muted testID="language-setting-screen">
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="返回"
          testID="language-back"
        >
          <ChevronLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        {isLao ? (
          <LaoText variant="laoTitle" bold style={{ color: colors.textPrimary }}>
            {title}
          </LaoText>
        ) : (
          <AppText variant="h3" colorVariant="primary" bold testID="language-title">
            {title}
          </AppText>
        )}
      </View>

      <AppScrollView contentContainerStyle={styles.content}>
        <AppText variant="caption" colorVariant="secondary">
          {subtitle}
        </AppText>

        <View style={styles.list}>
          {OPTIONS.map((option) => {
            const isSelected = learningLanguage === option.value;
            const label = isLao ? option.lo : option.zh;

            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleSelect(option.value)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={label}
                testID={`language-option-${option.value}`}
                style={[
                  styles.option,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? colors.accent : colors.borderSoft,
                  },
                ]}
              >
                {isLao ? (
                  <LaoText variant="laoBody" bold style={{ color: colors.textPrimary }}>
                    {label}
                  </LaoText>
                ) : (
                  <AppText variant="body" colorVariant="primary" medium>
                    {label}
                  </AppText>
                )}
                {isSelected ? (
                  <Check size={18} color={colors.accent} testID={`language-selected-${option.value}`} />
                ) : (
                  <ChevronRight size={16} color={colors.textHint} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </AppScrollView>
    </ScreenContainer>
  );
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
  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 14,
  },
  list: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
});
