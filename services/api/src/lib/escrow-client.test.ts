/**
 * Escrow Client Tests
 *
 * Tests for blockchain escrow operations including:
 * - Fund locking, releasing, and refunding
 * - Rate limiting integration
 * - Sentry error telemetry
 * - Hash conversion for booking IDs
 */

// Mock clients - MUST be defined before jest.mock() calls reference them
const mockPublicClient = {
  readContract: jest.fn(),
  waitForTransactionReceipt: jest.fn(),
};

const mockWalletClient = {
  writeContract: jest.fn(),
};

// Mock viem
jest.mock('viem', () => ({
  createPublicClient: jest.fn(() => mockPublicClient),
  createWalletClient: jest.fn(() => mockWalletClient),
  http: jest.fn(),
  fallback: jest.fn(() => 'mock-transport'),
  keccak256: jest.fn((bytes) => `0x${Buffer.from(bytes).toString('hex').padStart(64, '0')}`),
  toBytes: jest.fn((str) => Buffer.from(str)),
}));

jest.mock('viem/accounts', () => ({
  privateKeyToAccount: jest.fn(() => ({ address: '0xRelayerAddress' })),
}));

// Mock chain client
jest.mock('./wallet/chain-client', () => ({
  CHAIN: { id: 1337, name: 'hardhat' },
  RPC_URL: 'http://localhost:8545',
  publicClient: mockPublicClient,
  getRelayerWalletClient: jest.fn(() => mockWalletClient),
}));

// Mock rate limiter
jest.mock('./escrow-rate-limiter', () => ({
  escrowRateLimiter: {
    canProceed: jest.fn(() => ({ canProceed: true })),
    recordOperation: jest.fn(),
    reset: jest.fn(),
  },
}));

// Mock Sentry
jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
}));

import {
  lockFundsInEscrow,
  releaseFundsFromEscrow,
  refundFromEscrow,
  getEscrowBalance,
  getEscrowRecord,
  EscrowStatus,
  PLATFORM_TREASURY_ADDRESS,
  PLATFORM_FEE_PERCENTAGE,
} from './escrow-client';
import { escrowRateLimiter } from './escrow-rate-limiter';
import * as Sentry from '@sentry/node';

// Set required environment variables before tests
const originalEnv = process.env;

beforeAll(() => {
  process.env = {
    ...originalEnv,
    ESCROW_ADDRESS: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    USDC_ADDRESS: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    RELAYER_PRIVATE_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    TREASURY_ADDRESS: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    PLATFORM_FEE_PERCENTAGE: '10',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('Escrow Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (escrowRateLimiter.canProceed as jest.Mock).mockReturnValue({ canProceed: true });
  });

  describe('lockFundsInEscrow()', () => {
    it('should check for existing escrow before locking', async () => {
      mockPublicClient.readContract.mockResolvedValue([
        '0x0000000000000000000000000000000000000000',
        0n,
        EscrowStatus.None,
      ]);

      const result = await lockFundsInEscrow({
        bookingId: 'booking-123',
        customerAddress: '0xCustomerAddress' as `0x${string}`,
        amount: 100_000_000n,
      });

      expect(result.success).toBe(true);
      expect(mockPublicClient.readContract).toHaveBeenCalled();
    });

    it('should fail if escrow already exists for booking', async () => {
      mockPublicClient.readContract.mockResolvedValue([
        '0xCustomerAddress',
        100_000_000n,
        EscrowStatus.Locked,
      ]);

      const result = await lockFundsInEscrow({
        bookingId: 'booking-with-escrow',
        customerAddress: '0xCustomerAddress' as `0x${string}`,
        amount: 100_000_000n,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Escrow already exists');
    });

    it('should return success when escrow check fails (fail-open design)', async () => {
      // When we can't verify existing escrow state due to network error,
      // getEscrowRecord returns empty record (status: None) and we return success.
      // The blockchain contract will reject duplicate locks if they exist.
      // This is intentional "fail-open" design for better UX.
      mockPublicClient.readContract.mockRejectedValue(new Error('Network error'));

      const result = await lockFundsInEscrow({
        bookingId: 'booking-error',
        customerAddress: '0xCustomerAddress' as `0x${string}`,
        amount: 100_000_000n,
      });

      // Fail-open: return success even on network error during collision check
      expect(result.success).toBe(true);
    });
  });

  describe('releaseFundsFromEscrow()', () => {
    const releaseParams = {
      bookingId: 'booking-release-123',
      stylistAddress: '0xStylistAddress' as `0x${string}`,
      totalAmount: 1_000_000_000n, // $1000 USDC
      platformFeePercentage: 10,
      treasuryAddress: '0xTreasuryAddress' as `0x${string}`,
    };

    it('should successfully release 90% to stylist, 10% platform fee', async () => {
      mockPublicClient.readContract.mockResolvedValue([
        '0xCustomerAddress',
        1_000_000_000n,
        EscrowStatus.Locked,
      ]);
      mockWalletClient.writeContract.mockResolvedValue('0xTxHash123');
      mockPublicClient.waitForTransactionReceipt.mockResolvedValue({});

      const result = await releaseFundsFromEscrow(releaseParams);

      expect(result.success).toBe(true);
      expect(result.txHash).toBe('0xTxHash123');

      // Verify correct split calculation
      expect(mockWalletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'releaseFunds',
          args: expect.arrayContaining([
            expect.any(String), // bookingIdBytes
            '0xStylistAddress',
            900_000_000n, // 90% to stylist
            '0xTreasuryAddress',
            100_000_000n, // 10% platform fee
          ]),
        })
      );
    });

    it('should record operation with rate limiter on success', async () => {
      mockPublicClient.readContract.mockResolvedValue([
        '0xCustomerAddress',
        1_000_000_000n,
        EscrowStatus.Locked,
      ]);
      mockWalletClient.writeContract.mockResolvedValue('0xTxHash');
      mockPublicClient.waitForTransactionReceipt.mockResolvedValue({});

      await releaseFundsFromEscrow(releaseParams);

      expect(escrowRateLimiter.recordOperation).toHaveBeenCalledWith(
        'booking-release-123',
        1_000_000_000n,
        'release'
      );
    });

    it('should check rate limit before proceeding', async () => {
      (escrowRateLimiter.canProceed as jest.Mock).mockReturnValue({
        canProceed: false,
        reason: 'Rate limit exceeded',
      });

      const result = await releaseFundsFromEscrow(releaseParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
      expect(mockWalletClient.writeContract).not.toHaveBeenCalled();
    });

    it('should fail if escrow is not in Locked status', async () => {
      mockPublicClient.readContract.mockResolvedValue([
        '0xCustomerAddress',
        1_000_000_000n,
        EscrowStatus.Released, // Already released
      ]);

      const result = await releaseFundsFromEscrow(releaseParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not in Locked status');
    });

    it('should fail if amount does not match escrow', async () => {
      mockPublicClient.readContract.mockResolvedValue([
        '0xCustomerAddress',
        500_000_000n, // Different amount
        EscrowStatus.Locked,
      ]);

      const result = await releaseFundsFromEscrow(releaseParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Amount mismatch');
    });

    it('should report to Sentry on blockchain failure', async () => {
      mockPublicClient.readContract.mockResolvedValue([
        '0xCustomerAddress',
        1_000_000_000n,
        EscrowStatus.Locked,
      ]);
      mockWalletClient.writeContract.mockRejectedValue(new Error('Transaction reverted'));

      const result = await releaseFundsFromEscrow(releaseParams);

      expect(result.success).toBe(false);
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: {
            service: 'escrow',
            operation: 'release',
            critical: 'true',
          },
          extra: expect.objectContaining({
            bookingId: 'booking-release-123',
            stylistAddress: '0xStylistAddress',
            totalAmount: '1000000000',
          }),
        })
      );
    });

    it('should handle partial release scenarios correctly', async () => {
      // Test with odd amount that has remainder
      const oddAmount = 1_000_000_001n; // $1000.000001 - has remainder when divided
      mockPublicClient.readContract.mockResolvedValue([
        '0xCustomerAddress',
        oddAmount,
        EscrowStatus.Locked,
      ]);
      mockWalletClient.writeContract.mockResolvedValue('0xTxHash');
      mockPublicClient.waitForTransactionReceipt.mockResolvedValue({});

      await releaseFundsFromEscrow({
        ...releaseParams,
        totalAmount: oddAmount,
      });

      // Verify BigInt division handles correctly (no floating point errors)
      expect(mockWalletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          args: expect.arrayContaining([
            expect.any(String),
            '0xStylistAddress',
            900_000_001n, // stylistAmount = total - platformFee
            '0xTreasuryAddress',
            100_000_000n, // platformFee = floor(total * 10 / 100)
          ]),
        })
      );
    });
  });

  describe('refundFromEscrow()', () => {
    const refundParams = {
      bookingId: 'booking-refund-123',
      recipientAddress: '0xRecipientAddress' as `0x${string}`,
    };

    it('should refund full amount to customer', async () => {
      mockPublicClient.readContract.mockResolvedValue([
        '0xCustomerAddress',
        500_000_000n,
        EscrowStatus.Locked,
      ]);
      mockWalletClient.writeContract.mockResolvedValue('0xRefundTxHash');
      mockPublicClient.waitForTransactionReceipt.mockResolvedValue({});

      const result = await refundFromEscrow(refundParams);

      expect(result.success).toBe(true);
      expect(result.txHash).toBe('0xRefundTxHash');
      expect(mockWalletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'refund',
          args: expect.arrayContaining([
            expect.any(String), // bookingIdBytes
            500_000_000n, // full amount
            '0xRecipientAddress',
          ]),
        })
      );
    });

    it('should check rate limit for refunds', async () => {
      mockPublicClient.readContract.mockResolvedValue([
        '0xCustomerAddress',
        500_000_000n,
        EscrowStatus.Locked,
      ]);
      (escrowRateLimiter.canProceed as jest.Mock).mockReturnValue({
        canProceed: false,
        reason: 'Hourly limit exceeded',
      });

      const result = await refundFromEscrow(refundParams);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Hourly limit exceeded');
    });

    it('should fail if escrow is not in Locked status', async () => {
      mockPublicClient.readContract.mockResolvedValue([
        '0xCustomerAddress',
        500_000_000n,
        EscrowStatus.Refunded, // Already refunded
      ]);

      const result = await refundFromEscrow(refundParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not in Locked status');
    });

    it('should record refund operation for rate limiting', async () => {
      mockPublicClient.readContract.mockResolvedValue([
        '0xCustomerAddress',
        500_000_000n,
        EscrowStatus.Locked,
      ]);
      mockWalletClient.writeContract.mockResolvedValue('0xRefundTxHash');
      mockPublicClient.waitForTransactionReceipt.mockResolvedValue({});

      await refundFromEscrow(refundParams);

      expect(escrowRateLimiter.recordOperation).toHaveBeenCalledWith(
        'booking-refund-123',
        500_000_000n,
        'refund'
      );
    });

    it('should report to Sentry on refund failure', async () => {
      mockPublicClient.readContract.mockResolvedValue([
        '0xCustomerAddress',
        500_000_000n,
        EscrowStatus.Locked,
      ]);
      mockWalletClient.writeContract.mockRejectedValue(new Error('Refund failed'));

      await refundFromEscrow(refundParams);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: {
            service: 'escrow',
            operation: 'refund',
            critical: 'true',
          },
          extra: expect.objectContaining({
            bookingId: 'booking-refund-123',
            recipientAddress: '0xRecipientAddress',
          }),
        })
      );
    });
  });

  describe('getEscrowBalance()', () => {
    it('should return correct balance', async () => {
      mockPublicClient.readContract.mockResolvedValue(250_000_000n);

      const balance = await getEscrowBalance('booking-balance-123');

      expect(balance).toBe(250_000_000n);
    });

    it('should return 0 for non-existent bookings', async () => {
      mockPublicClient.readContract.mockRejectedValue(new Error('Not found'));

      const balance = await getEscrowBalance('non-existent-booking');

      expect(balance).toBe(0n);
    });
  });

  describe('getEscrowRecord()', () => {
    it('should return escrow record with correct structure', async () => {
      mockPublicClient.readContract.mockResolvedValue([
        '0xCustomerAddress',
        750_000_000n,
        EscrowStatus.Locked,
      ]);

      const record = await getEscrowRecord('booking-record-123');

      expect(record).toEqual({
        customer: '0xCustomerAddress',
        amount: 750_000_000n,
        status: EscrowStatus.Locked,
      });
    });

    it('should return empty record for non-existent bookings', async () => {
      mockPublicClient.readContract.mockRejectedValue(new Error('Not found'));

      const record = await getEscrowRecord('non-existent-booking');

      expect(record).toEqual({
        customer: '0x0000000000000000000000000000000000000000',
        amount: 0n,
        status: EscrowStatus.None,
      });
    });
  });

  describe('bookingIdToBytes32 (via function calls)', () => {
    it('should convert booking ID consistently', async () => {
      // Call getEscrowRecord twice with same ID
      mockPublicClient.readContract.mockResolvedValue([
        '0xCustomerAddress',
        100n,
        EscrowStatus.Locked,
      ]);

      await getEscrowRecord('same-booking-id');
      await getEscrowRecord('same-booking-id');

      const calls = mockPublicClient.readContract.mock.calls;
      expect(calls[0][0].args[0]).toBe(calls[1][0].args[0]);
    });

    it('should produce different hashes for different IDs', async () => {
      mockPublicClient.readContract.mockResolvedValue([
        '0xCustomerAddress',
        100n,
        EscrowStatus.Locked,
      ]);

      await getEscrowRecord('booking-1');
      await getEscrowRecord('booking-2');

      const calls = mockPublicClient.readContract.mock.calls;
      expect(calls[0][0].args[0]).not.toBe(calls[1][0].args[0]);
    });
  });

  describe('EscrowStatus Enum', () => {
    it('should have correct values', () => {
      expect(EscrowStatus.None).toBe(0);
      expect(EscrowStatus.Locked).toBe(1);
      expect(EscrowStatus.Released).toBe(2);
      expect(EscrowStatus.Refunded).toBe(3);
    });
  });

  describe('Constants', () => {
    it('should export PLATFORM_TREASURY_ADDRESS', () => {
      expect(PLATFORM_TREASURY_ADDRESS).toBeDefined();
      expect(PLATFORM_TREASURY_ADDRESS).toMatch(/^0x/);
    });

    it('should export PLATFORM_FEE_PERCENTAGE', () => {
      expect(PLATFORM_FEE_PERCENTAGE).toBeDefined();
      expect(typeof PLATFORM_FEE_PERCENTAGE).toBe('number');
      expect(PLATFORM_FEE_PERCENTAGE).toBeGreaterThanOrEqual(0);
      expect(PLATFORM_FEE_PERCENTAGE).toBeLessThanOrEqual(100);
    });
  });
});
