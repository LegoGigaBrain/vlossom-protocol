/**
 * Wallet module exports
 * AA Wallet SDK for Vlossom Protocol
 */

// Chain client
export {
  publicClient,
  getRelayerAccount,
  getRelayerWalletClient,
  getBundlerUrl,
  getChain,
  chainConfig,
} from "./chain-client";

// Contract ABIs and addresses
export {
  ENTRY_POINT_ADDRESS,
  FACTORY_ADDRESS,
  PAYMASTER_ADDRESS,
  USDC_ADDRESS,
  FACTORY_ABI,
  ACCOUNT_ABI,
  ERC20_ABI,
  PAYMASTER_ABI,
  USDC_DECIMALS,
  toUsdcUnits,
  fromUsdcUnits,
} from "./contracts";

// Wallet service
export {
  createWallet,
  getWallet,
  getWalletByAddress,
  getWalletAddress,
  getBalance,
  getTransactions,
  markWalletDeployed,
  checkWalletDeployed,
  recordTransaction,
  updateTransactionStatus,
  generateSalt,
  type WalletInfo,
  type WalletBalance,
  type TransactionPage,
} from "./wallet-service";

// UserOperation helpers
export {
  buildUserOp,
  buildInitCode,
  buildExecuteCallData,
  buildBatchExecuteCallData,
  addPaymasterData,
  signUserOp,
  submitUserOp,
  waitForUserOp,
  executeUserOp,
  getAccountNonce,
  type PackedUserOperation,
  type UserOpOptions,
  type UserOpResult,
} from "./user-operation";

// Transfer service
export {
  sendP2P,
  createPaymentRequest,
  getPaymentRequest,
  fulfillPaymentRequest,
  cancelPaymentRequest,
  getPendingPaymentRequests,
  type P2PTransferResult,
  type PaymentRequestData,
} from "./transfer-service";
