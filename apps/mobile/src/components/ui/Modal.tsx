/**
 * Modal Component (V7.5.2)
 *
 * Reusable modal/dialog component for overlays.
 * Uses React Native Modal with Vlossom design tokens.
 */

import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../../styles/tokens';
import { VlossomCloseIcon } from '../icons/VlossomIcons';
import { useUnfoldMotion } from '../../hooks/useMotion';

export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

export interface ModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;
  /**
   * Called when the modal is dismissed
   */
  onClose: () => void;
  /**
   * Modal title (optional)
   */
  title?: string;
  /**
   * Modal content
   */
  children: React.ReactNode;
  /**
   * Size variant
   */
  size?: ModalSize;
  /**
   * Show close button in header
   */
  showCloseButton?: boolean;
  /**
   * Close when tapping backdrop
   */
  closeOnBackdrop?: boolean;
  /**
   * Additional styles for the modal container
   */
  style?: ViewStyle;
  /**
   * Additional styles for the content area
   */
  contentStyle?: ViewStyle;
  /**
   * Footer content (buttons, etc.)
   */
  footer?: React.ReactNode;
  /**
   * Accessibility label for screen readers
   */
  accessibilityLabel?: string;
}

const sizeStyles: Record<ModalSize, { maxWidth: number | `${number}%`; maxHeight: `${number}%` }> = {
  sm: { maxWidth: 320, maxHeight: '50%' },
  md: { maxWidth: 400, maxHeight: '70%' },
  lg: { maxWidth: 500, maxHeight: '85%' },
  full: { maxWidth: '100%' as `${number}%`, maxHeight: '100%' },
};

export function Modal({
  visible,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  style,
  contentStyle,
  footer,
}: ModalProps) {
  const { style: unfoldStyle } = useUnfoldMotion({ autoPlay: visible });
  const sizeConfig = sizeStyles[size];

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <Animated.View
              style={[
                styles.container,
                {
                  maxWidth: sizeConfig.maxWidth,
                  maxHeight: sizeConfig.maxHeight,
                },
                unfoldStyle,
                style,
              ]}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <View style={styles.header}>
                  {title && (
                    <Text style={styles.title} accessibilityRole="header">
                      {title}
                    </Text>
                  )}
                  {showCloseButton && (
                    <Pressable
                      onPress={onClose}
                      style={styles.closeButton}
                      accessibilityRole="button"
                      accessibilityLabel="Close modal"
                    >
                      <VlossomCloseIcon size={20} color={colors.text.secondary} />
                    </Pressable>
                  )}
                </View>
              )}

              {/* Content */}
              <View style={[styles.content, contentStyle]}>{children}</View>

              {/* Footer */}
              {footer && <View style={styles.footer}>{footer}</View>}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    width: '100%',
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  content: {
    padding: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    gap: spacing.sm,
  },
});

export default Modal;
