/**
 * Review Modal Component (V7.5.2 Mobile)
 *
 * Modal for leaving reviews after completed bookings.
 * Features star rating, text review, and submission to API.
 */

import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '../../styles/tokens';
import { VlossomCloseIcon, VlossomFavoriteIcon } from '../icons/VlossomIcons';

// =============================================================================
// Types
// =============================================================================

export interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  bookingId: string;
  stylistName: string;
  serviceName: string;
  onSuccess?: () => void;
}

// =============================================================================
// Star Rating Component
// =============================================================================

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
}

function StarRating({ rating, onRatingChange, size = 40 }: StarRatingProps) {
  return (
    <View style={starStyles.container}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => onRatingChange(star)}
          style={starStyles.star}
          accessibilityRole="button"
          accessibilityLabel={`Rate ${star} star${star > 1 ? 's' : ''}`}
          accessibilityState={{ selected: rating >= star }}
        >
          <VlossomFavoriteIcon
            size={size}
            color={rating >= star ? colors.accent : colors.border.default}
            focused={rating >= star}
          />
        </Pressable>
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  star: {
    padding: spacing.xs,
  },
});

// =============================================================================
// Review Modal Component
// =============================================================================

export function ReviewModal({
  visible,
  onClose,
  bookingId,
  stylistName,
  serviceName,
  onSuccess,
}: ReviewModalProps) {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setRating(0);
    setReviewText('');
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // await submitReview({ bookingId, rating, reviewText });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Success
      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to submit review. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [bookingId, rating, reviewText, onClose, onSuccess, resetForm]);

  const getRatingLabel = (r: number): string => {
    switch (r) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Great';
      case 5:
        return 'Excellent';
      default:
        return 'Tap to rate';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Leave a Review</Text>
            <Pressable
              onPress={handleClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close review modal"
            >
              <VlossomCloseIcon size={24} color={colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Service Info */}
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceLabel}>Your experience with</Text>
              <Text style={styles.stylistName}>{stylistName}</Text>
              <Text style={styles.serviceName}>{serviceName}</Text>
            </View>

            {/* Star Rating */}
            <View style={styles.ratingSection}>
              <StarRating rating={rating} onRatingChange={setRating} />
              <Text
                style={[
                  styles.ratingLabel,
                  rating > 0 && styles.ratingLabelActive,
                ]}
              >
                {getRatingLabel(rating)}
              </Text>
            </View>

            {/* Review Text */}
            <View style={styles.textSection}>
              <Text style={styles.textLabel}>
                Share your experience (optional)
              </Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={4}
                placeholder="What did you enjoy? Any feedback for the stylist?"
                placeholderTextColor={colors.text.tertiary}
                value={reviewText}
                onChangeText={setReviewText}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {reviewText.length}/500
              </Text>
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            style={[
              styles.submitButton,
              (isSubmitting || rating === 0) && styles.submitButtonDisabled,
            ]}
            disabled={isSubmitting || rating === 0}
            accessibilityRole="button"
            accessibilityLabel="Submit review"
            accessibilityState={{ disabled: isSubmitting || rating === 0 }}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Review</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.sm,
    marginRight: -spacing.sm,
  },
  serviceInfo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  serviceLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  stylistName: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  serviceName: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.body,
    color: colors.text.secondary,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
  },
  ratingLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.body,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
  ratingLabelActive: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  textSection: {
    marginBottom: spacing.lg,
  },
  textLabel: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.bodySmall,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  textInput: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  charCount: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.caption,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  errorContainer: {
    backgroundColor: colors.status.errorLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.bodySmall,
    color: colors.status.error,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  submitButtonDisabled: {
    backgroundColor: colors.primarySoft,
  },
  submitButtonText: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default ReviewModal;
