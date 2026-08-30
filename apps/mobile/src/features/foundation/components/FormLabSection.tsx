import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { AppButton } from '../../../components/common/AppButton';
import { AppText } from '../../../components/common/AppText';
import { FormField } from '../../../components/common/FormField';
import { toast } from '../../../components/feedback/Toast';
import { appZodResolver, useAppForm } from '../../../forms/useAppForm';
import {
  FOUNDATION_DEMO_CATEGORY_OPTIONS,
  foundationDemoFormDefaults,
  foundationDemoFormSchema,
} from '../../../forms/schemas';
import type { FoundationDemoFormValues } from '../../../forms/schemas';
import { useTheme } from '../../../theme/ThemeProvider';

/**
 * Form foundation lab — a NEUTRAL demo form.
 *
 * It validates input / validation / error / submit / loading / disabled using
 * React Hook Form + Zod. It is deliberately not a login or register form.
 */
export function FormLabSection() {
  const { colors } = useTheme();
  const { form, isSubmitting, submitError, submitWith } = useAppForm<FoundationDemoFormValues>({
    resolver: appZodResolver<FoundationDemoFormValues>(foundationDemoFormSchema),
    defaultValues: foundationDemoFormDefaults,
  });
  const [lastSubmitted, setLastSubmitted] = useState<string | null>(null);

  const { control, handleSubmit, watch, setValue } = form;
  const category = watch('category');
  const accepted = watch('accepted');

  const onSubmit = submitWith(async (values) => {
    // Simulated local submit: no network, no domain API.
    await new Promise((resolve) => setTimeout(resolve, 400));
    setLastSubmitted(JSON.stringify(values));
    toast.success('表单校验通过（仅本地演示）');
  });

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderSoft }]}
      testID="form-lab"
    >
      <AppText variant="h4" colorVariant="primary" bold>
        Form（React Hook Form + Zod）
      </AppText>

      <FormField
        control={control}
        name="label"
        label="名称（2-40 字符）"
        placeholder="请输入名称"
        testID="form-label"
      />

      <FormField
        control={control}
        name="quantity"
        label="数量（1-99 整数）"
        placeholder="1"
        testID="form-quantity"
        inputProps={{ keyboardType: 'numeric' }}
      />

      <FormField
        control={control}
        name="note"
        label="备注（可选，≤200 字符）"
        placeholder="可选"
        testID="form-note"
      />

      <View style={styles.fieldBlock}>
        <AppText variant="bodySmall" colorVariant="secondary" medium>
          分类
        </AppText>
        <View style={styles.chipRow}>
          {FOUNDATION_DEMO_CATEGORY_OPTIONS.map((option) => (
            <AppButton
              key={option.value}
              title={option.label}
              variant={category === option.value ? 'primary' : 'ghost'}
              onPress={() => setValue('category', option.value, { shouldValidate: true })}
              testID={`form-category-${option.value}`}
              style={styles.chip}
            />
          ))}
        </View>
      </View>

      <View style={styles.switchRow}>
        <AppText variant="bodySmall" colorVariant="primary">
          我已确认（提交前置条件）
        </AppText>
        <Switch
          value={accepted}
          onValueChange={(value) => setValue('accepted', value, { shouldValidate: true })}
          trackColor={{ false: colors.locked, true: colors.accent }}
          thumbColor="#ffffff"
          accessibilityLabel="确认勾选"
          testID="form-accepted"
        />
      </View>

      {submitError ? (
        <AppText variant="caption" colorVariant="error" testID="form-submit-error">
          {submitError}
        </AppText>
      ) : null}

      <AppButton
        title={isSubmitting ? '提交中…' : '提交'}
        onPress={() => void handleSubmit(onSubmit)()}
        disabled={isSubmitting}
        loading={isSubmitting}
        testID="form-submit"
      />

      {lastSubmitted ? (
        <AppText variant="caption" colorVariant="hint" testID="form-result">
          {lastSubmitted}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  fieldBlock: {
    gap: 6,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    minHeight: 38,
    paddingVertical: 6,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
