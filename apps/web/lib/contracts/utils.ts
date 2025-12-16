/**
 * Contract utility functions
 */

import { keccak256, toBytes, type Hex } from "viem";

/**
 * Convert booking ID string to bytes32 hash
 *
 * Uses keccak256 for cryptographically secure, collision-resistant hashing.
 * This matches the backend implementation in escrow-client.ts.
 *
 * @param bookingId - UUID or unique booking identifier
 * @returns bytes32 hash for contract calls
 */
export function bookingIdToBytes32(bookingId: string): Hex {
  return keccak256(toBytes(bookingId));
}
