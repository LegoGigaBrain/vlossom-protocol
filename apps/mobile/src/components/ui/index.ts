/**
 * UI Components Index (V7.0.0)
 *
 * Centralized exports for shared UI components.
 */

// EmptyState
export {
  EmptyState,
  emptyStatePresets,
  getEmptyStateProps,
  type EmptyStateProps,
  type EmptyStatePreset,
  type EmptyStateAction,
  type EmptyStateSize,
  type IllustrationType,
} from './EmptyState';

// Illustrations
export {
  CalendarIllustration,
  SearchIllustration,
  WalletIllustration,
  ScissorsIllustration,
  InboxIllustration,
  ReviewsIllustration,
  MessageIllustration,
  PropertyIllustration,
  CompletedIllustration,
} from './illustrations';

// Skeleton Components
export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonListItem,
  SkeletonButton,
  StylistCardSkeleton,
  BookingCardSkeleton,
  TransactionSkeleton,
} from './Skeleton';

// Review Modal
export { ReviewModal, type ReviewModalProps } from './ReviewModal';

// Form Components
export { TextInput, type TextInputProps } from './TextInput';
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './Button';

// Card Components
export { Card, CardHeader, CardFooter, type CardProps, type CardHeaderProps, type CardFooterProps } from './Card';

// Badge Component
export { Badge, type BadgeProps, type BadgeVariant, type BadgeSize } from './Badge';

// Avatar Component
export { Avatar, type AvatarProps, type AvatarSize } from './Avatar';

// Modal Component
export { Modal, type ModalProps, type ModalSize } from './Modal';

// Select Component
export { Select, type SelectProps, type SelectOption } from './Select';

// TPSBreakdown Component
export { TPSBreakdown, type TPSBreakdownProps, type TPSScore, type ReputationScoreData } from './TPSBreakdown';
