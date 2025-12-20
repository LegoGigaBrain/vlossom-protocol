# Mobile App

> Purpose: React Native mobile application for iOS and Android - native experience for customers and stylists.

## Current Implementation Status

**V6.8.0 Authentication & Profile Integration** (December 20, 2025)

Complete auth flow with login/signup screens, auth state management, and profile tab connected to real user data.

**V6.7.1 Messaging API Integration** (December 20, 2025)

Mobile messaging screens connected to backend API with Zustand state management and SecureStore authentication.

**V6.7.0 Direct Messaging UI** (December 20, 2025)

In-app messaging between customers and stylists with conversation list and thread views.

**V6.6.0 Special Events Booking** (December 19, 2025)

Complete Special Events flow for weddings, photoshoots, and group styling with multi-step request form.

**V6.0.0 Foundation Complete** (December 17, 2025)

Complete React Native + Expo app structure with 5-tab navigation, botanical icons, biometric auth, and design tokens matching web app.

---

### V6.8.0 Changes

**Authentication System**
- `src/api/auth.ts` - Auth API client (login, signup, logout, getMe, updateProfile)
- `src/stores/auth.ts` - Auth Zustand store with session management
- `app/(auth)/_layout.tsx` - Auth stack navigator
- `app/(auth)/login.tsx` - Login screen with email/password
- `app/(auth)/signup.tsx` - Signup screen with role selection (Customer/Stylist)

**Root Layout Updates**
- `app/_layout.tsx` - AuthGuard component for protected routing
- Automatic redirect to login if not authenticated
- Auth state initialization on app start

**Profile Tab Updates**
- `app/(tabs)/profile.tsx` - Connected to auth store
- Real user data display (name, email, avatar, role)
- Role badge display (Customer/Stylist/Property Owner)
- Dynamic role-based tabs
- Sign out functionality with confirmation

---

### V6.7.1 Changes

**API Infrastructure**
- `src/api/client.ts` - Base API client with SecureStore token management
- `src/api/messages.ts` - Messages API client (8 endpoints)
- `src/api/index.ts` - Barrel exports

**State Management**
- `src/stores/messages.ts` - Zustand store with optimistic updates
- `src/stores/index.ts` - Store exports

**Screens Updated:**
- `app/messages/index.tsx` - Connected to Zustand store with loading/error states
- `app/messages/[id].tsx` - Connected to Zustand with send/mark read

---

### V6.7.0 Changes

**Messaging Screens**
- `app/messages/_layout.tsx` - Stack navigator for messages
- `app/messages/index.tsx` - Conversations list with All/Unread tabs
- `app/messages/[id].tsx` - Conversation thread with message bubbles

---

### V6.6.0 Changes

**Special Events**
- `app/special-events/_layout.tsx` - Stack navigator
- `app/special-events/index.tsx` - Landing page with event categories
- `app/special-events/request.tsx` - Multi-step request form

**Reusable Components:**
- LocationSelector - Location type picker
- ChairSelector - Chair booking widget

---

## App Structure

### Framework & Navigation
- **Framework**: React Native 0.74.5, Expo SDK 51
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand 4.5.2
- **Package Version**: `6.7.1`

### Tab Navigation (5 Tabs)
| Tab | Route | Icon | Purpose |
|-----|-------|------|---------|
| Home | `(tabs)/index.tsx` | VlossomHome | Discovery, nearby stylists |
| Search | `(tabs)/search.tsx` | VlossomSearch | Search filters, categories |
| Wallet | `(tabs)/wallet.tsx` | VlossomWallet | Balance, transactions, payments |
| Notifications | `(tabs)/notifications.tsx` | VlossomNotifications | Booking updates, messages |
| Profile | `(tabs)/profile.tsx` | VlossomProfile | User profile, settings |

---

## Key Files

### Configuration
- `package.json` - Dependencies and scripts
- `app.json` - Expo configuration
- `tsconfig.json` - TypeScript configuration
- `babel.config.js` - Babel configuration (Expo preset)

### Layouts
- `app/_layout.tsx` - Root layout (theme provider, fonts)
- `app/(tabs)/_layout.tsx` - Tab navigation layout with botanical icons

### Screens
- `app/(tabs)/index.tsx` - Home screen placeholder
- `app/(tabs)/search.tsx` - Search screen placeholder
- `app/(tabs)/wallet.tsx` - Wallet screen placeholder
- `app/(tabs)/notifications.tsx` - Notifications screen placeholder
- `app/(tabs)/profile.tsx` - Profile screen placeholder

### Design System
- `src/styles/tokens.ts` - Design tokens (colors, typography, spacing, shadows)
- `src/styles/theme.tsx` - ThemeProvider component
- `src/styles/index.ts` - Barrel export

### Components
- `src/components/icons/VlossomIcons.tsx` - 28 botanical icons (React Native SVG)
- `src/components/icons/index.ts` - Icon exports

### Hooks
- `src/hooks/useBiometricAuth.ts` - Biometric authentication (Face ID, Touch ID, Fingerprint)
- `src/hooks/index.ts` - Hook exports

---

## Design Tokens

Design tokens in `src/styles/tokens.ts` match web app exactly:

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#311E6B` | Deep purple - main brand color |
| `primarySoft` | `#ADA5C4` | Soft purple - secondary brand |
| `secondary` | `#EFE3D0` | Cream - surfaces, cards |
| `accent` | `#FF510D` | Orange - CTAs, warnings (SACRED - growth only) |
| `tertiary` | `#A9D326` | Green - success states |
| `background` | `#FFFFFF` | Page background |
| `surface` | `#EFE3D0` | Card backgrounds |
| `textPrimary` | `#161616` | Main body text |
| `textSecondary` | `#6F6F6F` | Muted text |

### Typography
| Token | Value |
|-------|-------|
| `fontPrimary` | `Inter` |
| `fontDisplay` | `Playfair Display` |
| `fontMono` | `SF Mono` |

### Spacing
Standard 4px scale: `xs` (4), `sm` (8), `md` (16), `lg` (24), `xl` (32), `2xl` (48), `3xl` (64), `4xl` (96), `5xl` (128)

---

## Botanical Icons (React Native)

All 28 icons from the web app adapted for React Native SVG:

### Navigation (6)
- `VlossomHome`, `VlossomSearch`, `VlossomCalendar`, `VlossomWallet`, `VlossomProfile`, `VlossomNotifications`

### State (5)
- `VlossomHealthy`, `VlossomGrowing`, `VlossomResting`, `VlossomNeedsCare`, `VlossomTransition`

### Care (4)
- `VlossomRitual`, `VlossomWashDay`, `VlossomProtectiveStyle`, `VlossomTreatment`

### Growth (5)
- `VlossomStage1`, `VlossomStage2`, `VlossomStage3`, `VlossomStage4`, `VlossomMeter`

### Community (8)
- `VlossomCommunity`, `VlossomSupport`, `VlossomLearning`, `VlossomVerified`, `VlossomFavorite`, `VlossomSettings`, `VlossomAdd`, `VlossomClose`

**Usage:**
```tsx
import { VlossomHome, VlossomWallet } from '@/components/icons'

<VlossomHome size={24} color={colors.primary} />
<VlossomWallet size={20} color={colors.accent} />
```

---

## Biometric Authentication

Biometric auth hook in `src/hooks/useBiometricAuth.ts`:

```tsx
import { useBiometricAuth } from '@/hooks'

const { authenticate, isAvailable, biometricType } = useBiometricAuth()

// Check availability
if (isAvailable) {
  console.log(`Available: ${biometricType}`) // "faceId", "touchId", "fingerprint"
}

// Authenticate
const result = await authenticate('Unlock your wallet')
if (result.success) {
  // Proceed with secure action
}
```

**Features:**
- Face ID (iOS)
- Touch ID (iOS)
- Fingerprint (Android)
- Graceful fallback if unavailable

---

## Dependencies

### Core
- `expo` ~51.0.28 - Expo SDK
- `react-native` 0.74.5 - React Native core
- `expo-router` ~3.5.23 - File-based navigation

### Native APIs
- `expo-local-authentication` ~14.0.1 - Biometric auth
- `expo-location` ~17.0.1 - Geolocation
- `expo-notifications` ~0.28.16 - Push notifications
- `expo-secure-store` ~13.0.2 - Secure key storage
- `expo-haptics` ~13.0.1 - Haptic feedback

### UI/Graphics
- `react-native-svg` 15.2.0 - SVG rendering (icons)
- `react-native-maps` 1.14.0 - Map views
- `expo-linear-gradient` ~13.0.2 - Gradients

### State Management
- `zustand` ^4.5.2 - Global state management

---

## Local Conventions

### File Structure
- Expo Router file-based routing (no manual route config)
- Tab layout in `app/(tabs)/` directory
- Shared components in `src/components/`
- Hooks in `src/hooks/`
- Design tokens in `src/styles/`

### Styling Patterns
- Use design tokens from `src/styles/tokens.ts`
- StyleSheet.create for performance
- Theme provider for consistent colors

### Navigation
- Use `<Link>` from `expo-router` for navigation
- Use `useRouter()` hook for programmatic navigation
- Tab bar uses botanical icons (never Expo vector icons)

### Icons
- Always use Vlossom botanical icons (never `@expo/vector-icons`)
- Icons must have semantic meaning, not decoration
- Orange accent only for growth/celebration moments

---

## Gotchas

### Biometric Auth
- Always check `isAvailable` before calling `authenticate()`
- Provide fallback PIN/password option
- Handle user cancellation gracefully

### Tab Navigation
- Tab bar icons must be botanical (VlossomHome, etc.)
- Active tab should use primary color
- Inactive tabs should use muted color

### Design Tokens
- Always use tokens from `src/styles/tokens.ts`, never hardcoded values
- Tokens must match web app exactly
- Orange is SACRED - only for growth/celebration, not errors

### Performance
- Use `React.memo` for icon components
- Optimize image sizes (use `expo-image` for lazy loading)
- Test on low-end Android devices

---

## Next Steps (V6.1+)

### API Integration
- Connect to `services/api` endpoints
- Add React Query for data fetching
- Wire up wallet, bookings, profile screens

### Wallet Screen
- Biometric unlock for wallet access
- Display balance (fiat-first: ZAR → USDC)
- Send/receive USDC flows
- Transaction history

### Discovery Screen
- Nearby stylists map view (react-native-maps)
- Stylist cards with ratings
- Filter by service, price, distance
- Booking flow (mobile-optimized)

### Notifications
- Push notification permissions
- In-app notification list
- Real-time booking updates via WebSocket

### Profile Screen
- User profile display/edit
- Role switcher (customer/stylist)
- Settings page
- Logout flow

---

## Canonical References
- [Doc 15: Frontend UX Flows](../../docs/vlossom/15-frontend-ux-flows.md)
- [Doc 16: UI Components and Design System](../../docs/vlossom/16-ui-components-and-design-system.md)
- [STYLE_BLUEPRINT](../../docs/STYLE_BLUEPRINT.md) - Visual system
- [ICONOGRAPHY_REPORT](../../design/brand/icons/ICONOGRAPHY_REPORT.md) - Icon library
- [Web App CLAUDE.md](../web/CLAUDE.md) - Web app reference

---

## Scripts

```bash
# Start development server
npm run dev

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Build for production
npm run build:ios
npm run build:android

# Type checking
npm run typecheck

# Linting
npm run lint
```
