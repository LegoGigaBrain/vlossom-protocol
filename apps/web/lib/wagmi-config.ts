import { createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";

// Base Sepolia testnet configuration
export const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
});

// Contract addresses on Base Sepolia (from deployment)
export const CONTRACTS = {
  VlossomAccountFactory: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Update with actual deployed address
  VlossomPaymaster: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // Update with actual deployed address
  MockUSDC: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", // Update with actual deployed address
  VlossomPaymentEscrow: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9", // Update with actual deployed address
} as const;

// Base Sepolia RPC URL
export const BASE_SEPOLIA_RPC = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";

// Chain configuration
export const CHAIN_CONFIG = {
  chainId: baseSepolia.id,
  chainName: baseSepolia.name,
  rpcUrl: BASE_SEPOLIA_RPC,
  blockExplorer: baseSepolia.blockExplorers.default.url,
  nativeCurrency: baseSepolia.nativeCurrency,
} as const;
