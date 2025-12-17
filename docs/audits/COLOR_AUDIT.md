# Color Token Audit Report (V6.0 Design System)

**Date:** December 17, 2025
**Auditor:** Claude Code
**Status:** Complete with Recommendations

---

## Color Governance (Doc 16)

### Primary Colors

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| **Primary Purple** | `#311E6B` | `primary`, `brand-rose`, `brand-purple` | Main CTAs, headers, brand anchor, buttons |
| **Secondary Cream** | `#EFE3D0` | `secondary`, `brand-cream`, `surface-light` | Card backgrounds, soft containers |

### Accent Colors

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| **Accent Orange** | `#FF510D` | `accent`, `brand-orange` | **SACRED** - Growth/celebration only, <8% surface area |
| **Tertiary Green** | `#A9D326` | `tertiary`, `status-success`, `brand-green` | Success states, confirmations |
| **Accent Gold** | (gold variant) | `accent-gold` | Ratings, premium indicators |

### Status Colors

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| **Success** | `#A9D326` | `status-success` | Success states, confirmations |
| **Warning** | `#FF510D` | `status-warning` | **Note:** Should NOT be orange per Doc 16 |
| **Error** | `#D0021B` | `status-error` | Errors, destructive actions |
| **Info** | `#ADA5C4` | `status-info` | Informational states |

---

## Audit Results

### `brand-rose` Token Analysis

**Finding:** `brand-rose` is correctly aliased to Primary Purple (`#311E6B`)

```javascript
// tailwind.config.js line 77
brand: {
  rose: "#311E6B",  // Same as primary (deep purple)
  clay: "#241552",  // Darker shade for hover
}
```

**Status:** COMPLIANT

**Note:** The naming `brand-rose` is historical and doesn't reflect the actual color (purple). Consider renaming to `brand-primary` in a future refactor for clarity.

---

### Accent Orange Usage Analysis

**Finding:** Orange (`#FF510D`) is used in some error/warning contexts where it should be reserved for growth/celebration.

#### Problematic Usages (Should Use `status-error` Instead)

| File | Line | Current Usage | Should Be |
|------|------|---------------|-----------|
| `error-boundary.tsx` | 33-35 | `bg-accent/10`, `text-accent` | `bg-status-error/10`, `text-status-error` |
| `error.tsx` | 21-23 | `bg-accent/10`, `text-accent` | `bg-status-error/10`, `text-status-error` |
| `booking-details.tsx` | 192, 201-202 | `text-accent`, `bg-accent/10` | `text-status-error`, `bg-status-error/10` |
| `cancel-dialog.tsx` | 111-113, 194, 203, 234, 272 | `bg-accent/10`, `text-accent` | `text-status-warning` or `status-error` |
| `payment-step.tsx` | 277, 280, 293, 336-338 | `bg-accent/10`, `text-accent` | `bg-status-error/10`, `text-status-error` |
| `location-selector.tsx` | 140, 221 | `text-accent` | `text-status-warning` |
| `stylist-filters.tsx` | 149 | `text-accent` | `text-brand-rose` (link) |
| `stylists/[id]/page.tsx` | 46-48 | `bg-accent/10`, `text-accent` | `bg-status-error/10`, `text-status-error` |
| `bookings/[id]/page.tsx` | 41-43 | `bg-accent/10`, `text-accent` | `bg-status-error/10`, `text-status-error` |

#### Correct Usages (Growth/Celebration)

| File | Line | Usage | Context |
|------|------|-------|---------|
| `vlossom-icons.tsx` | 239, 322 | `text-accent-orange` (via `accent` prop) | Growth icons |
| Role tabs | - | `text-accent-gold` | Ratings, achievements |
| Event chips | - | `text-accent-gold` | Special events |
| Hair health | - | `text-accent-gold` | Growth indicators |

---

### Recommendations

#### High Priority Fixes

1. **Create Warning Color Token**
   - Define `status-warning-soft` for non-error warnings (use muted amber, not orange)
   - Or use `#FFA500` (muted orange) only for warnings, keep `#FF510D` sacred

2. **Update Error States**
   - Replace all `text-accent` / `bg-accent/10` in error contexts with `text-status-error` / `bg-status-error/10`
   - This affects ~9 files identified above

3. **Document Orange Governance**
   - Add explicit comment in tailwind.config.js about orange being sacred
   - Add to STYLE_BLUEPRINT.md

#### Medium Priority

4. **Consider Renaming**
   - `brand-rose` → `brand-primary` (for clarity)
   - Keep both as aliases during transition

5. **Add Tailwind Plugin**
   - Add custom lint rule to warn on `accent` usage outside growth contexts

---

## Color Token Summary

### Compliant Tokens

| Token | Status |
|-------|--------|
| `primary` | Correct - `#311E6B` |
| `brand-rose` | Correct - aliased to `#311E6B` |
| `brand-clay` | Correct - hover state `#241552` |
| `status-success` | Correct - `#A9D326` |
| `status-error` | Correct - `#D0021B` |
| `accent-gold` | Correct - used for ratings |

### Non-Compliant Usages

| Token | Issue |
|-------|-------|
| `accent` (in error contexts) | Should use `status-error` |
| `status-warning` | Defined as orange, conflicts with "sacred orange" rule |

---

## Action Items

1. [ ] Update ~9 files to use `status-error` instead of `accent` for error states
2. [ ] Consider adding `status-warning-soft` for non-error warnings
3. [ ] Document orange governance in STYLE_BLUEPRINT.md
4. [ ] Add comment to tailwind.config.js about orange being sacred

---

## Conclusion

**`brand-rose` is correctly mapped to Primary Purple** (`#311E6B`), so the main brand color is compliant.

**However, orange (`accent`) is being used for error/warning states** in several places, which violates the Doc 16 rule that orange is "sacred" for growth/celebration only.

The fix is straightforward: replace `accent` with `status-error` in error contexts, and create a separate warning color if needed.
