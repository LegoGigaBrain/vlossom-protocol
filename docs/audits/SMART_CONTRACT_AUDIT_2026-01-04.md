# Vlossom Protocol Smart Contract Security Audit

**Audit Date:** January 4, 2026
**Auditor:** Claude (Opus 4.5) with specialized security agents
**Contracts Reviewed:** 11 (5 Core + 6 DeFi)
**Total Lines of Code:** ~4,500+ lines
**Commit:** `babc742` on branch `claude/review-align-design-7kMLO`

---

## Executive Summary

| Severity | Count | Status |
|----------|-------|--------|
| **Critical** | 3 | 🔴 Must Fix |
| **High** | 8 | 🔴 Must Fix |
| **Medium** | 15 | 🟡 Should Fix |
| **Low** | 13 | 🟢 Optional |
| **Informational** | 10 | ℹ️ Nice to Have |

**Overall Risk Assessment: HIGH** - Do not deploy to mainnet until Critical and High findings are resolved.

---

## Contracts Audited

### Core Contracts (5)
| Contract | Address (Arbitrum Sepolia) | Lines |
|----------|---------------------------|-------|
| VlossomAccountFactory | `0x1B1FD00ce6CDc46FcdD9be9F4C2948e00Ab694A9` | 135 |
| VlossomAccount | (deployed via factory) | 438 |
| VlossomPaymaster | `0x9E52B23a6376EAfa89790a637F99371995C0E68c` | 427 |
| Escrow | `0xb5ba44265B09679C044Ed60506AE936e35B59Afb` | 415 |
| PropertyRegistry | `0xE8395633875F5A11b89D3425C199Dd17e09E7E82` | 517 |
| ReputationRegistry | `0xdbDFFC205738d2E3A179AEd2450D9Aec9B4D0577` | 580 |

### DeFi Contracts (6)
| Contract | Address (Arbitrum Sepolia) | Lines |
|----------|---------------------------|-------|
| VlossomTreasury | `0x5Fda3cE7bEF86A755c8fd35474D9e1d8ecE9e4aA` | ~200 |
| VlossomYieldEngine | `0x44fE36117B9983AE7C3465E4275A20C9F842Fd82` | ~250 |
| VlossomGenesisPool | `0x8722EF54892a28007632A7372091f7B770D4FE0b` | ~300 |
| VlossomSmoothingBuffer | `0xfA938DE45e3E0E78C133Ff55d0b5E90691D19F63` | ~200 |
| VlossomCommunityPool | `0x58f2f38f9Aed2Af2D4234e27aCA344bC6b38BE29` | ~350 |
| VlossomPoolFactory | `0x801c4Fb1c0aCF428848D59b4BD5aB1687C75B7dd` | ~250 |

---

## Critical Findings

### C-1: Share Price Manipulation via Donation Attack

**Severity:** Critical
**Likelihood:** High
**Contracts:** VlossomGenesisPool.sol, VlossomCommunityPool.sol
**Location:** Lines 112-119 (Genesis), 162-167 (Community)

**Description:**
Both pool contracts are vulnerable to the classic "first depositor" or "donation attack". When `totalShares == 0`, the first depositor can:
1. Deposit 1 wei USDC (getting 1e12 shares due to scaling)
2. Directly transfer large USDC amount to pool contract
3. Next depositor's shares are calculated as `(amount * totalShares) / poolValue`
4. Due to inflated poolValue, victim gets 0 shares but loses funds

**Vulnerable Code:**
```solidity
if (totalShares == 0) {
    shares = amount * PRECISION / 1e6; // 1 USDC = 1e12 shares
} else {
    uint256 poolValue = totalDeposits + yieldReserve;
    shares = (amount * totalShares) / poolValue; // Vulnerable
}
```

**Exploit Scenario:**
1. Attacker deposits 1 USDC (gets 1e12 shares)
2. Attacker directly transfers 1,000,000 USDC to pool
3. poolValue = 1,000,001e6
4. Victim deposits 10,000 USDC
5. Victim shares = (10,000e6 * 1e12) / 1,000,001e6 = 9,999 shares (should be ~1e16)
6. Attacker withdraws, getting ~10,000 USDC of victim's funds

**Impact:** Complete loss of depositor funds

**Recommended Fix:**
```solidity
uint256 public constant MIN_FIRST_DEPOSIT = 1000e6; // $1000
uint256 private constant DEAD_SHARES = 1e9;

function deposit(uint256 amount) external nonReentrant whenNotPaused returns (uint256 shares) {
    if (amount == 0) revert InvalidAmount();

    if (totalShares == 0) {
        if (amount < MIN_FIRST_DEPOSIT) revert InsufficientFirstDeposit();
        shares = amount * PRECISION / 1e6;

        // Burn small amount of first shares to prevent manipulation
        totalShares += DEAD_SHARES;
        shares -= DEAD_SHARES;
    } else {
        uint256 actualBalance = usdc.balanceOf(address(this));
        shares = (amount * totalShares) / actualBalance;
    }
    // ... rest
}
```

**Tests to Add:**
- Test first deposit < MIN_FIRST_DEPOSIT reverts
- Test donation attack fails with dead shares
- Test share price remains stable after large transfers

---

### C-2: Missing Slippage Protection on Withdrawals

**Severity:** Critical
**Likelihood:** Medium
**Contracts:** VlossomGenesisPool.sol, VlossomCommunityPool.sol
**Location:** Lines 145-170 (Genesis), 193-215 (Community)

**Description:**
The `withdraw()` function calculates withdrawal amount based on current share price but provides no slippage protection. A sandwich attack can manipulate share price, causing users to receive less than expected.

**Vulnerable Code:**
```solidity
function withdraw(uint256 shares) external nonReentrant whenNotPaused returns (uint256 amount) {
    // ...
    uint256 poolValue = totalDeposits + yieldReserve;
    amount = (shares * poolValue) / totalShares; // No min amount check
    // ...
    usdc.safeTransfer(msg.sender, amount);
}
```

**Impact:** Users can lose significant funds to MEV/sandwich attacks

**Recommended Fix:**
```solidity
function withdraw(uint256 shares, uint256 minAmountOut) external nonReentrant whenNotPaused returns (uint256 amount) {
    // ... existing checks

    uint256 poolValue = totalDeposits + yieldReserve;
    amount = (shares * poolValue) / totalShares;

    if (amount < minAmountOut) revert InsufficientOutput();

    // ... rest
}
```

---

### C-3: Missing Test Coverage for Registry Contracts

**Severity:** Critical
**Likelihood:** High
**Contracts:** PropertyRegistry.sol, ReputationRegistry.sol

**Description:**
Neither PropertyRegistry.sol nor ReputationRegistry.sol have ANY test files in `/contracts/test/`. All security mechanisms are completely untested.

**Impact:**
- Unknown vulnerabilities may exist
- No verification of access control
- No validation of mathematical correctness
- Impossible to verify security claims

**Recommended Fix:**
Create comprehensive test suites:
- `contracts/test/PropertyRegistry.test.ts` (minimum 40 tests)
- `contracts/test/ReputationRegistry.test.ts` (minimum 50 tests)

---

## High Severity Findings

### H-1: YieldEngine Utilization Can Be Manipulated by Pools

**Severity:** High
**Contract:** VlossomYieldEngine.sol
**Location:** Lines 224-231

**Description:**
The `updatePoolUtilization()` function allows pool contracts to self-report utilization, enabling APY manipulation.

**Recommended Fix:**
Only allow admin or designated oracle to update utilization based on actual on-chain state.

---

### H-2: Genesis Pool Emergency Withdrawal Bypasses All Protections

**Severity:** High
**Contract:** VlossomGenesisPool.sol
**Location:** Lines 281-287

**Description:**
`emergencyWithdraw()` allows admin to drain entire pool instantly with no timelock.

```solidity
function emergencyWithdraw(address to) external {
    if (!hasRole(ADMIN_ROLE, msg.sender)) revert InvalidAddress();
    uint256 balance = usdc.balanceOf(address(this));
    usdc.safeTransfer(to, balance); // Drains entire pool!
}
```

**Impact:** Complete loss of user funds if admin key compromised

**Recommended Fix:**
Add 3-day timelock with proposal/execution pattern.

---

### H-3: Community Pool Creator Can Grief LPs via Name Change

**Severity:** High
**Contract:** VlossomCommunityPool.sol
**Location:** Lines 283-285

**Description:**
Pool creator can change name to offensive/misleading content with no validation.

**Recommended Fix:**
Add name validation, uniqueness check via factory, and emit events.

---

### H-4: Pool Factory Tier Validation Can Be Bypassed

**Severity:** High
**Contract:** VlossomPoolFactory.sol
**Location:** Lines 166-176

**Description:**
Users who create pools then get tier downgraded retain original tier benefits.

**Recommended Fix:**
Track tier changes and adjust pool parameters accordingly.

---

### H-5: Suspension Timelock Bypass via Dispute Resolution

**Severity:** High
**Contract:** PropertyRegistry.sol
**Location:** Lines 323-346

**Description:**
`resolveDispute()` with `upholdSuspension=true` executes suspension immediately, bypassing the 24-hour timelock.

**Recommended Fix:**
Enforce timelock even when dispute is rejected.

---

### H-6: Unbounded Batch Operations Enable DoS

**Severity:** High
**Contract:** ReputationRegistry.sol
**Location:** Lines 300-401

**Description:**
`recordEventsBatch()` has no array length limits, enabling DoS attacks.

**Recommended Fix:**
```solidity
uint256 public constant MAX_BATCH_SIZE = 100;
if (length > MAX_BATCH_SIZE) revert BatchTooLarge();
```

---

### H-7: Guardian Removal During Active Recovery

**Severity:** High
**Contract:** VlossomAccount.sol
**Location:** Lines 204-211

**Description:**
Owner can remove guardians during active recovery, potentially making it uncompletable.

**Recommended Fix:**
Check for active recovery before allowing guardian removal.

---

### H-8: Factory Owner-to-Account Mapping Collision

**Severity:** High
**Contract:** VlossomAccountFactory.sol
**Location:** Lines 92-93

**Description:**
`_ownerToAccount` mapping only stores one account per owner, overwriting previous accounts.

**Recommended Fix:**
Either prevent multiple accounts per owner or use array mapping.

---

## Medium Severity Findings

### Escrow Contract
| ID | Finding | Location |
|----|---------|----------|
| M-1 | Race condition between emergency recovery and refunds | Lines 213-234 |
| M-2 | No fee split validation (malicious relayer risk) | Lines 163-191 |
| M-3 | Relayer removal without minimum count check | Lines 274-278 |
| M-4 | Emergency recovery recipient not validated | Lines 329-351 |

### DeFi Contracts
| ID | Finding | Contract |
|----|---------|----------|
| M-5 | Yield reserve accounting discrepancy | GenesisPool:163-164 |
| M-6 | Treasury distribution fails silently if addresses not set | Treasury:132-161 |
| M-7 | Batch payout skips failed items silently | SmoothingBuffer:183-184 |
| M-8 | Precision loss in APY calculation | YieldEngine:99-116 |
| M-9 | Pool factory doesn't validate implementation | PoolFactory:188 |

### ERC-4337 Contracts
| ID | Finding | Contract |
|----|---------|----------|
| M-10 | Paymaster lifetime limit has no reset mechanism | Paymaster:381-383 |
| M-11 | Recovery to contract address bricks account | Account:358-362 |
| M-12 | Function whitelist bypass via proxy patterns | Paymaster:274-338 |

### Registry Contracts
| ID | Finding | Contract |
|----|---------|----------|
| M-13 | Property transfer without state validation | PropertyRegistry:179-197 |
| M-14 | Reputation score overflow edge cases | ReputationRegistry:440-449 |
| M-15 | Centralization risk - authorized submitters | ReputationRegistry:156-163 |

---

## Low Severity Findings

| ID | Finding | Contract |
|----|---------|----------|
| L-1 | No maximum escrow amount limit | Escrow |
| L-2 | Emergency recovery request spam | Escrow |
| L-3 | Stylist and treasury can be same address | Escrow |
| L-4 | BookingId collision not prevented on-chain | Escrow |
| L-5 | No maximum cap on APY parameters | YieldEngine |
| L-6 | Pool initialization not using Initializable | CommunityPool |
| L-7 | Missing events for critical state changes | Treasury, Buffer |
| L-8 | No sanity check on treasury split values | Treasury |
| L-9 | EnumerableSet iteration gas costs | PropertyRegistry |
| L-10 | Unbounded event history arrays | ReputationRegistry |
| L-11 | Property ID collision risk | PropertyRegistry |
| L-12 | Missing property owner validation in views | PropertyRegistry |
| L-13 | Missing verification status change on threshold update | ReputationRegistry |

---

## Informational Findings

| ID | Finding | Contract |
|----|---------|----------|
| I-1 | Zero amounts allowed in releaseFunds | Escrow |
| I-2 | getRelayer() returns address(0) - deprecated | Escrow |
| I-3 | Missing events for emergency recovery cleanup | Escrow |
| I-4 | Unused variable in pool withdrawal | GenesisPool |
| I-5 | Magic numbers should be constants | Multiple |
| I-6 | Incomplete NatSpec documentation | Multiple |
| I-7 | Consider SafeCast for type conversions | PoolFactory |
| I-8 | Interface mismatch with implementation | IPropertyRegistry |
| I-9 | Inconsistent error handling (require vs revert) | ReputationRegistry |
| I-10 | Missing NatSpec on internal functions | ReputationRegistry |

---

## Security Strengths Observed ✅

1. **ReentrancyGuard** on all fund-moving functions
2. **SafeERC20** for token transfers
3. **Checks-Effects-Interactions** pattern followed
4. **Custom errors** for gas efficiency
5. **Pausable** emergency mechanisms
6. **Previous H-1/H-2 fixes** in Paymaster and Account (V6.2.0)
7. **Rate limiting** in Paymaster (50 ops/day)
8. **7-day timelock** on Escrow emergency recovery

---

## Test Coverage Requirements

| Contract | Current Tests | Required Tests |
|----------|---------------|----------------|
| VlossomAccount | 17 | 30+ |
| VlossomPaymaster | 12 | 25+ |
| Escrow | 25 | 35+ |
| VlossomGenesisPool | ~10 | 40+ |
| VlossomCommunityPool | ~10 | 40+ |
| PropertyRegistry | **0** | 40+ |
| ReputationRegistry | **0** | 50+ |

---

## Remediation Priority

### Immediate (Before Any Deployment)
1. Fix C-1: Add minimum first deposit + dead shares to pools
2. Fix C-2: Add slippage protection to withdrawals
3. Fix H-2: Add timelock to emergency withdrawal
4. Fix H-5: Enforce timelock in dispute resolution
5. Create C-3: Test suites for Registry contracts

### Before Mainnet
6. Fix remaining High findings (H-1, H-3, H-4, H-6, H-7, H-8)
7. Address Medium findings, especially M-2 (fee validation)
8. External audit by third-party firm
9. Multi-sig admin keys (3-of-5 minimum)
10. Monitoring and alerting infrastructure

---

## Conclusion

The Vlossom Protocol demonstrates solid security fundamentals with proper use of OpenZeppelin libraries and defensive patterns. The V6.2.0 fixes show active security maintenance.

However, **critical vulnerabilities exist in the DeFi pool contracts** and **registry contracts lack any test coverage**. These must be addressed before production deployment.

**Estimated remediation time:** 3-4 weeks for fixes + testing + re-audit

---

## Auditor Notes

This audit was performed using Claude (Opus 4.5) with specialized security auditor agents. While comprehensive, this should be supplemented with:
- Manual review by human security researchers
- Formal verification for critical invariants
- Fuzzing tests for edge cases
- Economic attack simulations

---

*Report generated: January 4, 2026*
