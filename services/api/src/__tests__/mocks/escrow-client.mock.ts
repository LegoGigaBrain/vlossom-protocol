/**
 * Mock Escrow Client
 *
 * Mocks blockchain escrow operations for integration testing.
 */

export const mockEscrowClient = {
  createEscrow: jest.fn().mockResolvedValue({
    success: true,
    escrowId: 'mock-escrow-id',
    txHash: '0xmocktxhash123',
  }),

  releaseEscrow: jest.fn().mockResolvedValue({
    success: true,
    txHash: '0xmocktxhash456',
  }),

  refundEscrow: jest.fn().mockResolvedValue({
    success: true,
    txHash: '0xmocktxhash789',
    refundedAmount: '5000000', // 5 USDC in smallest units
  }),

  getEscrowStatus: jest.fn().mockResolvedValue({
    status: 'FUNDED',
    amount: '5000000',
    depositor: '0xmockcustomer',
    recipient: '0xmockstylist',
  }),

  reset: () => {
    mockEscrowClient.createEscrow.mockClear();
    mockEscrowClient.releaseEscrow.mockClear();
    mockEscrowClient.refundEscrow.mockClear();
    mockEscrowClient.getEscrowStatus.mockClear();
  },
};

// Mock the escrow-client module
jest.mock('../../lib/escrow-client', () => mockEscrowClient);

export default mockEscrowClient;
