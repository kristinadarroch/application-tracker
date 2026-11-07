import { useId, useState } from 'react';
import { Text as RNText, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { makeStyles } from '../theme/makeStyles';
import { useTheme } from '../theme/useTheme';
import { Text } from './Text';

export interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  helperText?: string;
  error?: string;
  placeholder?: string;
  multiline?: boolean;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  onBlur?: () => void;
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.space[1] },
  input: {
    ...t.type.body,
    color: t.color.text.primary,
    backgroundColor: t.color.bg.surface,
    borderWidth: 1.5,
    borderColor: t.color.border.strong,
    borderRadius: t.radius.md,
    minHeight: t.size.minTouchTarget,
    paddingHorizontal: t.space[3],
    paddingVertical: t.space[2],
  },
  multiline: { minHeight: 112, textAlignVertical: 'top' },
  focused: { borderColor: t.color.focus.ring, borderWidth: 2 },
  invalid: { borderColor: t.color.feedback.danger.fg },
  errorText: { ...t.type.caption, color: t.color.feedback.danger.fg },
}));

export function TextField({
  label,
  value,
  onChangeText,
  helperText,
  error,
  placeholder,
  multiline = false,
  secure = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  onBlur,
}: TextFieldProps) {
  const styles = useStyles();
  const theme = useTheme();
  const labelId = useId();
  const [focused, setFocused] = useState(false);
  const hasError = error !== undefined && error.length > 0;
  const hint = hasError ? error : helperText;
  return (
    <View style={styles.wrap}>
      <View nativeID={labelId}>
        <Text variant="bodySmall" color="secondary">
          {label}
        </Text>
      </View>
      <TextInput
        accessibilityLabel={label}
        accessibilityLabelledBy={labelId}
        {...(hint === undefined ? {} : { accessibilityHint: hint })}
        value={value}
        onChangeText={onChangeText}
        {...(placeholder === undefined ? {} : { placeholder })}
        placeholderTextColor={theme.color.text.tertiary}
        multiline={multiline}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        style={[
          styles.input,
          multiline ? styles.multiline : null,
          focused ? styles.focused : null,
          hasError ? styles.invalid : null,
        ]}
      />
      {hasError ? (
        <RNText
          style={styles.errorText}
          maxFontSizeMultiplier={theme.maxFontSizeMultiplier.caption}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </RNText>
      ) : helperText !== undefined ? (
        <Text variant="caption" color="secondary">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
