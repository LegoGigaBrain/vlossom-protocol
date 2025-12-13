// User and Actor Types
// Reference: docs/vlossom/02-platform-actors-and-feature-map.md

/**
 * Platform actor roles
 * A user can have multiple roles simultaneously (role fluidity)
 */
export type ActorRole = "customer" | "stylist" | "property_owner" | "admin";

/**
 * User verification status
 */
export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "suspended";

/**
 * Base user type
 */
export interface User {
  id: string;
  walletAddress: string;
  email?: string;
  phone?: string;
  displayName: string;
  avatarUrl?: string;
  roles: ActorRole[];
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Stylist-specific profile data
 */
export interface StylistProfile {
  userId: string;
  bio?: string;
  specialties: string[];
  serviceCategories: string[];
  portfolioImages: string[];
  operatingMode: "mobile" | "fixed" | "hybrid";
  serviceRadius?: number; // km for mobile stylists
  baseLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  isAcceptingBookings: boolean;
}

/**
 * Property owner profile data
 */
export interface PropertyOwnerProfile {
  userId: string;
  businessName?: string;
  verifiedBusiness: boolean;
}
