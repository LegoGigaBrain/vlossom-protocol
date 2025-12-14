# Vlossom — Microcopy Library
Canonical UX Writing Reference  
Aligned to Doc 24 — Brand Narrative & Lore

---

## 1. Purpose

This document is the **single source of truth** for all user-facing microcopy in the Vlossom product.

Its role is to ensure:
- brand voice consistency
- emotional safety
- clarity without urgency
- dignity in every interaction

Engineers, designers, and agents must **reuse or extend** patterns from this library.
They must **not invent copy ad hoc**.

If a state is missing, it should be added here through `/ux-copy-review`.

---

## 2. Brand Voice Summary (Doc 24)

- Calm
- Grounded
- Reassuring
- Human
- Non-judgmental
- Never urgent
- Never shaming
- Invitation over command
- Stewardship over control

The system speaks **with** the user, not **at** them.

---

## 3. Core Writing Rules

1. Always explain what’s happening.
2. Never blame the user.
3. Never rush the user.
4. Always offer a next step.
5. Prefer warmth over efficiency.
6. Avoid technical or financial jargon unless unavoidable.
7. Use soft authority — confident, never loud.
8. Treat time and care as sacred.
9. Keep copy short, but not cold.
10. Silence is better than bad copy.

---

## 4. CTA Language Rules

### Preferred CTA Style
- Verb-first
- Gentle, specific, human

Examples:
- “View booking”
- “Adjust search”
- “Leave a review”
- “Try again”
- “Notify stylist”

### Avoid
- “Submit”
- “Confirm now”
- “Action required”
- “Proceed”
- “Okay” (unless no action is required)

---

## 5. Booking Flow Microcopy

### 5.1 No Stylists Available

**Surface:** Search results

- **Title:** Nothing available just yet
- **Body:**  
  We couldn’t find a stylist in this area right now.  
  You can try adjusting your location or come back a little later.
- **Primary CTA:** Adjust search
- **Secondary CTA:** Browse nearby areas

---

### 5.2 Booking Request Sent

**Surface:** Booking confirmation

- **Title:** Your request is on its way
- **Body:**  
  We’ve shared your request with the stylist.  
  You’ll hear back as soon as they confirm.
- **Primary CTA:** View booking
- **Secondary CTA:** Back to home

---

### 5.3 Booking Pending Approval

**Surface:** Booking status

- **Title:** Waiting gently
- **Body:**  
  The stylist is reviewing your request.  
  This step helps ensure care is given with intention.
- **Primary CTA:** View details

---

### 5.4 Booking Confirmed

**Surface:** Booking success

- **Title:** You’re booked
- **Body:**  
  Your appointment is confirmed.  
  We look forward to taking care of you.
- **Primary CTA:** View appointment
- **Secondary CTA:** Add to calendar

---

### 5.5 Booking Declined

**Surface:** Booking update

- **Title:** This time wasn’t possible
- **Body:**  
  The stylist wasn’t able to accept this request.  
  You’re welcome to explore other options.
- **Primary CTA:** Find another stylist
- **Secondary CTA:** Back to search

---

### 5.6 Booking Cancelled

**Surface:** Booking update

- **Title:** This appointment has been released
- **Body:**  
  The booking has been cancelled.  
  We’re here if you’d like to make another plan.
- **Primary CTA:** Book again

---

## 6. Time & Presence

### 6.1 Customer Running Late

- **Title:** Take your time
- **Body:**  
  If you’re running a little late, you can let your stylist know here.
- **Primary CTA:** Notify stylist

---

### 6.2 Stylist Running Late

- **Title:** A gentle update
- **Body:**  
  Your stylist is running slightly behind and will be with you soon.
- **Primary CTA:** View details

---

### 6.3 Session Nearing Expected End

- **Title:** Checking in
- **Body:**  
  Your session is nearing its expected time.  
  Take the time you need to finish with care.
- **Primary CTA:** Continue session

---

### 6.4 Session Completion Prompt

- **Title:** How did it feel?
- **Body:**  
  Let us know when your session is complete so we can close this moment with care.
- **Primary CTA:** Session complete

---

## 7. Payments & Value Exchange

### 7.1 Payment Required

- **Title:** Ready when you are
- **Body:**  
  This step secures your appointment.  
  You can continue when it feels right.
- **Primary CTA:** Continue to payment

---

### 7.2 Payment Pending (Async / On-chain)

- **Title:** Confirming your payment
- **Body:**  
  This may take a short moment.  
  You don’t need to do anything — we’ll let you know when it’s complete.
- **Primary CTA:** Okay

---

### 7.3 Payment Completed

- **Title:** All set
- **Body:**  
  Your payment is complete.  
  Everything is in place.
- **Primary CTA:** View booking

---

### 7.4 Refund Pending

- **Title:** Returning your funds
- **Body:**  
  Your refund is on its way.  
  This can take a short while to reflect.
- **Primary CTA:** View details

---

### 7.5 Refund Completed

- **Title:** Refund complete
- **Body:**  
  Your funds have been returned.
- **Primary CTA:** Done

---

## 8. Reviews & Reputation

### 8.1 Review Prompt

- **Title:** Reflect on your experience
- **Body:**  
  Your words help the community grow with trust and care.
- **Primary CTA:** Leave a review
- **Secondary CTA:** Later

---

### 8.2 Reputation Update

- **Title:** A moment of growth
- **Body:**  
  Your profile has been updated based on recent activity.
- **Primary CTA:** View profile

---

## 9. Errors & Edge States

### 9.1 Network Issue

- **Title:** Something slowed us down
- **Body:**  
  We’re having trouble connecting right now.  
  Please try again when you’re ready.
- **Primary CTA:** Try again

---

### 9.2 Permission Denied

- **Title:** This isn’t available here
- **Body:**  
  That action isn’t possible in this space.
- **Primary CTA:** Go back

---

### 9.3 Session Expired

- **Title:** That moment has passed
- **Body:**  
  This session has expired.  
  You can start again whenever you’re ready.
- **Primary CTA:** Start again

---

## 10. Reusable Pattern Templates

### Calm Error Pattern
Title: Something slowed us down
Body: We couldn’t complete this just yet. Please try again when you’re ready.
CTA: Try again


### Gentle Waiting Pattern

Title: Waiting gently
Body: This step helps ensure everything is handled with care.
CTA: View details


### Confirmation Pattern

Title: You’re all set
Body: Everything is in place. We’ll guide you from here.
CTA: Continue


---

## 11. Enforcement Rules

- Engineers must not invent microcopy.
- New states must be added via `/ux-copy-review`.
- This file is authoritative over inline strings.
- Voice consistency outranks brevity.

---

## 12. Final Note

Vlossom does not rush people.  
It does not judge them.  
It meets them where they are.

Every word should feel like that.


