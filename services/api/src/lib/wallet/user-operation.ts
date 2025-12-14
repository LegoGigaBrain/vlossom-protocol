/**
 * UserOperation helpers for ERC-4337 transactions
 * Builds, signs, and submits UserOperations through the bundler
 */

import {
  type Address,
  type Hash,
  type Hex,
  encodeFunctionData,
  concat,
  toHex,
  pad,
} from "viem";
import { publicClient, getRelayerAccount, getBundlerUrl } from "./chain-client";
import {
  ENTRY_POINT_ADDRESS,
  FACTORY_ADDRESS,
  FACTORY_ABI,
  ACCOUNT_ABI,
  PAYMASTER_ADDRESS,
} from "./contracts";
import { generateSalt } from "./wallet-service";

/**
 * PackedUserOperation structure for ERC-4337 v0.7
 */
export interface PackedUserOperation {
  sender: Address;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  accountGasLimits: Hex; // packed: callGasLimit (16 bytes) | verificationGasLimit (16 bytes)
  preVerificationGas: bigint;
  gasFees: Hex; // packed: maxPriorityFeePerGas (16 bytes) | maxFeePerGas (16 bytes)
  paymasterAndData: Hex;
  signature: Hex;
}

/**
 * UserOperation build options
 */
export interface UserOpOptions {
  sender: Address;
  userId: string; // For initCode if wallet not deployed
  callData: Hex;
  isDeployed: boolean;
}

/**
 * UserOperation result
 */
export interface UserOpResult {
  userOpHash: Hash;
  txHash?: Hash;
  success: boolean;
  error?: string;
}

/**
 * Pack two uint128 values into a bytes32
 */
function packUint128(high: bigint, low: bigint): Hex {
  const highPadded = pad(toHex(high), { size: 16 });
  const lowPadded = pad(toHex(low), { size: 16 });
  return concat([highPadded, lowPadded]);
}

/**
 * Build initCode for wallet deployment
 * Only needed for first transaction (wallet not yet deployed)
 */
export function buildInitCode(userId: string, owner: Address): Hex {
  if (!FACTORY_ADDRESS) {
    throw new Error("FACTORY_ADDRESS not configured");
  }

  const salt = generateSalt(userId);
  const initData = encodeFunctionData({
    abi: FACTORY_ABI,
    functionName: "createAccount",
    args: [salt, owner],
  });

  return concat([FACTORY_ADDRESS, initData]);
}

/**
 * Build callData for execute function
 */
export function buildExecuteCallData(
  target: Address,
  value: bigint,
  data: Hex
): Hex {
  return encodeFunctionData({
    abi: ACCOUNT_ABI,
    functionName: "execute",
    args: [target, value, data],
  });
}

/**
 * Build callData for batch execute
 */
export function buildBatchExecuteCallData(
  targets: Address[],
  values: bigint[],
  datas: Hex[]
): Hex {
  return encodeFunctionData({
    abi: ACCOUNT_ABI,
    functionName: "executeBatch",
    args: [targets, values, datas],
  });
}

/**
 * Get the nonce for an account from EntryPoint
 */
export async function getAccountNonce(sender: Address): Promise<bigint> {
  const ENTRY_POINT_ABI = [
    {
      type: "function",
      name: "getNonce",
      inputs: [
        { name: "sender", type: "address" },
        { name: "key", type: "uint192" },
      ],
      outputs: [{ type: "uint256" }],
      stateMutability: "view",
    },
  ] as const;

  try {
    return (await publicClient.readContract({
      address: ENTRY_POINT_ADDRESS,
      abi: ENTRY_POINT_ABI,
      functionName: "getNonce",
      args: [sender, 0n],
    })) as bigint;
  } catch {
    // If account doesn't exist yet, nonce is 0
    return 0n;
  }
}

/**
 * Build a complete UserOperation (unsigned)
 */
export async function buildUserOp(options: UserOpOptions): Promise<PackedUserOperation> {
  const { sender, userId, callData, isDeployed } = options;
  const relayer = getRelayerAccount();

  // Get nonce
  const nonce = await getAccountNonce(sender);

  // Build initCode if wallet not deployed
  const initCode: Hex = isDeployed ? "0x" : buildInitCode(userId, relayer.address);

  // Default gas values (will be estimated)
  const verificationGasLimit = isDeployed ? 100_000n : 500_000n; // Higher for deployment
  const callGasLimit = 200_000n;
  const preVerificationGas = 50_000n;

  // Get current gas prices
  const gasPrice = await publicClient.getGasPrice();
  const maxFeePerGas = gasPrice;
  const maxPriorityFeePerGas = gasPrice / 10n; // 10% tip

  // Pack gas limits and fees
  const accountGasLimits = packUint128(callGasLimit, verificationGasLimit);
  const gasFees = packUint128(maxPriorityFeePerGas, maxFeePerGas);

  // Paymaster data (empty for now, will be added by addPaymasterData)
  const paymasterAndData: Hex = "0x";

  return {
    sender,
    nonce,
    initCode,
    callData,
    accountGasLimits,
    preVerificationGas,
    gasFees,
    paymasterAndData,
    signature: "0x", // Will be signed
  };
}

/**
 * Add paymaster data to UserOperation
 * For Vlossom, we use a simple verifying paymaster
 */
export function addPaymasterData(userOp: PackedUserOperation): PackedUserOperation {
  if (!PAYMASTER_ADDRESS) {
    throw new Error("PAYMASTER_ADDRESS not configured");
  }

  // For verifying paymaster, just include the address
  // More complex paymasters may need additional data/signatures
  const validUntil = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour
  const validAfter = 0n;

  // Pack paymaster data: address (20) + validUntil (6) + validAfter (6)
  const paymasterAndData = concat([
    PAYMASTER_ADDRESS,
    pad(toHex(validUntil), { size: 6 }),
    pad(toHex(validAfter), { size: 6 }),
  ]);

  return {
    ...userOp,
    paymasterAndData,
  };
}

/**
 * Sign a UserOperation with the relayer key
 */
export async function signUserOp(userOp: PackedUserOperation): Promise<PackedUserOperation> {
  const relayer = getRelayerAccount();

  // Compute userOpHash
  const userOpHash = await computeUserOpHash(userOp);

  // Sign with relayer (EIP-191 personal sign)
  const signature = await relayer.signMessage({
    message: { raw: userOpHash },
  });

  return {
    ...userOp,
    signature,
  };
}

/**
 * Compute the hash of a UserOperation
 */
async function computeUserOpHash(userOp: PackedUserOperation): Promise<Hash> {
  // This is a simplified version - real implementation would use
  // EntryPoint's getUserOpHash or compute it manually
  const ENTRY_POINT_ABI = [
    {
      type: "function",
      name: "getUserOpHash",
      inputs: [
        {
          name: "userOp",
          type: "tuple",
          components: [
            { name: "sender", type: "address" },
            { name: "nonce", type: "uint256" },
            { name: "initCode", type: "bytes" },
            { name: "callData", type: "bytes" },
            { name: "accountGasLimits", type: "bytes32" },
            { name: "preVerificationGas", type: "uint256" },
            { name: "gasFees", type: "bytes32" },
            { name: "paymasterAndData", type: "bytes" },
            { name: "signature", type: "bytes" },
          ],
        },
      ],
      outputs: [{ type: "bytes32" }],
      stateMutability: "view",
    },
  ] as const;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await publicClient.readContract({
    address: ENTRY_POINT_ADDRESS,
    abi: ENTRY_POINT_ABI,
    functionName: "getUserOpHash",
    args: [userOp] as any,
  })) as Hash;
}

/**
 * Submit a UserOperation to the bundler
 */
export async function submitUserOp(userOp: PackedUserOperation): Promise<UserOpResult> {
  const bundlerUrl = getBundlerUrl();

  try {
    // Submit to bundler via JSON-RPC
    const response = await fetch(bundlerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_sendUserOperation",
        params: [
          {
            sender: userOp.sender,
            nonce: toHex(userOp.nonce),
            initCode: userOp.initCode,
            callData: userOp.callData,
            accountGasLimits: userOp.accountGasLimits,
            preVerificationGas: toHex(userOp.preVerificationGas),
            gasFees: userOp.gasFees,
            paymasterAndData: userOp.paymasterAndData,
            signature: userOp.signature,
          },
          ENTRY_POINT_ADDRESS,
        ],
      }),
    });

    const result = await response.json();

    if (result.error) {
      return {
        userOpHash: "0x" as Hash,
        success: false,
        error: result.error.message || "Bundler error",
      };
    }

    return {
      userOpHash: result.result as Hash,
      success: true,
    };
  } catch (error) {
    return {
      userOpHash: "0x" as Hash,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Wait for a UserOperation to be included in a block
 */
export async function waitForUserOp(userOpHash: Hash, timeoutMs: number = 60_000): Promise<Hash | null> {
  const bundlerUrl = getBundlerUrl();
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(bundlerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getUserOperationReceipt",
          params: [userOpHash],
        }),
      });

      const result = await response.json();

      if (result.result?.receipt?.transactionHash) {
        return result.result.receipt.transactionHash as Hash;
      }
    } catch {
      // Ignore errors, keep polling
    }

    // Wait 2 seconds before next poll
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return null;
}

/**
 * Execute a full UserOperation flow
 * Build -> Add Paymaster -> Sign -> Submit -> Wait
 */
export async function executeUserOp(options: UserOpOptions): Promise<UserOpResult> {
  // Build
  let userOp = await buildUserOp(options);

  // Add paymaster
  userOp = addPaymasterData(userOp);

  // Sign
  userOp = await signUserOp(userOp);

  // Submit
  const submitResult = await submitUserOp(userOp);

  if (!submitResult.success) {
    return submitResult;
  }

  // Wait for confirmation
  const txHash = await waitForUserOp(submitResult.userOpHash);

  return {
    userOpHash: submitResult.userOpHash,
    txHash: txHash ?? undefined,
    success: !!txHash,
    error: txHash ? undefined : "UserOperation not confirmed in time",
  };
}
