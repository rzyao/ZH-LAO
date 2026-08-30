import {
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { useTheme } from '../../theme/ThemeProvider';

import { AppText } from './AppText';

export interface FormFieldProps<TValues extends FieldValues> {
  readonly control: Control<TValues>;
  readonly name: FieldPath<TValues>;
  readonly label: string;
  readonly placeholder?: string;
  readonly helper?: string;
  readonly disabled?: boolean;
  readonly testID?: string;
  readonly inputProps?: Omit<TextInputProps, 'value' | 'onChangeText' | 'onBlur'>;
  readonly style?: StyleProp<ViewStyle>;
}

/**
 * Standard React Hook Form field.
 *
 * Error, helper text, disabled and accessibility wiring live here so every form
 * in the app behaves identically.
 */
export function FormField<TValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  helper,
  disabled = false,
  testID,
  inputProps,
  style,
}: FormFieldProps<TValues>) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <AppText variant="bodySmall" colorVariant="secondary" medium>
        {label}
      </AppText>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
          <>
            <TextInput
              value={value === undefined || value === null ? '' : String(value)}
              onChangeText={(text) => onChange(text)}
              onBlur={onBlur}
              placeholder={placeholder}
              editable={!disabled}
              accessibilityLabel={label}
              testID={testID ?? `form-field-${name}`}
              placeholderTextColor={colors.textHint}
              style={[
                styles.input,
                {
                  borderColor: error ? colors.error : colors.borderSoft,
                  color: colors.textPrimary,
                  backgroundColor: disabled ? colors.surface2 : colors.surface,
                },
              ]}
              {...inputProps}
            />
            {error?.message ? (
              <AppText
                variant="caption"
                colorVariant="error"
                testID={testID ? `${testID}-error` : `form-field-${name}-error`}
              >
                {error.message}
              </AppText>
            ) : helper ? (
              <AppText variant="caption" colorVariant="hint">
                {helper}
              </AppText>
            ) : null}
          </>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
});
