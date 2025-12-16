/**
 * Mock Wallet Service
 *
 * Mocks AA wallet operations for integration testing.
 */

export const mockWalletService = {
  createWallet: jest.fn().mockResolvedValue({
    address: '0xmockwalletaddress',
    isDeployed: false,
    chainId: 84532,
  }),

  getBalance: jest.fn().mockResolvedValue({
    usdc: BigInt('10000000'), // 10 USDC
    usdcFormatted: '10.00',
    fiatValue: 10.0,
  }),

  sendP2P: jest.fn().mockResolvedValue({
    success: true,
    transactionId: 'mock-tx-id',
    userOpHash: '0xmockuserophash',
    txHash: '0xmocktxhash',
  }),

  reset: () => {
    mockWalletService.createWallet.mockClear();
    mockWalletService.getBalance.mockClear();
    mockWalletService.sendP2P.mockClear();
  },
};

// Mock the wallet module
jest.mock('../../lib/wallet', () => ({
  ...jest.requireActual('../../lib/wallet'),
  ...mockWalletService,
}));

export default mockWalletService;
