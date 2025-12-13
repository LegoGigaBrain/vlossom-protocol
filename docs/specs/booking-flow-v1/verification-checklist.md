# Verification Checklist – Booking Flow v1

## 1. Spec Alignment

### Booking Creation
- [ ] Customer can search stylists by location (city/area)
- [ ] Customer can filter by service category
- [ ] Stylist profile shows all services with prices
- [ ] Booking request created with correct status (PENDING_STYLIST_APPROVAL)
- [ ] Booking record includes all required fields
- [ ] Status history records initial creation

### Stylist Approval Flow
- [ ] Stylist receives push notification on new request
- [ ] Request shows: service, time, location, price, customer info
- [ ] Approve action triggers payment flow
- [ ] Decline action cancels booking with reason
- [ ] 24h timeout triggers auto-cancel
- [ ] Declined booking shows in history with reason

### Payment & Escrow
- [ ] Funds locked from customer AA wallet
- [ ] Escrow contract receives correct USDC amount
- [ ] Booking status updates to CONFIRMED on success
- [ ] Insufficient balance triggers onramp modal
- [ ] Payment failure does not create false confirmation
- [ ] 2h payment timeout cancels booking

### Service Lifecycle
- [ ] Stylist can start service (IN_PROGRESS)
- [ ] Start time recorded for TPS calculation
- [ ] Stylist can mark complete (COMPLETED)
- [ ] Customer sees confirmation prompt
- [ ] Customer can confirm (SETTLED)
- [ ] 24h auto-confirm triggers settlement

### Settlement
- [ ] Escrow releases correct split to stylist
- [ ] Platform fee collected to treasury
- [ ] Stylist sees updated wallet balance
- [ ] Transaction appears in all party histories
- [ ] No critical behaviour outside spec

## 2. UX Verification

### Desktop
- [ ] Search page renders correctly
- [ ] Stylist cards show key info
- [ ] Booking flow is 3 clicks or less
- [ ] Confirmation screen is clear
- [ ] Status timeline is readable

### Mobile
- [ ] All pages responsive
- [ ] Touch targets are adequate (44px min)
- [ ] Forms work with mobile keyboard
- [ ] Notifications work on mobile browser

### States
- [ ] Empty state: "No stylists found" message
- [ ] Loading state: Skeleton/spinner on search
- [ ] Error state: Clear error messages
- [ ] Success state: Confirmation with next steps

### Cancellation UX
- [ ] Cancel button visible in appropriate states
- [ ] Confirmation modal before cancel
- [ ] Clear messaging about refund amount
- [ ] Refund appears in wallet history

## 3. Security & Reliability

### Authentication
- [ ] All booking endpoints require auth
- [ ] Customer can only view/modify own bookings
- [ ] Stylist can only approve/decline assigned bookings
- [ ] System actions (auto-cancel) are properly attributed

### Authorization
- [ ] Status transitions validate actor role
- [ ] Cannot approve already-approved booking
- [ ] Cannot cancel already-completed booking
- [ ] Escrow actions validate booking ownership

### Abuse Prevention
- [ ] Rate limiting on booking creation (max 10/hour per user)
- [ ] Rate limiting on search (max 100/min per user)
- [ ] Paymaster has per-user daily caps
- [ ] Escrow cannot be drained by malformed calls

### Data Integrity
- [ ] All status changes logged to history
- [ ] Timestamps are server-generated
- [ ] Pricing is immutable after creation
- [ ] Escrow amount matches booking amount

## 4. Observability

### Logging
- [ ] Booking creation logged with user ID
- [ ] Status transitions logged with actor
- [ ] Escrow events indexed from chain
- [ ] Errors logged with stack traces

### Metrics
- [ ] Booking creation count
- [ ] Approval rate (approved / created)
- [ ] Settlement time (complete → settled)
- [ ] Cancellation rate by party

### Alerts
- [ ] Escrow mismatch (off-chain vs on-chain)
- [ ] High cancellation rate (>20%)
- [ ] Paymaster balance low
- [ ] Settlement backlog (>1h)

## 5. Performance

- [ ] Search returns in <500ms
- [ ] Booking creation in <2s (including escrow)
- [ ] Status update in <1s
- [ ] Page load <3s on 3G

---

## Notes

- Property owner flow is out of scope for v1
- Reputation display is out of scope (data collected)
- Dispute flow is placeholder (status only, no resolution)
- Travel fees are out of scope (single city MVP)
- Special events are out of scope
- Calendar blocks are out of scope

## Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Product | | | |
| Engineering | | | |
| Design | | | |
| QA | | | |
