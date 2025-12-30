/**
 * Social Media Icons (V7.5.2 Mobile)
 *
 * Phosphor Icons for social media and sharing features.
 * These complement the botanical VlossomIcons for brand-specific UI.
 */

import React from 'react';
import {
  XLogo,
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
  WhatsappLogo,
  TiktokLogo,
  YoutubeLogo,
  ShareNetwork,
  Copy,
  Link,
} from 'phosphor-react-native';
import { colors } from '../../styles/tokens';

// =============================================================================
// Types
// =============================================================================

export interface SocialIconProps {
  size?: number;
  color?: string;
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
}

// =============================================================================
// Social Platform Icons
// =============================================================================

export function TwitterIcon({
  size = 24,
  color = colors.primary,
  weight = 'regular',
}: SocialIconProps) {
  return <XLogo size={size} color={color} weight={weight} />;
}

export function XIcon({
  size = 24,
  color = colors.primary,
  weight = 'regular',
}: SocialIconProps) {
  return <XLogo size={size} color={color} weight={weight} />;
}

export function FacebookIcon({
  size = 24,
  color = colors.primary,
  weight = 'regular',
}: SocialIconProps) {
  return <FacebookLogo size={size} color={color} weight={weight} />;
}

export function InstagramIcon({
  size = 24,
  color = colors.primary,
  weight = 'regular',
}: SocialIconProps) {
  return <InstagramLogo size={size} color={color} weight={weight} />;
}

export function LinkedInIcon({
  size = 24,
  color = colors.primary,
  weight = 'regular',
}: SocialIconProps) {
  return <LinkedinLogo size={size} color={color} weight={weight} />;
}

export function WhatsAppIcon({
  size = 24,
  color = colors.primary,
  weight = 'regular',
}: SocialIconProps) {
  return <WhatsappLogo size={size} color={color} weight={weight} />;
}

export function TikTokIcon({
  size = 24,
  color = colors.primary,
  weight = 'regular',
}: SocialIconProps) {
  return <TiktokLogo size={size} color={color} weight={weight} />;
}

export function YouTubeIcon({
  size = 24,
  color = colors.primary,
  weight = 'regular',
}: SocialIconProps) {
  return <YoutubeLogo size={size} color={color} weight={weight} />;
}

// =============================================================================
// Sharing Utility Icons
// =============================================================================

export function ShareIcon({
  size = 24,
  color = colors.primary,
  weight = 'regular',
}: SocialIconProps) {
  return <ShareNetwork size={size} color={color} weight={weight} />;
}

export function CopyIcon({
  size = 24,
  color = colors.primary,
  weight = 'regular',
}: SocialIconProps) {
  return <Copy size={size} color={color} weight={weight} />;
}

export function LinkIcon({
  size = 24,
  color = colors.primary,
  weight = 'regular',
}: SocialIconProps) {
  return <Link size={size} color={color} weight={weight} />;
}

// =============================================================================
// Brand Colors (for use with weight="fill")
// =============================================================================

export const SocialColors = {
  twitter: '#1DA1F2',
  x: '#000000',
  facebook: '#1877F2',
  instagram: '#E4405F',
  linkedin: '#0A66C2',
  whatsapp: '#25D366',
  tiktok: '#000000',
  youtube: '#FF0000',
} as const;

// =============================================================================
// Icon Map (for dynamic rendering)
// =============================================================================

export const SocialIconMap = {
  twitter: TwitterIcon,
  x: XIcon,
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
  whatsapp: WhatsAppIcon,
  tiktok: TikTokIcon,
  youtube: YouTubeIcon,
  share: ShareIcon,
  copy: CopyIcon,
  link: LinkIcon,
} as const;

export type SocialIconName = keyof typeof SocialIconMap;

/**
 * Dynamic Social Icon component
 * Usage: <SocialIcon name="twitter" size={24} color="#1DA1F2" weight="fill" />
 */
export function SocialIcon({
  name,
  ...props
}: SocialIconProps & { name: SocialIconName }) {
  const IconComponent = SocialIconMap[name];
  return <IconComponent {...props} />;
}
