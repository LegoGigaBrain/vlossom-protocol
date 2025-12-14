# Verification Checklist – F1.2: Authentication System

## 1. Spec alignment
- [ ] All acceptance criteria from `feature-spec.md` have passing tests or manual checks
- [ ] No critical behaviour outside the spec (e.g., no unexpected redirects, no extra auth flows)
- [ ] All user stories are satisfied:
  - [ ] New customer can sign up and access booking flows
  - [ ] New stylist can sign up and access stylist dashboard
  - [ ] Returning users can log in and see their data
  - [ ] Protected routes redirect to login if unauthenticated
  - [ ] Role-based access blocks wrong roles
  - [ ] AA wallet is created automatically on signup

## 2. UX verification
- [ ] Primary flow (email/password signup) works on desktop
- [ ] Primary flow (email/password signup) works on mobile
- [ ] Primary flow (email/password login) works on desktop
- [ ] Primary flow (email/password login) works on mobile
- [ ] Alternate flow (phone OTP signup) works on desktop
- [ ] Alternate flow (phone OTP signup) works on mobile
- [ ] Alternate flow (phone OTP login) works on desktop
- [ ] Alternate flow (phone OTP login) works on mobile

### Empty / error / loading states
- [ ] Signup form shows loading spinner during submission
- [ ] Signup form shows error message for duplicate email ("This email is already registered")
- [ ] Signup form shows error message for weak password ("Password must be at least 8 characters")
- [ ] Signup form shows error message for mismatched passwords ("Passwords do not match")
- [ ] Login form shows loading spinner during submission
- [ ] Login form shows error message for wrong credentials ("Invalid email or password")
- [ ] Phone OTP form shows "Sending code..." state
- [ ] Phone OTP form shows "Code sent! Check your phone" success message
- [ ] Phone OTP form shows error message for invalid OTP ("Invalid code. Please try again")
- [ ] Phone OTP form shows error message for expired OTP ("Code expired. Request a new one")
- [ ] Protected route redirect preserves destination (e.g., `/login?redirect=/wallet`)
- [ ] After login, user is redirected to original destination (not always `/wallet`)

### Brand voice compliance (Doc 24)
- [ ] Signup CTA says "Get Started" or "Create Account" (NOT "Sign Up Now!")
- [ ] Error messages are helpful, not technical:
  - ❌ "401 Unauthorized - JWT verification failed"
  - ✅ "Please log in to continue"
- [ ] Loading states are calm:
  - ❌ "Processing... Please wait!"
  - ✅ "Creating your account..."
- [ ] Success messages are encouraging:
  - ✅ "Welcome to Vlossom! Your wallet is ready."

## 3. Security & reliability

### Auth & permissions verified
- [ ] JWT tokens are stored in httpOnly cookies (NOT localStorage or sessionStorage)
- [ ] JWT tokens have 30-day expiry and are signed with secret from environment variable
- [ ] Passwords are hashed with bcrypt before storing in database (verified by reading database directly)
- [ ] OTP codes are single-use (cannot be reused after verification)
- [ ] OTP codes expire after 10 minutes
- [ ] Protected routes require valid JWT (verified by manual testing)
- [ ] Role-based access blocks wrong roles (customer cannot access `/stylist/*`)
- [ ] `GET /v1/auth/me` returns 401 if JWT is invalid/expired
- [ ] Logout clears JWT cookie and user cannot access protected routes afterward

### Obvious abuse paths / edge cases tested
- [ ] **Brute-force login attempts**: Not rate-limited in V1.0 (deferred to Week 7 Security Audit)
- [ ] **Duplicate email signup**: Returns 400 error with helpful message
- [ ] **Duplicate phone signup**: Returns 400 error with helpful message
- [ ] **Email injection attack**: Email input is validated and sanitized
- [ ] **SQL injection attack**: Prisma ORM prevents SQL injection (verified by code review)
- [ ] **XSS attack via email field**: React escapes all user input by default (verified by code review)
- [ ] **JWT secret exposure**: Secret stored in `.env` file (gitignored) and never logged
- [ ] **Wallet creation failure**: If Paymaster runs out of ETH, signup fails gracefully with error message "Unable to create wallet. Please try again later."
- [ ] **OTP delivery failure**: If Twilio fails, user sees error message "Unable to send code. Please try again or use email signup."
- [ ] **Session hijacking**: httpOnly cookies + SameSite=Strict + HTTPS in production mitigate this risk
- [ ] **Token replay attack**: JWT tokens are signed and cannot be tampered with
- [ ] **Expired session handling**: After 30 days, user is logged out and must re-authenticate

## 4. Observability
- [ ] Logs added for critical auth events:
  - [ ] User signup (with userId and role)
  - [ ] User login (with userId and role)
  - [ ] Failed login attempts (with email/phone)
  - [ ] OTP sent (with phone number)
  - [ ] OTP verification success/failure
  - [ ] Wallet creation (with walletAddress)
  - [ ] Wallet creation failure (with error details)
  - [ ] JWT verification failure (with reason: expired, invalid signature, etc.)
- [ ] Metrics tracked (if relevant):
  - [ ] Daily signups (by role: customer vs stylist)
  - [ ] Daily logins
  - [ ] OTP delivery success rate
  - [ ] Wallet creation success rate

## Notes:
- **Testnet-only considerations**: For Base Sepolia testnet, we do not enforce email verification. Users can sign up and immediately use the platform. Email verification will be added in V1.5 for mainnet launch.
- **Phone OTP provider**: Using Twilio for SMS delivery. Sandbox mode for testnet, production mode for mainnet.
- **MFA deferral**: Multi-factor authentication (MFA) is deferred to V1.5+. For V1.0, single-factor auth (email/password or phone OTP) is sufficient.
- **Password reset deferral**: Password reset flow is deferred to Week 2. For V1.0 beta testing, users can contact support to reset passwords manually.
- **Rate limiting deferral**: Auth endpoint rate limiting is deferred to Week 7 Security Audit. For beta testing on Base Sepolia, brute-force attacks are low-risk.
- **Session refresh deferral**: Token refresh mechanism (refresh tokens) is deferred to V1.5+. For V1.0, 30-day JWT expiry is acceptable for user experience.
