# Feature Spec – F1.2: Authentication System

## 1. Summary
JWT-based authentication system supporting email/password and phone OTP login, with protected routes and role-based access control (customer vs stylist). This enables secure user sessions, automatic AA wallet creation on first login, and role-specific UI flows throughout the Vlossom platform.

## 2. User stories
- As a **new customer**, I want to sign up with my email/password or phone number so that I can book beauty services.
- As a **new stylist**, I want to sign up with my email/password or phone number so that I can offer my services and manage bookings.
- As a **returning user**, I want to log in with my credentials so that I can access my wallet, bookings, and profile.
- As a **customer**, I want protected routes to redirect me to login if I'm not authenticated so that my data remains secure.
- As a **stylist**, I want to see stylist-specific pages (dashboard, earnings) and be blocked from customer-only pages.
- As the **system**, I want to create an AA wallet automatically on first login so that users can transact gaslessly without extra steps.

## 3. Scope
### In scope
- Email/password signup and login
- Phone OTP signup and login (using Twilio or similar provider)
- JWT token issuance (httpOnly cookies for security)
- Token refresh mechanism (30-day session duration)
- Protected route middleware (redirects to `/login` if unauthenticated)
- Role-based access control (customer vs stylist)
- Automatic AA wallet creation on first successful authentication
- Session persistence across page refreshes
- Logout functionality (clear JWT cookies)
- Basic user profile storage (email, phone, role, walletAddress)

### Out of scope
- Social login (Google, Facebook) – deferred to V1.5+
- Multi-factor authentication (MFA) – deferred to V1.5+
- Password reset flow – deferred to Week 2 (not blocking V1.0)
- Email verification (optional for V1.0, users can login immediately)
- Admin role (only customer/stylist for V1.0)
- Rate limiting on auth endpoints (will be added in Week 7 Security Audit)

## 4. UX Overview

### Primary flow: Email/Password Signup
1. User lands on `/onboarding` page
2. User enters email, password, confirms password, selects role (customer or stylist)
3. User clicks "Sign Up"
4. System validates input (email format, password strength, role selected)
5. System creates user account in database
6. System creates AA wallet (deterministic CREATE2 address)
7. System issues JWT token (httpOnly cookie)
8. System redirects to appropriate dashboard:
   - Customer → `/wallet` (wallet is the hub for customers)
   - Stylist → `/stylist/dashboard`

### Primary flow: Email/Password Login
1. User lands on `/login` page
2. User enters email and password
3. User clicks "Log In"
4. System validates credentials
5. System issues JWT token (httpOnly cookie)
6. System redirects based on role:
   - Customer → `/wallet`
   - Stylist → `/stylist/dashboard`

### Alternate flow: Phone OTP Signup
1. User lands on `/onboarding` page
2. User selects "Sign up with phone"
3. User enters phone number and selects role (customer or stylist)
4. User clicks "Send Code"
5. System sends 6-digit OTP via SMS
6. User enters OTP code
7. System verifies OTP
8. System creates user account in database
9. System creates AA wallet
10. System issues JWT token
11. System redirects based on role

### Alternate flow: Phone OTP Login
1. User lands on `/login` page
2. User selects "Log in with phone"
3. User enters phone number
4. User clicks "Send Code"
5. System sends 6-digit OTP via SMS
6. User enters OTP code
7. System verifies OTP
8. System issues JWT token
9. System redirects based on role

### Edge flows
- **Protected route access while unauthenticated**: User tries to access `/wallet` → redirected to `/login` with `?redirect=/wallet` query param → after login, redirected back to `/wallet`
- **Wrong role access**: Stylist tries to access `/wallet` (customer-only) → redirected to `/stylist/dashboard` with error toast "This page is for customers only"
- **Session expiry**: User's JWT expires after 30 days → next API call returns 401 → frontend clears cookie and redirects to `/login`
- **Logout**: User clicks "Log Out" → JWT cookie cleared → redirected to `/login`

## 5. Data & APIs

### New entities (Prisma schema)
```prisma
model User {
  id            String   @id @default(cuid())
  email         String?  @unique
  phone         String?  @unique
  passwordHash  String?  // bcrypt hash (only for email/password users)
  role          Role     @default(CUSTOMER)
  walletAddress String   @unique // AA wallet address
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([email])
  @@index([phone])
  @@index([walletAddress])
}

enum Role {
  CUSTOMER
  STYLIST
}
```

### Backend API endpoints
- `POST /v1/auth/signup` - Create new user (email/password or phone)
  - Request body: `{ email?, password?, phone?, role: "CUSTOMER" | "STYLIST" }`
  - Response: `{ user: { id, email, phone, role, walletAddress }, token: string }`
  - Sets httpOnly cookie: `vlossomToken=<JWT>`

- `POST /v1/auth/login` - Authenticate existing user
  - Request body: `{ email?, password?, phone? }`
  - Response: `{ user: { id, email, phone, role, walletAddress }, token: string }`
  - Sets httpOnly cookie: `vlossomToken=<JWT>`

- `POST /v1/auth/send-otp` - Send OTP to phone number
  - Request body: `{ phone: string }`
  - Response: `{ message: "OTP sent", expiresAt: timestamp }`

- `POST /v1/auth/verify-otp` - Verify OTP and login/signup
  - Request body: `{ phone: string, otp: string, role?: "CUSTOMER" | "STYLIST" }`
  - Response: `{ user: { id, email, phone, role, walletAddress }, token: string }`
  - Sets httpOnly cookie: `vlossomToken=<JWT>`

- `POST /v1/auth/logout` - Clear JWT cookie
  - Request body: (none)
  - Response: `{ message: "Logged out successfully" }`
  - Clears httpOnly cookie

- `GET /v1/auth/me` - Get current authenticated user
  - Request headers: `Cookie: vlossomToken=<JWT>`
  - Response: `{ user: { id, email, phone, role, walletAddress } }`

### Frontend pages
- `apps/web/app/(auth)/onboarding/page.tsx` - Signup page
- `apps/web/app/(auth)/login/page.tsx` - Login page

### Frontend utilities
- `apps/web/lib/auth-client.ts` - API wrapper for auth endpoints
- `apps/web/hooks/use-auth.ts` - React hook for auth state
- `apps/web/middleware.ts` - Next.js middleware for protected routes

### Permissions and roles
- **Public routes** (no auth required): `/`, `/login`, `/onboarding`
- **Customer routes** (role: CUSTOMER): `/wallet`, `/bookings`, `/stylists`, `/book/*`
- **Stylist routes** (role: STYLIST): `/stylist/dashboard`, `/stylist/requests`, `/stylist/bookings`, `/stylist/services`, `/stylist/availability`, `/stylist/earnings`, `/stylist/profile`
- **Shared routes**: Both roles can access their own wallet and profile

## 6. Risks & assumptions

### Risks
- **Paymaster sponsorship for wallet creation**: If Paymaster runs out of ETH during signup, user creation will fail. **Mitigation**: Monitor Paymaster balance (F5.1), set alerts for balance < 0.1 ETH.
- **Phone OTP delivery failures**: SMS delivery may fail due to Twilio issues or invalid phone numbers. **Mitigation**: Show clear error messages, provide fallback to email/password signup.
- **JWT secret exposure**: If JWT secret is leaked, all sessions are compromised. **Mitigation**: Store JWT secret in environment variable (never commit to git), rotate secret if compromised.
- **Session hijacking**: If JWT cookie is stolen (XSS), attacker can impersonate user. **Mitigation**: Use httpOnly cookies (prevents JS access), set SameSite=Strict, enforce HTTPS.

### Assumptions
- Backend API already has JWT middleware (confirmed from V0.5 completion in roadmap.md)
- Wallet creation logic already exists in backend (VlossomAccountFactory integration)
- Users will not need email verification to use the platform (testnet MVP)
- 30-day session duration is acceptable for V1.0 (no token refresh needed yet)

## 7. Acceptance criteria
- [ ] User can sign up with email/password and is automatically logged in
- [ ] User can sign up with phone OTP and is automatically logged in
- [ ] User can log in with email/password
- [ ] User can log in with phone OTP
- [ ] User sees appropriate dashboard after login (customer → `/wallet`, stylist → `/stylist/dashboard`)
- [ ] User cannot access protected routes without authentication (redirected to `/login`)
- [ ] User cannot access routes for the wrong role (customer cannot access `/stylist/*`)
- [ ] User's session persists across page refreshes (JWT cookie is valid for 30 days)
- [ ] User can log out and is redirected to `/login`
- [ ] AA wallet is created automatically on first signup (walletAddress stored in database)
- [ ] JWT token is stored in httpOnly cookie (not accessible via JavaScript)
- [ ] Password is hashed with bcrypt before storing in database
- [ ] OTP codes expire after 10 minutes
- [ ] OTP codes are single-use (cannot be reused after verification)
