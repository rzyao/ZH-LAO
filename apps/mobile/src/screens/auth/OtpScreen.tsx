import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
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
import { useAuth } from '../../auth/context/AuthProvider';
import { tokenStore } from '../../auth/storage/tokenStore';

export interface OtpScreenProps {
  readonly navigation: NativeStackNavigationProp<RootStackParamList>;
  readonly route: RouteProp<RootStackParamList, 'Otp'>;
}

const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, '请输入 6 位数字验证码'),
});

type OtpFormValues = z.infer<typeof otpSchema>;

export function OtpScreen({ navigation, route }: OtpScreenProps) {
  const { colors } = useTheme();
  const { refreshSession } = useAuth();
  const phone = route.params?.phone || '';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const { control, handleSubmit } = useAppForm<OtpFormValues>({
    schema: otpSchema,
    defaultValues: {
      code: '',
    },
  });

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await httpClient.post('/api/v1/identity/phone-otp', {
        phone,
        purpose: 'login',
      });
      setCountdown(60);
      setErrorMessage(null);
    } catch (error: any) {
      setErrorMessage(error?.message || '重发验证码失败，请稍后重试');
    }
  };

  const onSubmit = async (values: OtpFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await httpClient.post<{
        user_id: string;
        access_token: string;
        refresh_token: string;
        is_new_user: boolean;
      }>('/api/v1/identity/auth/phone', {
        phone,
        otp_code: values.code,
        learning_direction: {
          native_language: 'lo',
          learning_language: 'zh',
        },
      });

      if (response.data) {
        tokenStore.setAccessToken(response.data.access_token);
        await tokenStore.setRefreshToken(response.data.refresh_token);
        await tokenStore.writeSessionMetadata({
          subjectId: response.data.user_id,
          updatedAt: new Date().toISOString(),
        });
        await refreshSession();
        navigation.navigate('MainTabs');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || '验证码错误或已失效');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer testID="otp-screen">
      <AppScrollView contentContainerStyle={styles.content}>
        <AppText variant="h2" colorVariant="primary" bold testID="otp-title">
          输入验证码
        </AppText>
        <AppText variant="bodySmall" colorVariant="secondary">
          验证码已发送至 {phone}
        </AppText>

        <View style={styles.form}>
          <FormField
            control={control}
            name="code"
            label="6 位验证码"
            placeholder="123456"
            inputProps={{
              keyboardType: 'number-pad',
              maxLength: 6,
              autoCapitalize: 'none',
              autoCorrect: false,
            }}
            testID="otp-code-input"
          />

          {errorMessage ? (
            <AppText variant="caption" style={{ color: colors.error }} testID="otp-error-text">
              {errorMessage}
            </AppText>
          ) : null}

          <AppButton
            title={isSubmitting ? '验证中...' : '确认登录'}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={isSubmitting}
            testID="otp-submit-button"
          />

          <AppButton
            title={countdown > 0 ? `重新获取 (${countdown}s)` : '重新获取验证码'}
            variant="ghost"
            onPress={handleResend}
            disabled={countdown > 0}
            testID="otp-resend-button"
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
