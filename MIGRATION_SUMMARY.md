# Admin Pages Lucide to Phosphor Icons Migration Summary

## Migration Status

### Completed Files (100%)

1. **apps/web/app/admin/properties/page.tsx** ✅
   - Replaced all 15 icon instances
   - Search, RefreshCw, Building, MapPin, Check, X, Eye, MoreVertical, Clock, CheckCircle, XCircle
   - Mappings: RefreshCw→settings, Building→location, MapPin→location, CheckCircle→success, XCircle→cancelled, MoreVertical→more, Eye→visible

2. **apps/web/app/admin/users/page.tsx** ✅
   - Replaced all 9 icon instances
   - Search, ChevronLeft, ChevronRight, User, RefreshCw, MoreVertical, UserX, UserCheck, Eye, AlertTriangle
   - Mappings: User→profile, UserX→close, UserCheck→check, AlertTriangle→calmError

3. **apps/web/app/admin/paymaster/page.tsx** ✅
   - Replaced RefreshCw→settings (1 instance)

4. **apps/web/app/admin/disputes/page.tsx** ✅
   - Replaced all 9 icon instances
   - AlertTriangle, Search, Filter, ChevronRight, Clock, User, Calendar, RefreshCw
   - Mappings: AlertTriangle→calmError, Filter→search, User→profile, Calendar→calendar, ChevronRight→chevronRight

### Partially Completed Files (Import Updated, Need Icon Replacements)

5. **apps/web/app/admin/disputes/[id]/page.tsx** 🟡
   - Import updated to use Icon bridge
   - Still needs replacement of remaining ~30 icon instances throughout the file
   - Icons to replace: ArrowLeft, AlertTriangle, FileText, MessageSquare, Send, CheckCircle, XCircle, AlertCircle, ExternalLink, Calendar, Clock

### Pending Files (Not Started)

6. **apps/web/app/admin/finance/page.tsx** ⏳
   - Icons: DollarSign, TrendingUp, TrendingDown, Clock, ArrowUpRight, ArrowDownRight, RefreshCw, Wallet, PiggyBank, CreditCard, AlertTriangle, CheckCircle, XCircle

7. **apps/web/app/admin/defi/page.tsx** ⏳
   - Icons: RefreshCw, Settings, TrendingUp, AlertTriangle, PauseCircle, PlayCircle, DollarSign, Users, Percent, Activity, Loader2

8. **apps/web/app/admin/bookings/page.tsx** ⏳
   - Icons: Search, ChevronLeft, ChevronRight, RefreshCw, Calendar, DollarSign

## Icon Mapping Reference

| Lucide Icon | Phosphor Icon (via Bridge) | Size Mapping |
|-------------|---------------------------|--------------|
| Search | `search` | h-4 w-4 → sm |
| RefreshCw | `settings` (with animate-spin) | h-4 w-4 → sm |
| ChevronLeft/Right | `chevronLeft`/`chevronRight` | h-5 w-5 → md |
| Building/MapPin | `location` | h-5 w-5 → md |
| User/Users | `profile` | h-4 w-4 → sm |
| Calendar | `calendar` | h-4 w-4 → sm |
| DollarSign/Wallet | `wallet` or `currency` | h-4 w-4 → sm |
| AlertTriangle/AlertCircle | `calmError` or `error` | h-4 w-4 → sm |
| Check/CheckCircle | `check`/`success` | h-4 w-4 → sm |
| X/XCircle | `close`/`cancelled` | h-4 w-4 → sm |
| Eye | `visible` | h-4 w-4 → sm |
| Clock | `clock` | h-4 w-4 → sm |
| MoreVertical | `more` | h-4 w-4 → sm |
| Filter | `search` | h-4 w-4 → sm |
| TrendingUp | `growing` | h-6 w-6 → md |
| TrendingDown | `declining` | h-6 w-6 → md |
| ArrowLeft | `back` | h-4 w-4 → sm |
| Send | `send` | h-4 w-4 → sm |
| FileText | `receipt` | h-5 w-5 → md |
| MessageSquare | `chat` | h-5 w-5 → md |
| ExternalLink | `external` | h-3 w-3 → sm |
| Shield | `trusted` | h-4 w-4 → sm |
| Loader2 | `clock` (with animate-spin) | h-4 w-4 → sm |
| Settings | `settings` | h-4 w-4 → sm |
| PauseCircle/PlayCircle | `clock` | h-5 w-5 → md |
| Activity/Percent | `info` | h-4 w-4 → sm |
| PiggyBank/CreditCard | `wallet`/`payment` | h-6 w-6 → md |

## Migration Pattern

### Before
```typescript
import { Search, RefreshCw, User } from "lucide-react";

<Search className="w-4 h-4 text-gray-400" />
<RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
<User className="h-5 w-5 text-gray-400" />
```

### After
```typescript
import { Icon, type IconName } from "@/components/icons";

<Icon name="search" size="sm" className="text-gray-400" />
<Icon name="settings" size="sm" className={isRefreshing ? "animate-spin" : ""} />
<Icon name="profile" size="md" className="text-gray-400" />
```

## Completion Status

- ✅ Completed: 4/8 files (50%)
- 🟡 Partial: 1/8 files (12.5%)
- ⏳ Pending: 3/8 files (37.5%)

## Next Steps

1. Complete disputes/[id]/page.tsx icon replacements (~30 instances)
2. Migrate finance/page.tsx (~13 icon types, multiple instances)
3. Migrate defi/page.tsx (~11 icon types, multiple instances)
4. Migrate bookings/page.tsx (~6 icon types, multiple instances)
5. Test all admin pages to verify icons render correctly
6. Remove lucide-react dependency if no longer used elsewhere

## Notes

- All size mappings follow: `w-3 h-3` → sm, `w-4 h-4` → sm, `w-5 h-5` → md, `w-6 h-6` → md, `w-8 h-8` → lg, `w-12 h-12` → 2xl
- Loading spinners use `animate-spin` className with appropriate icon
- Icon bridge system provides type safety with `IconName` type
- All icon names are lowercase with camelCase for multi-word names
