import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Globe } from 'lucide-react-native';

import { AppScrollView } from '../../components/common/AppScrollView';
import { AppText } from '../../components/common/AppText';
import { LaoText } from '../../components/common/LaoText';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { toast } from '../../components/feedback/Toast';
import { useI18n } from '../../i18n';
import type { LanguageCode } from '../../i18n';
import { useTheme } from '../../theme/ThemeProvider';

export interface LanguageSelectScreenProps {
  readonly navigation: { goBack: () => void };
}

const DIRECTIONS: readonly ({
  readonly value: LanguageCode;
  readonly title: string;
  readonly lao: string;
  readonly description: string;
  readonly laoDescription: string;
  readonly accent: string;
})[] = [
  {
    value: 'lo',
    title: '我想学老挝语',
    lao: 'ຂ້ອຍຢາກຮຽນພາສາລາວ',
    description: '中文界面 · 老挝语学习内容',
    laoDescription: 'ພາສາຈີນ · ຮຽນພາສາລາວ',
    accent: '#FF7B25',
  },
  {
    value: 'zh',
    title: '我想学中文',
    lao: 'ຂ້ອຍຢາກຮຽນພາສາຈີນ',
    description: '老挝语界面 · 中文学习内容',
    laoDescription: 'ພາສາລາວ · ຮຽນພາສາຈີນ',
    accent: '#0F6FFF',
  },
];

/**
 * REPRESENTATIVE MIGRATION SCREEN (REFACTOR).
 *
 * Legacy onboarding-style direction picker. UI preserved; the language profile
 * now flows through the V2 i18n provider backed by the preferences store.
 */
export function LanguageSelectScreen({ navigation }: LanguageSelectScreenProps) {
  const { colors } = useTheme();
  const { lang, learningLanguage, setLearningLanguage } = useI18n();
  const isLao = lang === 'lo';

  const handleSelect = (value: LanguageCode) => {
    setLearningLanguage(value);
    toast.success(isLao ? 'ອັບເດດພາສາແລ້ວ' : '学习语言已更新');
    navigation.goBack();
  };

  return (
    <ScreenContainer muted testID="language-select-screen">
      <AppScrollView contentContainerStyle={styles.content}>
        <View style={[styles.logoCircle, { backgroundColor: colors.accent }]}>
          <AppText variant="h1" colorVariant="white" bold>
            中
          </AppText>
        </View>

        <AppText variant="h2" colorVariant="primary" bold center testID="language-select-title">
          选择学习语言方向
        </AppText>
        <LaoText variant="laoBodySmall" style={{ color: colors.textSecondary, marginBottom: 16 }}>
          ເລືອກທິດທາງການຮຽນພາສາ
        </LaoText>

        <View style={styles.cardList}>
          {DIRECTIONS.map((direction) => (
            <TouchableOpacity
              key={direction.value}
              onPress={() => handleSelect(direction.value)}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor:
                    learningLanguage === direction.value ? colors.accent : colors.borderSoft,
                },
              ]}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={direction.title}
              testID={`language-direction-${direction.value}`}
            >
              <View style={[styles.iconBox, { backgroundColor: direction.accent }]}>
                <Globe size={28} color="#ffffff" />
              </View>
              <View style={styles.cardInfo}>
                <AppText variant="h3" colorVariant="primary" bold>
                  {direction.title}
                </AppText>
                <LaoText variant="laoBodySmall" style={{ color: colors.textSecondary }}>
                  {direction.lao}
                </LaoText>
                <AppText variant="caption" colorVariant="hint">
                  {isLao ? direction.laoDescription : direction.description}
                </AppText>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </AppScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 140,
    alignItems: 'center',
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardList: {
    width: '100%',
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
});
