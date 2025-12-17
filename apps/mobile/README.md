# Vlossom Mobile App (V6.0)

React Native mobile app for the Vlossom Protocol, built with Expo.

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode (for iOS simulator)
- Android: Android Studio (for Android emulator)

### Setup

1. Install dependencies:
   ```bash
   cd apps/mobile
   pnpm install
   ```

2. Download and add fonts to `assets/fonts/`:
   - [Inter](https://fonts.google.com/specimen/Inter) (Regular, Medium, SemiBold, Bold)
   - [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) (Regular, Bold)
   - [Space Mono](https://fonts.google.com/specimen/Space+Mono) (Regular)

3. Start the development server:
   ```bash
   pnpm dev
   ```

4. Open in simulator:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

## Project Structure

```
apps/mobile/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Home (Map)
│   │   ├── search.tsx     # Search & Discovery
│   │   ├── wallet.tsx     # Financial Hub
│   │   ├── notifications.tsx  # Alerts
│   │   └── profile.tsx    # Profile & Dashboards
│   ├── (auth)/            # Authentication screens
│   └── _layout.tsx        # Root layout
├── src/
│   ├── components/
│   │   ├── icons/         # Vlossom botanical icons
│   │   └── ui/            # Shared UI components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities
│   ├── store/             # State management (Zustand)
│   ├── styles/
│   │   ├── tokens.ts      # Design tokens
│   │   └── theme.tsx      # Theme provider
│   └── types/             # TypeScript types
├── assets/
│   ├── fonts/             # Custom fonts
│   └── images/            # Static images
├── app.json               # Expo configuration
└── package.json
```

## Design System

The mobile app uses the same design tokens as the web app:

### Colors
- **Primary Purple**: `#311E6B` - CTAs, headers, brand anchor
- **Accent Orange**: `#FF510D` - SACRED: growth/celebration only
- **Tertiary Green**: `#A9D326` - Success states

### Typography
- **Inter**: UI text, navigation, labels
- **Playfair Display**: Headlines, profile names, editorial moments

### Iconography
All navigation and state icons use the Vlossom botanical icon system. See `src/components/icons/VlossomIcons.tsx`.

## Navigation Structure

5-Tab navigation following Vlossom UX patterns:

| Tab | Purpose | Features |
|-----|---------|----------|
| **Home** | Map-first discovery | Stylist/salon pins, booking overlay |
| **Search** | Intentional exploration | Feed, filters, categories |
| **Wallet** | Financial hub (center) | Balance, DeFi, rewards |
| **Notifications** | Global inbox | Bookings, payments, updates |
| **Profile** | Identity + dashboards | Hair health, role tabs |

## Key Features (V6.0)

- [ ] Biometric authentication (Face ID / Touch ID)
- [ ] Push notifications
- [ ] Offline-first data sync
- [ ] Camera integration (hair photos)
- [ ] Map-based discovery
- [ ] Booking flow
- [ ] Wallet integration

## Building for Production

### iOS
```bash
pnpm build:ios
```

### Android
```bash
pnpm build:android
```

## Environment Variables

Create `.env.local`:
```env
EXPO_PUBLIC_API_URL=https://api.vlossom.xyz
EXPO_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

## Documentation

- [Design System](../../docs/STYLE_BLUEPRINT.md)
- [UX Flows](../../docs/vlossom/15-frontend-ux-flows.md)
- [Component Library](../../docs/vlossom/16-ui-components-and-design-system.md)
- [Iconography Report](../../design/brand/icons/ICONOGRAPHY_REPORT.md)
