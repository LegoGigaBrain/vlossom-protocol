# Escrow Contract

Secure USDC escrow implementation for Vlossom Protocol beauty service bookings.

## Overview

The Escrow contract manages payment protection for beauty service bookings by:
- Locking customer payments in USDC before service delivery
- Enabling multi-party settlements (stylist + platform fee)
- Supporting full and partial refunds
- Enforcing single-use escrow records (no double-spending)

## Security Features

1. **Reentrancy Protection**: All fund-moving functions protected with `ReentrancyGuard`
2. **Check-Effects-Interactions Pattern**: State updates before external calls
3. **SafeERC20**: Safe token transfers preventing malicious token behaviors
4. **Access Control**: Relayer-only functions for settlements
5. **Custom Errors**: Gas-optimized error handling
6. **Single-Use Records**: Each booking can only be settled or refunded once

## Contract Architecture

```
Escrow
├── Inherits: IEscrow, Ownable, ReentrancyGuard
├── Dependencies: SafeERC20, IERC20
└── State:
    ├── usdc (immutable) - USDC token contract
    ├── relayer - Authorized backend service
    └── escrows - Mapping of booking IDs to records
```

## Key Invariants

1. Each `bookingId` maps to exactly one escrow record
2. Escrow status transitions: `None -> Locked -> (Released | Refunded)`
3. Total released (stylist + platform) equals total locked
4. Only relayer can trigger settlements and refunds
5. Only owner can set relayer address

## Functions

### Customer Functions

#### lockFunds
```solidity
function lockFunds(bytes32 bookingId, uint256 amount) external
```
Lock USDC from customer wallet into escrow.

**Requirements:**
- `amount > 0`
- `bookingId` must not already exist
- Customer must have approved escrow contract
- Customer must have sufficient USDC balance

**Events:** `FundsLocked(bookingId, customer, amount)`

### Relayer Functions (Backend Only)

#### releaseFunds
```solidity
function releaseFunds(
    bytes32 bookingId,
    address stylist,
    uint256 stylistAmount,
    address treasury,
    uint256 platformFeeAmount
) external
```
Release escrowed funds to stylist and treasury.

**Requirements:**
- Caller must be relayer
- Escrow must be in `Locked` status
- `stylistAmount + platformFeeAmount == locked amount`
- Addresses must not be zero

**Events:** `FundsReleased(bookingId, stylist, stylistAmount, platformFeeAmount)`

#### refund
```solidity
function refund(
    bytes32 bookingId,
    uint256 amount,
    address recipient
) external
```
Refund escrowed funds to customer or specified recipient.

**Requirements:**
- Caller must be relayer
- Escrow must be in `Locked` status
- `amount > 0` and `<= locked amount`
- Recipient must not be zero address

**Events:** `FundsRefunded(bookingId, recipient, amount)`

### View Functions

#### getEscrowBalance
```solidity
function getEscrowBalance(bytes32 bookingId) external view returns (uint256)
```
Returns locked balance for a booking (0 if not locked).

#### getEscrowRecord
```solidity
function getEscrowRecord(bytes32 bookingId) external view returns (EscrowRecord)
```
Returns complete escrow record including customer, amount, and status.

### Admin Functions

#### setRelayer
```solidity
function setRelayer(address newRelayer) external
```
Set authorized relayer address (owner only).

**Events:** `RelayerUpdated(oldRelayer, newRelayer)`

## Usage Example

### Customer locks funds
```typescript
// Frontend: Customer approves escrow
await usdc.approve(escrowAddress, amount);

// Frontend: Customer locks funds
await escrow.lockFunds(bookingId, amount);
```

### Service completion & settlement
```typescript
// Backend: After service confirmed
await escrow.releaseFunds(
  bookingId,
  stylistAddress,
  stylistAmount,
  treasuryAddress,
  platformFeeAmount
);
```

### Cancellation & refund
```typescript
// Backend: Customer cancels
await escrow.refund(
  bookingId,
  refundAmount,
  customerAddress
);
```

## Deployment

See `scripts/deploy-escrow.ts` for deployment instructions.

### Networks
- **Localhost**: Deploys MockUSDC automatically
- **Base Sepolia**: Uses testnet USDC (0x036CbD53842c5426634e7929541eC2318f3dCF7e)
- **Base Mainnet**: Uses USDC (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)

### Post-Deployment
1. Set relayer address: `escrow.setRelayer(backendRelayerAddress)`
2. Fund relayer with gas
3. Update backend config with escrow address

## Testing

Run comprehensive test suite:
```bash
npx hardhat test test/Escrow.test.ts
```

Test coverage includes:
- Lock funds (success & failure cases)
- Release with splits
- Full & partial refunds
- Access control
- Event emissions
- Edge cases (zero amounts, reentrancy)

## Gas Optimization

- Custom errors instead of require strings
- Immutable USDC address
- Minimal storage (packed struct)
- Direct storage access in loops

## Security Considerations

### Audited Patterns
- OpenZeppelin contracts (v5.0.1)
- Check-effects-interactions
- SafeERC20 for token transfers
- ReentrancyGuard on external functions

### Known Limitations
- Partial refunds still mark escrow as `Refunded` (cannot split refund)
- No emergency withdrawal (by design - security over convenience)
- Relayer is a trusted role (must be secured)

### Security Checklist
- [x] Reentrancy protection
- [x] Access control enforced
- [x] Integer overflow/underflow safe (Solidity ^0.8)
- [x] External calls come last
- [x] Events emitted for state changes
- [x] No zero address checks
- [x] Amount validation
- [x] Single-use escrow enforcement

## Integration

### Backend Integration
```typescript
import { Escrow__factory } from '@vlossom/contracts/typechain-types';

const escrow = Escrow__factory.connect(escrowAddress, relayerSigner);

// Lock funds (called by customer via frontend)
// Release/refund (called by backend as relayer)
```

### Frontend Integration
```typescript
// Customer locks funds
const tx = await escrow.lockFunds(bookingId, amount);
await tx.wait();

// Listen for events
escrow.on('FundsLocked', (bookingId, customer, amount) => {
  console.log('Funds locked:', { bookingId, customer, amount });
});
```

## License

MIT
