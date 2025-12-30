/**
 * TextInput Component (V7.5.2 Mobile)
 *
 * Styled text input component with label, error state, and icon support.
 */

import React from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  Pressable,
  type TextInputProps as RNTextInputProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../styles/tokens';

export interface TextInputProps extends RNTextInputProps {
  /** Label text displayed above the input */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Left icon component */
  leftIcon?: React.ReactNode;
  /** Right icon component */
  rightIcon?: React.ReactNode;
  /** Callback when right icon is pressed */
  onRightIconPress?: () => void;
  /** Container style */
  containerStyle?: ViewStyle;
  /** Input style overrides */
  inputStyle?: TextStyle;
  /** Disabled state */
  disabled?: boolean;
  /** Required field indicator */
  required?: boolean;
}

export function TextInput({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  disabled = false,
  required = false,
  style,
  ...props
}: TextInputProps) {
  const hasError = !!error;

  const inputContainerStyle: ViewStyle = {
    ...styles.inputContainer,
    borderColor: hasError ? colors.status.error : colors.border.default,
    backgroundColor: disabled ? colors.background.secondary : colors.background.primary,
    opacity: disabled ? 0.6 : 1,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <View style={inputContainerStyle}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <RNTextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : undefined,
            rightIcon ? styles.inputWithRightIcon : undefined,
            inputStyle,
            style,
          ]}
          placeholderTextColor={colors.text.tertiary}
          editable={!disabled}
          {...props}
        />

        {rightIcon && (
          <Pressable
            onPress={onRightIconPress}
            style={styles.rightIcon}
            disabled={!onRightIconPress}
            accessibilityRole={onRightIconPress ? 'button' : undefined}
          >
            {rightIcon}
          </Pressable>
        )}
      </View>

      {(error || helperText) && (
        <Text style={[styles.helperText, hasError && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.bodySmall,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.status.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  leftIcon: {
    paddingLeft: spacing.md,
  },
  rightIcon: {
    paddingRight: spacing.md,
  },
  helperText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  errorText: {
    color: colors.status.error,
  },
});

export default TextInput;
