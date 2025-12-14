# Verification Checklist: F1.10 - MoonPay Offramp

**Feature ID**: F1.10
**Sprint**: Week 2

---

## 1. Spec Alignment
- [ ] "Withdraw" button opens offramp dialog
- [ ] User can add/select bank account
- [ ] Amount input converts USDC → fiat
- [ ] Fee preview shows all fees
- [ ] Estimated arrival time shown
- [ ] Withdrawal tracked in transaction history
- [ ] Email notification on completion

## 2. UX Verification
- [ ] Fiat-first display
- [ ] Fee preview clear and transparent
- [ ] Estimated arrival time prominent ("2-5 business days")
- [ ] Bank account management is secure (masked account numbers)
- [ ] No crypto jargon

## 3. Technical Verification
- [ ] MoonPay offramp SDK installed
- [ ] Withdrawal endpoint created
- [ ] Bank account endpoints created
- [ ] Webhook handling for status updates
- [ ] Balance validation prevents overdraft

## 4. Security
- [ ] Bank account details encrypted
- [ ] Webhook signature verified
- [ ] Balance check prevents overdraft
- [ ] User can only withdraw to their own bank accounts

## 5. Testing Coverage
- [ ] Add bank account (sandbox)
- [ ] Initiate withdrawal (sandbox)
- [ ] Webhook received
- [ ] Transaction tracked
- [ ] Email notification sent

## 6. Known Limitations
- Withdrawals take 2-5 business days (not instant)
- Fees may vary based on amount and currency

---

**Checklist Author**: Claude Sonnet 4.5
**Completion Date**: [To be filled]
