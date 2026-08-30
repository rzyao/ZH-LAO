import { z } from 'zod';

/**
 * Form validation schemas.
 *
 * The Foundation ships ONE neutral demo schema. It is deliberately generic:
 * no login / register / OTP or other domain form exists in this phase.
 */

export const foundationDemoFormSchema = z.object({
  label: z
    .string()
    .trim()
    .min(2, '名称至少需要 2 个字符')
    .max(40, '名称不能超过 40 个字符'),
  quantity: z
    .number({ error: '请输入数字' })
    .int('必须是整数')
    .min(1, '最小值为 1')
    .max(99, '最大值为 99'),
  category: z.enum(['general', 'audio', 'asset'], {
    error: '请选择一个分类',
  }),
  note: z.string().trim().max(200, '备注不能超过 200 个字符').optional(),
  accepted: z.boolean().refine((value) => value, '需要勾选确认后提交'),
});

export type FoundationDemoFormValues = z.infer<typeof foundationDemoFormSchema>;

export const foundationDemoFormDefaults: FoundationDemoFormValues = {
  label: '',
  quantity: 1,
  category: 'general',
  note: '',
  accepted: false,
};

export const FOUNDATION_DEMO_CATEGORY_OPTIONS: readonly {
  value: FoundationDemoFormValues['category'];
  label: string;
}[] = [
  { value: 'general', label: '通用' },
  { value: 'audio', label: '音频' },
  { value: 'asset', label: '资源' },
];
