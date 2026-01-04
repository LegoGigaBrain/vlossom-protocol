/**
 * Ethereum Address Validation Utilities
 * V8.0.0: Implements proper EIP-55 checksum validation
 *
 * Security: Prevents sending funds to invalid or malformed addresses
 */

import { isAddress, getAddress } from 'viem';

/**
 * Validate basic address format (0x prefix + 40 hex chars)
 */
function isValidAddressFormat(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

/**
 * EIP-55 checksum address conversion
 * Uses viem's getAddress for proper Keccak256-based checksumming
 *
 * @param address - The address to convert to checksum format
 * @returns checksummed address or null if invalid
 */
export function toChecksumAddress(address: string): string | null {
  if (!isValidAddressFormat(address)) return null;

  try {
    return getAddress(address);
  } catch {
    return null;
  }
}

/**
 * Validate Ethereum address with EIP-55 checksum
 * V8.0.0 Security Fix: Uses viem's isAddress for proper validation
 *
 * @param address - The address to validate
 * @returns true if valid, false otherwise
 */
export function isValidEthereumAddress(address: string): boolean {
  return isAddress(address, { strict: false });
}

/**
 * Strict address validation (requires valid checksum for mixed-case)
 *
 * @param address - The address to validate
 * @returns true if valid with proper checksum, false otherwise
 */
export function isValidChecksumAddress(address: string): boolean {
  return isAddress(address, { strict: true });
}

/**
 * Sanitize and validate address from user input or QR code
 * Returns null if invalid
 */
export function sanitizeAddress(rawAddress: string): string | null {
  if (!rawAddress || typeof rawAddress !== 'string') {
    return null;
  }

  const address = rawAddress.trim();

  if (!isValidEthereumAddress(address)) {
    return null;
  }

  return toChecksumAddress(address);
}

/**
 * Extract address from various QR code formats
 * Supports:
 * - Raw address: 0x...
 * - Ethereum URI: ethereum:0x...
 * - Vlossom URI: vlossom://pay?to=0x...
 * - EIP-681: ethereum:0x...@chainId/transfer?...
 */
export function extractAddressFromQR(data: string): string | null {
  if (!data || typeof data !== 'string') {
    return null;
  }

  let address = data.trim();

  // Handle ethereum: URI scheme (EIP-681)
  if (address.startsWith('ethereum:')) {
    address = address
      .replace('ethereum:', '')
      .split('@')[0]
      .split('/')[0]
      .split('?')[0];
  }

  // Handle vlossom: URI scheme
  if (data.startsWith('vlossom://pay?') || data.startsWith('vlossom://pay/')) {
    try {
      const url = new URL(data);
      address = url.searchParams.get('to') || '';
    } catch {
      return null;
    }
  }

  return sanitizeAddress(address);
}

/**
 * Format address for display (truncated)
 */
export function formatAddress(address: string, startChars = 6, endChars = 4): string {
  if (!isValidAddressFormat(address)) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Check if two addresses are equal (case-insensitive)
 */
export function addressEquals(a: string, b: string): boolean {
  if (!isValidAddressFormat(a) || !isValidAddressFormat(b)) {
    return false;
  }
  return a.toLowerCase() === b.toLowerCase();
}
