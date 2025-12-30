/**
 * Select Component (V7.5.2)
 *
 * Dropdown select component for choosing from a list of options.
 * Uses a bottom sheet modal on mobile for better UX.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../styles/tokens';
import { VlossomChevronDownIcon, VlossomCheckIcon } from '../icons/VlossomIcons';

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface SelectProps<T = string> {
  /**
   * Available options
   */
  options: SelectOption<T>[];
  /**
   * Currently selected value
   */
  value?: T;
  /**
   * Called when selection changes
   */
  onChange: (value: T) => void;
  /**
   * Placeholder text when no value selected
   */
  placeholder?: string;
  /**
   * Label for the select field
   */
  label?: string;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Disable the select
   */
  disabled?: boolean;
  /**
   * Additional container styles
   */
  style?: ViewStyle;
  /**
   * Title for the picker modal
   */
  pickerTitle?: string;
  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;
  /**
   * Accessibility hint for screen readers
   */
  accessibilityHint?: string;
}

export function Select<T = string>({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  style,
  pickerTitle,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (option: SelectOption<T>) => {
    if (!option.disabled) {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  const renderOption = ({ item }: { item: SelectOption<T> }) => {
    const isSelected = item.value === value;

    return (
      <Pressable
        onPress={() => handleSelect(item)}
        disabled={item.disabled}
        style={({ pressed }) => [
          styles.option,
          isSelected && styles.optionSelected,
          item.disabled && styles.optionDisabled,
          pressed && !item.disabled && styles.optionPressed,
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected, disabled: item.disabled }}
      >
        <Text
          style={[
            styles.optionText,
            isSelected && styles.optionTextSelected,
            item.disabled && styles.optionTextDisabled,
          ]}
        >
          {item.label}
        </Text>
        {isSelected && <VlossomCheckIcon size={20} color={colors.primary} />}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        style={({ pressed }) => [
          styles.trigger,
          error && styles.triggerError,
          disabled && styles.triggerDisabled,
          pressed && !disabled && styles.triggerPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label || placeholder}
        accessibilityState={{ expanded: isOpen, disabled }}
      >
        <Text
          style={[styles.triggerText, !selectedOption && styles.triggerPlaceholder]}
          numberOfLines={1}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <VlossomChevronDownIcon
          size={20}
          color={disabled ? colors.text.disabled : colors.text.secondary}
        />
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}

      {/* Picker Modal */}
      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.sheet}>
                {pickerTitle && (
                  <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>{pickerTitle}</Text>
                    <Pressable
                      onPress={() => setIsOpen(false)}
                      style={styles.doneButton}
                      accessibilityRole="button"
                      accessibilityLabel="Done"
                    >
                      <Text style={styles.doneText}>Done</Text>
                    </Pressable>
                  </View>
                )}

                <FlatList
                  data={options}
                  renderItem={renderOption}
                  keyExtractor={(item, index) => `${item.value}-${index}`}
                  style={styles.list}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  triggerError: {
    borderColor: colors.status.error,
  },
  triggerDisabled: {
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.light,
  },
  triggerPressed: {
    borderColor: colors.primary,
  },
  triggerText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  triggerPlaceholder: {
    color: colors.text.tertiary,
  },
  error: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.sm,
    color: colors.status.error,
    marginTop: spacing.xs,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '60%',
    paddingBottom: spacing.xl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  sheetTitle: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.h4,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  doneButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  doneText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  list: {
    paddingHorizontal: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.xs / 2,
  },
  optionSelected: {
    backgroundColor: colors.primary + '10',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionPressed: {
    backgroundColor: colors.background.secondary,
  },
  optionText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
    flex: 1,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  optionTextDisabled: {
    color: colors.text.disabled,
  },
});

export default Select;
