# Tasks Breakdown – F1.2: Authentication System

## 1. Backend

### Database Schema
- [ ] Add `User` model to Prisma schema with fields: `id`, `email`, `phone`, `passwordHash`, `role`, `walletAddress`, `createdAt`, `updatedAt`
- [ ] Add `Role` enum to Prisma schema: `CUSTOMER`, `STYLIST`
- [ ] Add indexes on `email`, `phone`, `walletAddress` for fast lookups
- [ ] Run Prisma migration to create `User` table

### Auth Endpoints
- [ ] Implement `POST /v1/auth/signup` endpoint
  - Validate email format, password strength (min 8 chars), role
  - Hash password with bcrypt (salt rounds: 10)
  - Create user in database
  - Call VlossomAccountFactory to create AA wallet
  - Store walletAddress in user record
  - Generate JWT token with payload: `{ userId, role, walletAddress }`
  - Set httpOnly cookie: `vlossomToken=<JWT>` with 30-day expiry
  - Return user object + token

- [ ] Implement `POST /v1/auth/login` endpoint
  - Validate email and password
  - Query user by email
  - Compare password with bcrypt hash
  - Generate JWT token
  - Set httpOnly cookie
  - Return user object + token

- [ ] Implement `POST /v1/auth/send-otp` endpoint
  - Validate phone number format (E.164)
  - Generate 6-digit OTP code
  - Store OTP in cache (Redis or in-memory) with 10-min expiry
  - Send OTP via Twilio SMS
  - Return success message

- [ ] Implement `POST /v1/auth/verify-otp` endpoint
  - Validate OTP code against cache
  - If OTP valid, check if user exists by phone
  - If user exists, log them in (generate JWT)
  - If user doesn't exist, create new user (with role from request body)
  - Create AA wallet for new user
  - Set httpOnly cookie
  - Return user object + token
  - Mark OTP as used (delete from cache)

- [ ] Implement `POST /v1/auth/logout` endpoint
  - Clear httpOnly cookie
  - Return success message

- [ ] Implement `GET /v1/auth/me` endpoint
  - Extract JWT from cookie
  - Verify JWT signature
  - Query user by userId from token
  - Return user object

### Middleware
- [ ] Create JWT verification middleware (`authenticateJWT`)
  - Extract token from httpOnly cookie
  - Verify token signature with JWT secret
  - Decode payload (userId, role, walletAddress)
  - Attach user to `req.user`
  - If token invalid/expired, return 401 Unauthorized

- [ ] Create role-based access middleware (`requireRole`)
  - Check if `req.user.role` matches allowed role(s)
  - If role mismatch, return 403 Forbidden

### Wallet Integration
- [ ] Create `createAAWallet` service function
  - Call VlossomAccountFactory contract's `createAccount(owner)` method
  - Use user's email or phone hash as deterministic salt (CREATE2)
  - Return wallet address
  - Handle errors (Paymaster out of gas, RPC failures)

## 2. Frontend

### Pages
- [ ] Create `apps/web/app/(auth)/onboarding/page.tsx`
  - Form with fields: email/phone toggle, email input, phone input, password input, confirm password, role selector (customer/stylist)
  - Submit button triggers signup API call
  - Show loading state during signup
  - Show error messages for validation failures
  - Redirect to `/wallet` or `/stylist/dashboard` after successful signup

- [ ] Create `apps/web/app/(auth)/login/page.tsx`
  - Form with fields: email/phone toggle, email input, phone input, password input (for email), OTP input (for phone)
  - "Send Code" button for phone OTP
  - "Log In" button triggers login API call
  - Show loading state during login
  - Show error messages for invalid credentials
  - Redirect to appropriate dashboard after successful login

### API Client
- [ ] Create `apps/web/lib/auth-client.ts`
  - `signup(email, password, role)` - Calls `POST /v1/auth/signup`
  - `login(email, password)` - Calls `POST /v1/auth/login`
  - `sendOTP(phone)` - Calls `POST /v1/auth/send-otp`
  - `verifyOTP(phone, otp, role?)` - Calls `POST /v1/auth/verify-otp`
  - `logout()` - Calls `POST /v1/auth/logout`
  - `getCurrentUser()` - Calls `GET /v1/auth/me`
  - All functions handle errors and return typed responses

### Auth State Hook
- [ ] Create `apps/web/hooks/use-auth.ts`
  - `useAuth()` hook returns: `{ user, isLoading, isAuthenticated, login, signup, logout }`
  - Uses React Query to cache `GET /v1/auth/me` response
  - Automatically refetches user on mount (to restore session)
  - Updates user state after login/signup
  - Clears user state after logout

### Protected Routes Middleware
- [ ] Create `apps/web/middleware.ts`
  - Check if user is authenticated (call `GET /v1/auth/me`)
  - If unauthenticated and accessing protected route, redirect to `/login?redirect=<current-path>`
  - If authenticated but wrong role (customer accessing `/stylist/*`), redirect to appropriate dashboard with error toast
  - Allow public routes: `/`, `/login`, `/onboarding`

### UI Components
- [ ] Create `apps/web/components/auth/signup-form.tsx`
  - Email/password signup form
  - Phone OTP signup form
  - Role selector (customer/stylist)
  - Form validation with Zod schema
  - Loading states and error messages

- [ ] Create `apps/web/components/auth/login-form.tsx`
  - Email/password login form
  - Phone OTP login form
  - Form validation with Zod schema
  - Loading states and error messages

## 3. Smart contracts (if any)
- [ ] Verify VlossomAccountFactory contract is deployed to Base Sepolia (already done in V0.5)
- [ ] Verify Paymaster contract has sufficient ETH balance (>= 1 ETH for testing)
- [ ] Test `createAccount(owner)` function with deterministic salt

## 4. Testing

### Unit tests
- [ ] Backend: Test `POST /v1/auth/signup` with valid email/password
- [ ] Backend: Test `POST /v1/auth/signup` with duplicate email (should fail)
- [ ] Backend: Test `POST /v1/auth/signup` with weak password (should fail)
- [ ] Backend: Test `POST /v1/auth/login` with correct credentials
- [ ] Backend: Test `POST /v1/auth/login` with wrong password (should fail)
- [ ] Backend: Test `POST /v1/auth/send-otp` sends OTP via Twilio
- [ ] Backend: Test `POST /v1/auth/verify-otp` with correct OTP
- [ ] Backend: Test `POST /v1/auth/verify-otp` with expired OTP (should fail)
- [ ] Backend: Test `POST /v1/auth/verify-otp` with wrong OTP (should fail)
- [ ] Backend: Test `POST /v1/auth/logout` clears cookie
- [ ] Backend: Test `GET /v1/auth/me` with valid JWT
- [ ] Backend: Test `GET /v1/auth/me` with invalid JWT (should return 401)
- [ ] Backend: Test JWT middleware rejects expired tokens
- [ ] Backend: Test role-based middleware blocks wrong roles

- [ ] Frontend: Test `useAuth()` hook loads user on mount
- [ ] Frontend: Test `useAuth()` hook updates state after login
- [ ] Frontend: Test `useAuth()` hook clears state after logout

### Integration tests
- [ ] Test full signup flow: signup → create AA wallet → JWT issued → user redirected
- [ ] Test full login flow: login → JWT issued → user redirected
- [ ] Test protected route access: unauthenticated user redirected to `/login`
- [ ] Test role-based access: customer blocked from `/stylist/*`
- [ ] Test session persistence: refresh page → user still authenticated

### E2E tests / Playwright
- [ ] E2E: New customer signs up with email/password → redirected to `/wallet`
- [ ] E2E: New stylist signs up with email/password → redirected to `/stylist/dashboard`
- [ ] E2E: Returning customer logs in with email/password → redirected to `/wallet`
- [ ] E2E: Customer tries to access `/stylist/dashboard` → redirected to `/wallet` with error
- [ ] E2E: User logs out → redirected to `/login`
- [ ] E2E: User tries to access `/wallet` while logged out → redirected to `/login?redirect=/wallet`

## 5. Verification
- [ ] All acceptance criteria from `feature-spec.md` have passing tests or manual checks
- [ ] Signup flow works on desktop and mobile
- [ ] Login flow works on desktop and mobile
- [ ] Protected routes correctly redirect unauthenticated users
- [ ] Role-based access correctly blocks wrong roles
- [ ] JWT cookies are httpOnly (verify in browser DevTools)
- [ ] Passwords are hashed in database (never stored in plaintext)
- [ ] OTP codes expire after 10 minutes
- [ ] AA wallet creation is gasless (Paymaster sponsors transaction)
- [ ] Session persists across page refreshes
- [ ] Logout clears session and redirects to login
