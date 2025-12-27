/**
 * Mock Data for Demo Mode (V7.0.0)
 *
 * 8 diverse mock stylists around Johannesburg
 * 12 mock services across categories
 * Sample bookings, notifications, transactions, wallet
 *
 * Used when demo mode is enabled to give testers a rich experience
 * without requiring real data on testnet.
 */

import type {
  StylistSummary,
  StylistDetail,
  StylistService,
  OperatingMode,
  ServiceCategory,
} from '../api/stylists';
import type { Booking, BookingStatus, LocationType } from '../api/bookings';
import type { Notification, NotificationType } from '../api/notifications';
import type { Transaction, WalletInfo } from '../api/wallet';

// ============================================================================
// Mock Stylists - 8 Diverse Johannesburg Stylists
// ============================================================================

const generateMockServices = (
  specialties: string[],
  priceRange: { min: number; max: number }
): StylistService[] => {
  const services: StylistService[] = [];
  const categories: ServiceCategory[] = ['Hair', 'Nails', 'Makeup', 'Lashes', 'Facials'];

  // Generate 2-4 services based on specialties
  specialties.forEach((specialty, index) => {
    const category = specialty.includes('Nail')
      ? 'Nails'
      : specialty.includes('Lash')
        ? 'Lashes'
        : specialty.includes('Makeup') || specialty.includes('Facial')
          ? specialty.includes('Facial')
            ? 'Facials'
            : 'Makeup'
          : 'Hair';

    const basePrice = priceRange.min + Math.floor((priceRange.max - priceRange.min) * (index / specialties.length));

    services.push({
      id: `mock-service-${index}-${Date.now()}`,
      name: specialty,
      category,
      description: `Professional ${specialty.toLowerCase()} service`,
      priceAmountCents: basePrice.toString(),
      estimatedDurationMin: 60 + index * 30,
    });
  });

  return services;
};

export const MOCK_STYLISTS: StylistSummary[] = [
  // Mobile stylists - come to you
  {
    id: 'mock-stylist-1',
    userId: 'mock-user-1',
    displayName: 'Thandi M.',
    avatarUrl: null,
    verificationStatus: 'VERIFIED',
    bio: 'Braid specialist with 8 years experience. I come to you!',
    specialties: ['Box Braids', 'Knotless Braids', 'Locs'],
    operatingMode: 'MOBILE',
    baseLocation: {
      lat: -26.2041,
      lng: 28.0473,
      address: 'Johannesburg CBD',
    },
    serviceRadius: 30,
    distance: 2.5,
    services: generateMockServices(['Box Braids', 'Knotless Braids', 'Loc Retwist'], { min: 25000, max: 45000 }),
    priceRange: { min: 25000, max: 45000 },
  },
  {
    id: 'mock-stylist-2',
    userId: 'mock-user-2',
    displayName: 'Nomvula S.',
    avatarUrl: null,
    verificationStatus: 'VERIFIED',
    bio: 'Natural hair care expert. Deep conditioning & treatments.',
    specialties: ['Natural Hair', 'Treatments', 'Deep Conditioning'],
    operatingMode: 'MOBILE',
    baseLocation: {
      lat: -26.1929,
      lng: 28.0305,
      address: 'Braamfontein',
    },
    serviceRadius: 25,
    distance: 3.8,
    services: generateMockServices(['Natural Hair Styling', 'Deep Conditioning', 'Scalp Treatment'], { min: 15000, max: 35000 }),
    priceRange: { min: 15000, max: 35000 },
  },
  {
    id: 'mock-stylist-7',
    userId: 'mock-user-7',
    displayName: 'Precious M.',
    avatarUrl: null,
    verificationStatus: 'VERIFIED',
    bio: 'Kids hair specialist. Gentle styling for little ones.',
    specialties: ['Kids Hair', 'Protective Styles', 'Cornrows'],
    operatingMode: 'MOBILE',
    baseLocation: {
      lat: -26.2156,
      lng: 28.0612,
      address: 'Maboneng',
    },
    serviceRadius: 20,
    distance: 4.2,
    services: generateMockServices(['Kids Braids', 'Cornrows', 'Protective Style'], { min: 15000, max: 30000 }),
    priceRange: { min: 15000, max: 30000 },
  },

  // Fixed/Salon stylists
  {
    id: 'mock-stylist-3',
    userId: 'mock-user-3',
    displayName: 'Zinhle K.',
    avatarUrl: null,
    verificationStatus: 'VERIFIED',
    bio: 'Color specialist at Rosebank salon. Transform your look!',
    specialties: ['Silk Press', 'Color', 'Highlights'],
    operatingMode: 'FIXED',
    baseLocation: {
      lat: -26.1076,
      lng: 28.0567,
      address: 'The Zone @ Rosebank',
    },
    serviceRadius: null,
    distance: 5.1,
    services: generateMockServices(['Silk Press', 'Full Color', 'Highlights'], { min: 20000, max: 60000 }),
    priceRange: { min: 20000, max: 60000 },
  },
  {
    id: 'mock-stylist-4',
    userId: 'mock-user-4',
    displayName: 'Lindiwe P.',
    avatarUrl: null,
    verificationStatus: 'VERIFIED',
    bio: 'Weave & wig installation expert. Sandton studio.',
    specialties: ['Weaves', 'Wigs', 'Frontal Install'],
    operatingMode: 'FIXED',
    baseLocation: {
      lat: -26.1496,
      lng: 28.0098,
      address: 'Sandton City',
    },
    serviceRadius: null,
    distance: 7.3,
    services: generateMockServices(['Full Weave Install', 'Wig Install', 'Frontal Install'], { min: 30000, max: 80000 }),
    priceRange: { min: 30000, max: 80000 },
  },
  {
    id: 'mock-stylist-8',
    userId: 'mock-user-8',
    displayName: 'Sibongile T.',
    avatarUrl: null,
    verificationStatus: 'VERIFIED',
    bio: 'Barber specializing in fades and beard grooming.',
    specialties: ['Barber', 'Beard Care', 'Fades'],
    operatingMode: 'FIXED',
    baseLocation: {
      lat: -26.1789,
      lng: 28.0156,
      address: 'Melrose Arch',
    },
    serviceRadius: null,
    distance: 6.0,
    services: generateMockServices(['Fade Haircut', 'Beard Trim', 'Full Grooming'], { min: 10000, max: 25000 }),
    priceRange: { min: 10000, max: 25000 },
  },

  // Hybrid stylists - salon and mobile
  {
    id: 'mock-stylist-5',
    userId: 'mock-user-5',
    displayName: 'Ayanda N.',
    avatarUrl: null,
    verificationStatus: 'VERIFIED',
    bio: 'Nails & lashes artist. Studio in Fourways or I come to you.',
    specialties: ['Nails', 'Lashes', 'Gel Manicure'],
    operatingMode: 'HYBRID',
    baseLocation: {
      lat: -26.2023,
      lng: 28.0436,
      address: 'Fourways',
    },
    serviceRadius: 15,
    distance: 3.2,
    services: generateMockServices(['Gel Manicure', 'Full Set Acrylics', 'Lash Extensions'], { min: 15000, max: 25000 }),
    priceRange: { min: 15000, max: 25000 },
  },
  {
    id: 'mock-stylist-6',
    userId: 'mock-user-6',
    displayName: 'Busisiwe D.',
    avatarUrl: null,
    verificationStatus: 'VERIFIED',
    bio: 'Makeup artist & aesthetician. Bridal specialist.',
    specialties: ['Makeup', 'Facials', 'Bridal'],
    operatingMode: 'HYBRID',
    baseLocation: {
      lat: -26.1852,
      lng: 28.0246,
      address: 'Parkhurst',
    },
    serviceRadius: 20,
    distance: 4.7,
    services: generateMockServices(['Bridal Makeup', 'Facial Treatment', 'Everyday Glam'], { min: 20000, max: 50000 }),
    priceRange: { min: 20000, max: 50000 },
  },
];

// ============================================================================
// Mock Stylist Details - Extended info for detail pages
// ============================================================================

export function getMockStylistDetail(id: string): StylistDetail | null {
  const summary = MOCK_STYLISTS.find((s) => s.id === id);
  if (!summary) return null;

  return {
    ...summary,
    memberSince: '2023-06-15',
    serviceCategories: summary.specialties.map((s) =>
      s.includes('Nail') ? 'Nails' : s.includes('Lash') ? 'Lashes' : 'Hair'
    ),
    portfolioImages: [
      // Placeholder portfolio images - would be real URLs in production
    ],
    isAcceptingBookings: true,
  };
}

// ============================================================================
// Mock Services - 12 Popular Services
// ============================================================================

export const MOCK_SERVICES: StylistService[] = [
  { id: 'svc-1', name: 'Box Braids', category: 'Hair', description: 'Classic box braids, medium size', priceAmountCents: '35000', estimatedDurationMin: 180 },
  { id: 'svc-2', name: 'Knotless Braids', category: 'Hair', description: 'Knotless braids for less tension', priceAmountCents: '45000', estimatedDurationMin: 240 },
  { id: 'svc-3', name: 'Silk Press', category: 'Hair', description: 'Sleek silk press with heat protection', priceAmountCents: '25000', estimatedDurationMin: 90 },
  { id: 'svc-4', name: 'Loc Retwist', category: 'Hair', description: 'Maintenance retwist for locs', priceAmountCents: '20000', estimatedDurationMin: 120 },
  { id: 'svc-5', name: 'Full Weave Install', category: 'Hair', description: 'Full sew-in weave installation', priceAmountCents: '60000', estimatedDurationMin: 180 },
  { id: 'svc-6', name: 'Wig Install', category: 'Hair', description: 'Lace front wig installation', priceAmountCents: '35000', estimatedDurationMin: 60 },
  { id: 'svc-7', name: 'Gel Manicure', category: 'Nails', description: 'Gel polish manicure', priceAmountCents: '15000', estimatedDurationMin: 60 },
  { id: 'svc-8', name: 'Full Set Acrylics', category: 'Nails', description: 'Full acrylic nail set with design', priceAmountCents: '25000', estimatedDurationMin: 90 },
  { id: 'svc-9', name: 'Lash Extensions', category: 'Lashes', description: 'Classic lash extensions', priceAmountCents: '20000', estimatedDurationMin: 90 },
  { id: 'svc-10', name: 'Bridal Makeup', category: 'Makeup', description: 'Full bridal makeup with trial', priceAmountCents: '50000', estimatedDurationMin: 120 },
  { id: 'svc-11', name: 'Deep Conditioning', category: 'Hair', description: 'Deep conditioning treatment', priceAmountCents: '15000', estimatedDurationMin: 45 },
  { id: 'svc-12', name: 'Facial Treatment', category: 'Facials', description: 'Hydrating facial treatment', priceAmountCents: '30000', estimatedDurationMin: 60 },
];

// ============================================================================
// Mock Bookings - Various States for Demo
// ============================================================================

const now = new Date();
const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);
const yesterday = new Date(now);
yesterday.setDate(yesterday.getDate() - 1);
const lastWeek = new Date(now);
lastWeek.setDate(lastWeek.getDate() - 7);

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'mock-booking-1',
    status: 'CONFIRMED',
    stylist: {
      id: 'mock-stylist-1',
      displayName: 'Thandi M.',
      avatarUrl: null,
      verificationStatus: 'VERIFIED',
    },
    service: {
      id: 'svc-1',
      name: 'Box Braids',
      priceAmountCents: '35000',
      estimatedDurationMin: 180,
    },
    scheduledStartTime: tomorrow.toISOString(),
    locationType: 'CUSTOMER_HOME',
    locationAddress: '123 Main Street, Johannesburg',
    locationLat: -26.2041,
    locationLng: 28.0473,
    notes: 'Medium length, black color',
    totalAmountCents: '38500',
    platformFeeCents: '3500',
    escrowTxHash: '0x1234567890abcdef',
    createdAt: now.toISOString(),
    cancelledAt: null,
    completedAt: null,
  },
  {
    id: 'mock-booking-2',
    status: 'PENDING_PAYMENT',
    stylist: {
      id: 'mock-stylist-5',
      displayName: 'Ayanda N.',
      avatarUrl: null,
      verificationStatus: 'VERIFIED',
    },
    service: {
      id: 'svc-7',
      name: 'Gel Manicure',
      priceAmountCents: '15000',
      estimatedDurationMin: 60,
    },
    scheduledStartTime: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000).toISOString(),
    locationType: 'STYLIST_BASE',
    locationAddress: 'Fourways Mall, Johannesburg',
    locationLat: -26.2023,
    locationLng: 28.0436,
    notes: null,
    totalAmountCents: '16500',
    platformFeeCents: '1500',
    escrowTxHash: null,
    createdAt: now.toISOString(),
    cancelledAt: null,
    completedAt: null,
  },
  {
    id: 'mock-booking-3',
    status: 'COMPLETED',
    stylist: {
      id: 'mock-stylist-3',
      displayName: 'Zinhle K.',
      avatarUrl: null,
      verificationStatus: 'VERIFIED',
    },
    service: {
      id: 'svc-3',
      name: 'Silk Press',
      priceAmountCents: '25000',
      estimatedDurationMin: 90,
    },
    scheduledStartTime: lastWeek.toISOString(),
    locationType: 'STYLIST_BASE',
    locationAddress: 'The Zone @ Rosebank',
    locationLat: -26.1076,
    locationLng: 28.0567,
    notes: 'Heat protectant provided',
    totalAmountCents: '27500',
    platformFeeCents: '2500',
    escrowTxHash: '0xabcdef1234567890',
    createdAt: new Date(lastWeek.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    cancelledAt: null,
    completedAt: lastWeek.toISOString(),
  },
  {
    id: 'mock-booking-4',
    status: 'CANCELLED',
    stylist: {
      id: 'mock-stylist-2',
      displayName: 'Nomvula S.',
      avatarUrl: null,
      verificationStatus: 'VERIFIED',
    },
    service: {
      id: 'svc-11',
      name: 'Deep Conditioning',
      priceAmountCents: '15000',
      estimatedDurationMin: 45,
    },
    scheduledStartTime: yesterday.toISOString(),
    locationType: 'CUSTOMER_HOME',
    locationAddress: '456 Oak Avenue, Sandton',
    locationLat: -26.1496,
    locationLng: 28.0098,
    notes: null,
    totalAmountCents: '16500',
    platformFeeCents: '1500',
    escrowTxHash: null,
    createdAt: new Date(yesterday.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    cancelledAt: yesterday.toISOString(),
    completedAt: null,
  },
  {
    id: 'mock-booking-5',
    status: 'COMPLETED',
    stylist: {
      id: 'mock-stylist-6',
      displayName: 'Busisiwe D.',
      avatarUrl: null,
      verificationStatus: 'VERIFIED',
    },
    service: {
      id: 'svc-12',
      name: 'Facial Treatment',
      priceAmountCents: '30000',
      estimatedDurationMin: 60,
    },
    scheduledStartTime: new Date(lastWeek.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    locationType: 'STYLIST_BASE',
    locationAddress: 'Parkhurst Beauty Studio',
    locationLat: -26.1852,
    locationLng: 28.0246,
    notes: 'Sensitive skin products requested',
    totalAmountCents: '33000',
    platformFeeCents: '3000',
    escrowTxHash: '0x9876543210fedcba',
    createdAt: new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    cancelledAt: null,
    completedAt: new Date(lastWeek.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================================================
// Mock Notifications - All Types for Demo
// ============================================================================

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'mock-notif-1',
    type: 'BOOKING_APPROVED',
    title: 'Booking Confirmed!',
    body: 'Thandi M. confirmed your Box Braids appointment for tomorrow at 10:00 AM',
    metadata: {
      bookingId: 'mock-booking-1',
      stylistName: 'Thandi M.',
      serviceType: 'Box Braids',
      scheduledTime: tomorrow.toISOString(),
    },
    read: false,
    createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 mins ago
  },
  {
    id: 'mock-notif-2',
    type: 'PAYMENT_CONFIRMED',
    title: 'Payment Received',
    body: 'Your payment of R385 for Box Braids has been secured in escrow',
    metadata: {
      bookingId: 'mock-booking-1',
      amount: 38500,
    },
    read: false,
    createdAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(), // 45 mins ago
  },
  {
    id: 'mock-notif-3',
    type: 'BOOKING_REMINDER',
    title: 'Appointment Tomorrow',
    body: 'Reminder: Your Box Braids appointment with Thandi M. is tomorrow at 10:00 AM',
    metadata: {
      bookingId: 'mock-booking-1',
      stylistName: 'Thandi M.',
      scheduledTime: tomorrow.toISOString(),
    },
    read: true,
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: 'mock-notif-4',
    type: 'SERVICE_COMPLETED',
    title: 'Service Completed',
    body: 'Your Silk Press with Zinhle K. is complete. Leave a review!',
    metadata: {
      bookingId: 'mock-booking-3',
      stylistName: 'Zinhle K.',
      serviceType: 'Silk Press',
    },
    read: true,
    createdAt: lastWeek.toISOString(),
  },
  {
    id: 'mock-notif-5',
    type: 'MESSAGE_RECEIVED',
    title: 'New Message',
    body: 'Thandi M.: Looking forward to seeing you tomorrow!',
    metadata: {
      conversationId: 'mock-conv-1',
      senderName: 'Thandi M.',
      messagePreview: 'Looking forward to seeing you tomorrow!',
    },
    read: false,
    createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
  },
  {
    id: 'mock-notif-6',
    type: 'BOOKING_CANCELLED',
    title: 'Booking Cancelled',
    body: 'Your Deep Conditioning appointment with Nomvula S. was cancelled. Full refund issued.',
    metadata: {
      bookingId: 'mock-booking-4',
      stylistName: 'Nomvula S.',
      refundAmount: 16500,
      cancellationReason: 'Customer requested',
    },
    read: true,
    createdAt: yesterday.toISOString(),
  },
  {
    id: 'mock-notif-7',
    type: 'BOOKING_CREATED',
    title: 'Booking Request Sent',
    body: 'Your request for Gel Manicure with Ayanda N. has been sent',
    metadata: {
      bookingId: 'mock-booking-2',
      stylistName: 'Ayanda N.',
      serviceType: 'Gel Manicure',
    },
    read: true,
    createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
  },
  {
    id: 'mock-notif-8',
    type: 'SERVICE_COMPLETED',
    title: 'Service Completed',
    body: 'Your Facial Treatment with Busisiwe D. is complete. How was your experience?',
    metadata: {
      bookingId: 'mock-booking-5',
      stylistName: 'Busisiwe D.',
      serviceType: 'Facial Treatment',
    },
    read: true,
    createdAt: new Date(lastWeek.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================================================
// Mock Wallet - Default Testnet Balance
// ============================================================================

export const MOCK_WALLET: WalletInfo = {
  id: 'mock-wallet-1',
  address: '0x742d35Cc6634C0532925a3b844Bc9e7595f01234',
  chainId: 84532, // Base Sepolia
  isDeployed: true,
  balance: {
    usdc: '100.00',
    usdcFormatted: '$100.00',
    fiatValue: 1850, // ~R1,850 at typical exchange rate
  },
};

// ============================================================================
// Mock Transactions - Wallet History
// ============================================================================

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'mock-tx-1',
    type: 'DEPOSIT',
    amount: '100.00',
    amountFormatted: '$100.00',
    token: 'USDC',
    counterparty: null,
    txHash: '0x1111111111111111111111111111111111111111111111111111111111111111',
    status: 'CONFIRMED',
    memo: 'Initial deposit from faucet',
    createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    confirmedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-tx-2',
    type: 'PAYMENT',
    amount: '38.50',
    amountFormatted: '$38.50',
    token: 'USDC',
    counterparty: 'Thandi M.',
    txHash: '0x2222222222222222222222222222222222222222222222222222222222222222',
    status: 'PENDING',
    memo: 'Box Braids - Escrow',
    createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
    confirmedAt: null,
  },
  {
    id: 'mock-tx-3',
    type: 'PAYMENT',
    amount: '27.50',
    amountFormatted: '$27.50',
    token: 'USDC',
    counterparty: 'Zinhle K.',
    txHash: '0x3333333333333333333333333333333333333333333333333333333333333333',
    status: 'CONFIRMED',
    memo: 'Silk Press - Completed',
    createdAt: lastWeek.toISOString(),
    confirmedAt: lastWeek.toISOString(),
  },
  {
    id: 'mock-tx-4',
    type: 'REFUND',
    amount: '16.50',
    amountFormatted: '$16.50',
    token: 'USDC',
    counterparty: 'Nomvula S.',
    txHash: '0x4444444444444444444444444444444444444444444444444444444444444444',
    status: 'CONFIRMED',
    memo: 'Deep Conditioning - Cancelled refund',
    createdAt: yesterday.toISOString(),
    confirmedAt: yesterday.toISOString(),
  },
  {
    id: 'mock-tx-5',
    type: 'PAYMENT',
    amount: '33.00',
    amountFormatted: '$33.00',
    token: 'USDC',
    counterparty: 'Busisiwe D.',
    txHash: '0x5555555555555555555555555555555555555555555555555555555555555555',
    status: 'CONFIRMED',
    memo: 'Facial Treatment - Completed',
    createdAt: new Date(lastWeek.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    confirmedAt: new Date(lastWeek.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================================================
// Mock Availability Slots - For Booking Flow
// ============================================================================

export const MOCK_AVAILABILITY_SLOTS = [
  { startTime: '09:00', endTime: '10:00', available: true },
  { startTime: '10:00', endTime: '11:00', available: true },
  { startTime: '11:00', endTime: '12:00', available: false },
  { startTime: '12:00', endTime: '13:00', available: true },
  { startTime: '13:00', endTime: '14:00', available: true },
  { startTime: '14:00', endTime: '15:00', available: true },
  { startTime: '15:00', endTime: '16:00', available: false },
  { startTime: '16:00', endTime: '17:00', available: true },
  { startTime: '17:00', endTime: '18:00', available: true },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a mock booking by ID
 */
export function getMockBooking(id: string): Booking | null {
  return MOCK_BOOKINGS.find((b) => b.id === id) || null;
}

/**
 * Get upcoming bookings (confirmed, future date)
 */
export function getUpcomingMockBookings(): Booking[] {
  const now = new Date();
  return MOCK_BOOKINGS.filter(
    (b) =>
      (b.status === 'CONFIRMED' || b.status === 'PENDING_PAYMENT') &&
      new Date(b.scheduledStartTime) > now
  ).sort(
    (a, b) =>
      new Date(a.scheduledStartTime).getTime() - new Date(b.scheduledStartTime).getTime()
  );
}

/**
 * Get past bookings (completed or cancelled)
 */
export function getPastMockBookings(): Booking[] {
  return MOCK_BOOKINGS.filter(
    (b) => b.status === 'COMPLETED' || b.status === 'CANCELLED'
  ).sort(
    (a, b) =>
      new Date(b.scheduledStartTime).getTime() - new Date(a.scheduledStartTime).getTime()
  );
}

/**
 * Get unread notification count
 */
export function getUnreadMockNotificationCount(): number {
  return MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
}

/**
 * Calculate mock wallet available balance (after pending payments)
 */
export function getAvailableMockBalance(): number {
  const pendingPayments = MOCK_TRANSACTIONS.filter(
    (t) => t.type === 'PAYMENT' && t.status === 'PENDING'
  ).reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return parseFloat(MOCK_WALLET.balance.usdc) - pendingPayments;
}
