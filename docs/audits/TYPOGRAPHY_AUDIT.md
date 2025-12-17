# Typography Audit Report (V6.0 Design System)

**Date:** December 17, 2025
**Auditor:** Claude Code
**Status:** Complete

---

## Typography Rules

### Font Assignment
| Font | Tailwind Class | Usage |
|------|---------------|-------|
| **Inter** | `font-sans` (default) | UI text, navigation, labels, data, inputs, buttons, captions |
| **Playfair Display** | `font-display` | Headlines (h1, h2), profile names, celebration moments, editorial text |

### When to Use Playfair Display (`font-display`)
- Page titles (h1)
- Section headings (h2) for main content areas
- Profile names / stylist names
- Booking confirmations / success states
- Service category names
- Editorial / brand moments

### When to Use Inter (default, no class needed)
- Navigation labels
- Button text
- Form labels and inputs
- Data tables
- Captions
- Body text
- Error messages
- Status badges

---

## Audit Results

### Correctly Styled Components

| Component | Element | Status |
|-----------|---------|--------|
| `profile-header.tsx` | h1 (user name) | `font-display` |
| `stylist-profile.tsx` | h1 (stylist name) | `font-display` |
| `booking-dialog.tsx` | h2 (booking title) | `font-display` |
| `booking-details.tsx` | h1 (booking title) | `font-display` |
| `cancel-dialog.tsx` | h2 (dialog title) | `font-display` |
| `service-list.tsx` | h2 (services) | `font-display` |
| `portfolio-gallery.tsx` | h2 (portfolio) | `font-display` |
| `rhythm-strip.tsx` | h3 (calendar) | `font-display` |
| `day-flow.tsx` | h3 (day view) | `font-display` |
| `month-garden.tsx` | h3 (month view) | `font-display` |
| `hair-health/page.tsx` | h2 (health score) | `font-display` |
| `app-header.tsx` | h1 (page title) | `font-display` |
| `booking-sheet.tsx` | h2 (stylist name) | `font-display` |
| `ritual-sheet.tsx` | h2 (ritual title) | `font-display` |
| `layout.tsx` (stylist dashboard) | span (Vlossom brand) | `font-display` |

### Components Needing Review (Lower Priority)

These are internal/support pages that could benefit from `font-display` but are lower priority:

| File | Issue | Priority |
|------|-------|----------|
| `help/wallet/page.tsx` | h1 missing font-display | Low |
| `help/stylists/page.tsx` | h1 missing font-display | Low |
| `help/bookings/page.tsx` | h1 missing font-display | Low |
| `help/security/page.tsx` | h1 missing font-display | Low |
| `help/page.tsx` | h1, h2 missing font-display | Low |
| `help/getting-started/page.tsx` | All headings missing | Low |
| `help/faq/page.tsx` | All headings missing | Low |
| `contact/page.tsx` | h1 missing font-display | Low |

### Admin Pages (Excluded from Audit)

Admin pages (`/admin/*`) use a simpler styling approach with `text-gray-900` for consistency with admin UI patterns. This is intentional - admin dashboards prioritize data density over brand expression.

### Legacy `src/` Directory

Files in `apps/web/src/` use older styling patterns (e.g., `text-vlossom-neutral-900`). These are property owner pages that may need migration in a future phase.

---

## Recommendations

### High Priority (User-Facing)
All main user flows correctly use `font-display` for headings.

### Medium Priority (Support Pages)
Consider updating help/support pages to use `font-display` for consistency, but current styling is acceptable.

### Low Priority (Admin/Legacy)
Admin and legacy pages can remain as-is until a dedicated admin UI refresh.

---

## Typography CSS Variables

Located in `apps/web/app/globals.css`:

```css
:root {
  --font-inter: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-playfair: "Playfair Display", "Times New Roman", serif;
}
```

## Tailwind Configuration

Located in `apps/web/tailwind.config.js`:

```javascript
fontFamily: {
  sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
  display: ["Playfair Display", "Times New Roman", "serif"],
  mono: ["SF Mono", "Fira Code", "Consolas", "monospace"],
}
```

---

## Conclusion

**Typography separation is correctly implemented** across all main user-facing pages. The design system enforces:

- Inter for UI elements (default)
- Playfair Display for editorial/headline moments (`font-display`)

No critical issues found. Minor inconsistencies in support pages are acceptable.
