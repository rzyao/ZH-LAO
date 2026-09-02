import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppButton } from '../../components/common/AppButton';
import { AppScrollView } from '../../components/common/AppScrollView';
import { AppText } from '../../components/common/AppText';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { FormField } from '../../components/common/FormField';
import { useAppForm } from '../../forms/useAppForm';
import { z } from 'zod';
import type { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeProvider';
import { httpClient } from '../../api/client/httpClient';

export interface LoginScreenProps {
  readonly navigation: NativeStackNavigationProp<RootStackParamList>;
}

const loginSchema = z.object({
  phone: z.string().min(1, '请输入手机号'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { colors } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { control, handleSubmit } = useAppForm<LoginFormValues>({
    schema: loginSchema,
    defaultValues: {
      phone: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await httpClient.post('/api/v1/identity/phone-otp', {
        phone: values.phone.trim(),
        purpose: 'login',
      });
      navigation.navigate('Otp', { phone: values.phone.trim(), purpose: 'login' });
    } catch (error: any) {
      setErrorMessage(error?.message || '获取验证码失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer testID="login-screen">
      <AppScrollView contentContainerStyle={styles.content}>
        <AppText variant="h2" colorVariant="primary" bold testID="login-title">
          手机号登录 / 注册
        </AppText>
        <AppText variant="bodySmall" colorVariant="secondary">
          请输入您的手机号码以接收短信验证码
        </AppText>

        <View style={styles.form}>
          <FormField
            control={control}
            name="phone"
            label="手机号码"
            placeholder="+85620..."
            inputProps={{
              keyboardType: 'phone-pad',
              autoCapitalize: 'none',
              autoCorrect: false,
            }}
            testID="login-phone-input"
          />

          {errorMessage ? (
            <AppText variant="caption" style={{ color: colors.error }} testID="login-error-text">
              {errorMessage}
            </AppText>
          ) : null}

          <AppButton
            title={isSubmitting ? '发送中...' : '获取验证码'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
            testID="login-submit-button"
          />
        </View>
      </AppScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
    justifyContent: 'center',
  },
  form: {
    gap: 16,
    marginTop: 20,
  },
});
