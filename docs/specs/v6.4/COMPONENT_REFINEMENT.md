# Component-by-Component Refinement Guide

> **Version**: 6.4.0
> **Purpose**: Detailed implementation specifications for each UI component
> **Companion to**: `STYLING_SPEC.md`
> **Last Updated**: December 18, 2025

---

## How to Use This Document

This guide provides **exact specifications** for each component. For each component you'll find:

1. **Anatomy** - What elements make up the component
2. **Variants** - Different visual states and configurations
3. **Tokens** - Exact values for colors, spacing, typography
4. **States** - Interactive states (hover, focus, disabled, etc.)
5. **Code Example** - Reference implementation
6. **Checklist** - Verification points

---

## Navigation Components

### 1. Bottom Navigation Bar

**Context**: Primary mobile navigation, always visible, 5 tabs

#### Anatomy
```
┌─────────────────────────────────────────────────┐
│  [Icon]    [Icon]    [Icon]    [Icon]    [Icon] │
│  Label     Label     Label     Label     Label  │
└─────────────────────────────────────────────────┘
     ↑          ↑         ↑         ↑         ↑
   Home     Calendar   Search    Wallet    Profile
```

#### Tokens

| Property | Value |
|----------|-------|
| Height | 80px (plus safe-area-bottom) |
| Background | `surface.elevated` |
| Border | 1px top, `border.subtle` |
| Shadow | `shadow-vlossom-soft` |
| Icon size | 24px (`size="lg"`) |
| Icon weight | `light` (inactive), `fill` (active) |
| Label font | `text-caption` (12px) |
| Active color | `primary.default` |
| Inactive color | `text.muted` |
| Tap target | 64px × 64px minimum |

#### Tab Items

| Tab | Icon Name | Label |
|-----|-----------|-------|
| Home | `home` | Home |
| Calendar | `calendar` | Rituals |
| Search | `search` | Discover |
| Wallet | `wallet` | Wallet |
| Profile | `profile` | Profile |

#### States

```tsx
// Inactive tab
<div className="
  flex flex-col items-center justify-center
  w-16 h-16
  text-text-muted
  transition-colors duration-150
">
  <Icon name="home" size="lg" weight="light" />
  <span className="text-caption mt-1">Home</span>
</div>

// Active tab
<div className="
  flex flex-col items-center justify-center
  w-16 h-16
  text-primary
">
  <Icon name="home" size="lg" weight="fill" />
  <span className="text-caption mt-1 font-medium">Home</span>
</div>
```

#### Animation

- Tab switch: 200ms `ease-settle`
- Icon weight transition: instant (no animation on weight change)
- Active indicator: subtle scale(1.02) on active icon

#### Checklist

- [ ] Icons use semantic names from icon system
- [ ] Active tab uses `fill` weight
- [ ] Safe area padding applied at bottom
- [ ] Tap targets exceed 44px
- [ ] No color outside primary/muted palette

---

### 2. Desktop Top Navigation

**Context**: Desktop-only (lg+), replaces bottom nav

#### Anatomy
```
┌──────────────────────────────────────────────────────────────────┐
│  [Logo]    Home  Rituals  Discover  Wallet  Profile   [Avatar]  │
└──────────────────────────────────────────────────────────────────┘
```

#### Tokens

| Property | Value |
|----------|-------|
| Height | 64px |
| Background | `surface.elevated` |
| Border | 1px bottom, `border.subtle` |
| Logo size | 32px height |
| Nav item gap | 32px (`gap-8`) |
| Active indicator | 2px bottom border, `primary` |
| Padding | 32px horizontal (`px-8`) |

#### Code Example

```tsx
<nav className="
  hidden lg:flex
  fixed top-0 left-0 right-0
  h-16
  items-center justify-between
  px-8
  bg-surface-elevated
  border-b border-border-subtle
  z-sticky
">
  {/* Logo */}
  <Logo className="h-8" />

  {/* Nav Items */}
  <div className="flex items-center gap-8">
    {navItems.map(item => (
      <NavLink
        key={item.href}
        href={item.href}
        className={cn(
          "text-body font-medium transition-colors",
          "hover:text-primary",
          isActive ? "text-primary border-b-2 border-primary pb-1" : "text-text-secondary"
        )}
      >
        {item.label}
      </NavLink>
    ))}
  </div>

  {/* User Menu */}
  <Avatar className="h-10 w-10 cursor-pointer">
    <AvatarImage src={user.avatar} />
    <AvatarFallback>{user.initials}</AvatarFallback>
  </Avatar>
</nav>
```

---

### 3. Page Header

**Context**: Top of each page, title + optional actions

#### Anatomy
```
┌──────────────────────────────────────────────────┐
│  [Back]  Page Title                     [Action] │
│          Subtitle (optional)                     │
└──────────────────────────────────────────────────┘
```

#### Tokens

| Property | Value |
|----------|-------|
| Padding | 16px horizontal, 12px vertical |
| Title font | `font-display text-h2` |
| Subtitle font | `text-caption text-text-secondary` |
| Back button size | 44px × 44px |
| Action button size | 44px × 44px |

#### Code Example

```tsx
<header className="flex items-center justify-between px-4 py-3">
  {/* Back button (optional) */}
  {showBack && (
    <Button
      variant="ghost"
      size="icon"
      onClick={onBack}
      aria-label="Go back"
    >
      <Icon name="back" />
    </Button>
  )}

  {/* Title block */}
  <div className={cn("flex-1", showBack && "ml-2")}>
    <h1 className="font-display text-h2 text-text-primary">
      {title}
    </h1>
    {subtitle && (
      <p className="text-caption text-text-secondary">{subtitle}</p>
    )}
  </div>

  {/* Action (optional) */}
  {action && (
    <Button variant="ghost" size="icon" aria-label={action.label}>
      <Icon name={action.icon} />
    </Button>
  )}
</header>
```

---

## Content Components

### 4. Booking Card

**Context**: Displays upcoming or past booking

#### Anatomy
```
┌────────────────────────────────────────────────┐
│  [Status Badge]                     [Overflow] │
│                                                │
│  [Avatar]  Stylist Name                        │
│            Service Type                        │
│                                                │
│  [Calendar Icon]  Date & Time                  │
│  [Location Icon]  Location                     │
│                                                │
│  [Secondary CTA]  [Primary CTA]                │
└────────────────────────────────────────────────┘
```

#### Tokens

| Property | Value |
|----------|-------|
| Background | `surface.default` |
| Border radius | 16px (`rounded-card`) |
| Shadow | `shadow-vlossom` |
| Padding | 24px (`p-6`) |
| Avatar size | 48px |
| Icon size | 16px (`sm`) |
| Gap between sections | 16px (`gap-4`) |

#### Status Badge Variants

| Status | Background | Text | Icon |
|--------|------------|------|------|
| Confirmed | `success/10` | `success` | `success` |
| Pending | `warning/10` | `warning` | `clock` |
| Cancelled | `error/10` | `error` | `cancelled` |
| Completed | `primary/10` | `primary` | `check` |

#### Code Example

```tsx
<Card className="shadow-vlossom">
  <CardHeader className="p-6 pb-0">
    <div className="flex items-center justify-between">
      <Badge variant="success">
        <Icon name="success" size="xs" className="mr-1" />
        Confirmed
      </Badge>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Icon name="more" size="sm" />
      </Button>
    </div>
  </CardHeader>

  <CardContent className="p-6 space-y-4">
    {/* Stylist */}
    <div className="flex items-center gap-3">
      <Avatar className="h-12 w-12">
        <AvatarImage src={booking.stylist.avatar} />
        <AvatarFallback>{booking.stylist.initials}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-body font-medium text-text-primary">
          {booking.stylist.name}
        </p>
        <p className="text-caption text-text-secondary">
          {booking.service}
        </p>
      </div>
    </div>

    {/* Details */}
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-text-secondary">
        <Icon name="calendar" size="sm" />
        <span className="text-caption">
          {formatDate(booking.date)} at {formatTime(booking.time)}
        </span>
      </div>
      <div className="flex items-center gap-2 text-text-secondary">
        <Icon name="location" size="sm" />
        <span className="text-caption">{booking.location}</span>
      </div>
    </div>
  </CardContent>

  <CardFooter className="p-6 pt-0 flex gap-3">
    <Button variant="outline" className="flex-1">Reschedule</Button>
    <Button variant="primary" className="flex-1">View Details</Button>
  </CardFooter>
</Card>
```

#### Hover State

```css
.booking-card {
  transition: transform 150ms ease-settle, box-shadow 150ms ease-settle;
}
.booking-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-elevated);
}
```

---

### 5. Stylist Card (Discovery)

**Context**: Search results, stylist listings

#### Anatomy
```
┌────────────────────────────────────────────────┐
│  ┌──────────────┐                              │
│  │   [Image]    │   Name               [Heart] │
│  │              │   Rating ★ 4.8 (123)         │
│  └──────────────┘   Starting from R299         │
│                                                │
│  [Badge] [Badge] [Badge]                       │
│                                                │
│  [View Profile Button]                         │
└────────────────────────────────────────────────┘
```

#### Tokens

| Property | Value |
|----------|-------|
| Background | `surface.default` |
| Border radius | 16px |
| Shadow | `shadow-vlossom` |
| Image size | 80px × 80px |
| Image radius | 12px |
| Rating star | `status.warning` (amber) |
| Price font | `font-mono tabular-nums` |

#### Code Example

```tsx
<Card className="shadow-vlossom">
  <CardContent className="p-6">
    <div className="flex gap-4">
      {/* Avatar/Image */}
      <img
        src={stylist.image}
        alt={stylist.name}
        className="w-20 h-20 rounded-lg object-cover shrink-0"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <h3 className="text-body font-semibold text-text-primary truncate">
            {stylist.name}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Icon
              name="favorite"
              weight={isFavorite ? "fill" : "light"}
              className={isFavorite ? "text-accent" : "text-text-muted"}
            />
          </Button>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1">
          <Icon name="star" size="sm" weight="fill" className="text-status-warning" />
          <span className="text-caption font-medium">{stylist.rating}</span>
          <span className="text-caption text-text-muted">
            ({stylist.reviewCount})
          </span>
        </div>

        {/* Price */}
        <p className="text-caption text-text-secondary mt-1">
          Starting from{" "}
          <span className="font-mono tabular-nums font-medium text-text-primary">
            R{stylist.startingPrice}
          </span>
        </p>
      </div>
    </div>

    {/* Specialties */}
    <div className="flex flex-wrap gap-2 mt-4">
      {stylist.specialties.slice(0, 3).map(specialty => (
        <Badge key={specialty} variant="outline" className="text-xs">
          {specialty}
        </Badge>
      ))}
    </div>
  </CardContent>

  <CardFooter className="p-6 pt-0">
    <Button variant="outline" className="w-full">View Profile</Button>
  </CardFooter>
</Card>
```

---

### 6. Wallet Balance Card

**Context**: Main wallet display, hero position

#### Anatomy
```
┌────────────────────────────────────────────────┐
│  Your Balance                                  │
│                                                │
│  R 12,450.00                                   │
│  ≈ $690.28 USD                                 │
│                                                │
│  [+23.5% this month]            [Eye Toggle]   │
│                                                │
│  [Add Funds]  [Send]  [History]                │
└────────────────────────────────────────────────┘
```

#### Tokens

| Property | Value |
|----------|-------|
| Background | `primary.default` |
| Text | `text.inverse` (white) |
| Border radius | 24px (`rounded-xl`) |
| Padding | 32px (`p-8`) |
| Balance font | `font-mono text-h1 tabular-nums` |
| Label font | `font-display text-body` |
| Secondary amount | `font-mono text-caption` |
| Growth indicator | `text-tertiary` (green) |

#### Code Example

```tsx
<div className="
  bg-primary
  rounded-xl
  p-8
  text-white
  relative
  overflow-hidden
">
  {/* Background decoration (subtle) */}
  <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
  <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/5" />

  <div className="relative z-10">
    {/* Label */}
    <span className="font-display text-body text-white/80">
      Your Balance
    </span>

    {/* Primary Amount */}
    <div className="flex items-baseline gap-2 mt-2">
      <span className="font-mono text-h1 tabular-nums">
        {balanceVisible ? formatCurrency(balance) : "••••••"}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-white/60 hover:text-white"
        onClick={toggleVisibility}
        aria-label={balanceVisible ? "Hide balance" : "Show balance"}
      >
        <Icon name={balanceVisible ? "visible" : "hidden"} size="sm" />
      </Button>
    </div>

    {/* Secondary Amount */}
    <span className="font-mono text-caption text-white/60 tabular-nums">
      ≈ {formatUSD(balanceUSD)} USD
    </span>

    {/* Growth Indicator */}
    <div className="flex items-center gap-1 mt-4">
      <Icon name="growing" size="sm" className="text-tertiary" />
      <span className="text-caption text-tertiary font-medium">
        +23.5% this month
      </span>
    </div>
  </div>

  {/* Quick Actions */}
  <div className="flex gap-3 mt-6 relative z-10">
    <Button
      variant="secondary"
      className="flex-1 bg-white/10 hover:bg-white/20 text-white border-0"
    >
      <Icon name="add" size="sm" className="mr-2" />
      Add Funds
    </Button>
    <Button
      variant="secondary"
      className="flex-1 bg-white/10 hover:bg-white/20 text-white border-0"
    >
      <Icon name="share" size="sm" className="mr-2" />
      Send
    </Button>
  </div>
</div>
```

---

### 7. Transaction Item

**Context**: Wallet history list item

#### Anatomy
```
┌────────────────────────────────────────────────┐
│  [Icon]  Transaction Title         +R 250.00   │
│          Timestamp                  Completed   │
└────────────────────────────────────────────────┘
```

#### Tokens

| Property | Value |
|----------|-------|
| Padding | 16px (`p-4`) |
| Icon container | 40px × 40px, `rounded-full`, `primary/10` |
| Amount positive | `text-status-success` |
| Amount negative | `text-text-primary` |
| Timestamp | `font-mono text-caption text-text-muted` |

#### Transaction Types

| Type | Icon | Background |
|------|------|------------|
| Deposit | `add` | `success/10` |
| Withdrawal | `share` | `primary/10` |
| Payment | `payment` | `primary/10` |
| Refund | `receipt` | `success/10` |

#### Code Example

```tsx
<div className="flex items-center gap-3 p-4 hover:bg-surface/80 transition-colors rounded-lg">
  {/* Icon */}
  <div className={cn(
    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
    transaction.type === 'deposit' ? "bg-status-success/10" : "bg-primary/10"
  )}>
    <Icon
      name={getTransactionIcon(transaction.type)}
      size="md"
      className={transaction.type === 'deposit' ? "text-status-success" : "text-primary"}
    />
  </div>

  {/* Details */}
  <div className="flex-1 min-w-0">
    <p className="text-body font-medium text-text-primary truncate">
      {transaction.title}
    </p>
    <span className="text-caption text-text-muted font-mono tabular-nums">
      {formatDateTime(transaction.timestamp)}
    </span>
  </div>

  {/* Amount */}
  <div className="text-right shrink-0">
    <p className={cn(
      "text-body font-mono tabular-nums font-medium",
      transaction.amount > 0 ? "text-status-success" : "text-text-primary"
    )}>
      {transaction.amount > 0 ? "+" : ""}{formatCurrency(transaction.amount)}
    </p>
    <Badge variant={transaction.status === 'completed' ? 'success' : 'outline'} className="text-xs">
      {transaction.status}
    </Badge>
  </div>
</div>
```

---

### 8. Notification Item

**Context**: Notification list

#### Anatomy
```
┌────────────────────────────────────────────────┐
│  [Icon]  Notification Title              [Dot] │
│          Message preview (2 lines max)         │
│          2h ago                                │
└────────────────────────────────────────────────┘
```

#### Tokens

| Property | Value |
|----------|-------|
| Padding | 16px (`p-4`) |
| Icon container | 40px × 40px, `rounded-full` |
| Unread indicator | 8px × 8px, `primary`, `rounded-full` |
| Message lines | 2 max (`line-clamp-2`) |
| Timestamp | `font-mono text-caption text-text-muted` |

#### Notification Types

| Type | Icon | Background | Description |
|------|------|------------|-------------|
| Booking | `calendar` | `primary/10` | Booking updates |
| Reminder | `clock` | `warning/10` | Upcoming reminders |
| Success | `success` | `success/10` | Completions |
| Payment | `wallet` | `primary/10` | Payment updates |
| System | `info` | `info/10` | System messages |

#### Code Example

```tsx
<div className={cn(
  "flex items-start gap-3 p-4 rounded-lg transition-colors cursor-pointer",
  isUnread ? "bg-surface" : "hover:bg-surface/50"
)}>
  {/* Icon */}
  <div className={cn(
    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
    getNotificationBg(notification.type)
  )}>
    <Icon
      name={getNotificationIcon(notification.type)}
      size="md"
      className={getNotificationColor(notification.type)}
    />
  </div>

  {/* Content */}
  <div className="flex-1 min-w-0">
    <p className="text-body font-medium text-text-primary">
      {notification.title}
    </p>
    <p className="text-caption text-text-secondary line-clamp-2 mt-0.5">
      {notification.message}
    </p>
    <span className="text-caption text-text-muted font-mono tabular-nums mt-1 block">
      {formatRelativeTime(notification.timestamp)}
    </span>
  </div>

  {/* Unread indicator */}
  {isUnread && (
    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
  )}
</div>
```

---

## Form Components

### 9. Text Input

#### Anatomy
```
┌────────────────────────────────────────────────┐
│  Label                                         │
│  ┌──────────────────────────────────────────┐ │
│  │ [Icon]  Placeholder text                  │ │
│  └──────────────────────────────────────────┘ │
│  Helper text or error message                  │
└────────────────────────────────────────────────┘
```

#### Tokens

| Property | Value |
|----------|-------|
| Height | 44px (`h-11`) |
| Padding | 16px horizontal (`px-4`) |
| Border radius | 12px (`rounded-input`) |
| Border | 1px, `border.default` |
| Label | `text-caption font-medium` |
| Placeholder | `text-text-muted` |
| Focus ring | 2px, `primary`, 2px offset |

#### States

| State | Border | Background | Ring |
|-------|--------|------------|------|
| Default | `border.default` | `background.primary` | none |
| Focus | `primary` | `background.primary` | 2px primary |
| Error | `status.error` | `background.primary` | 2px error |
| Disabled | `border.subtle` | `background.tertiary` | none |

#### Code Example

```tsx
<div className="space-y-2">
  <Label htmlFor="email" className="text-caption font-medium text-text-primary">
    Email Address
  </Label>
  <div className="relative">
    {leftIcon && (
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        <Icon name={leftIcon} size="sm" className="text-text-muted" />
      </div>
    )}
    <Input
      id="email"
      type="email"
      placeholder="you@example.com"
      className={cn(
        "h-11 px-4 rounded-input border bg-background-primary",
        "text-body placeholder:text-text-muted",
        "focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        leftIcon && "pl-11",
        hasError && "border-status-error focus:ring-status-error"
      )}
    />
  </div>
  {helperText && (
    <p className={cn(
      "text-caption",
      hasError ? "text-status-error" : "text-text-muted"
    )}>
      {helperText}
    </p>
  )}
</div>
```

---

### 10. Select/Dropdown

#### Anatomy
```
┌────────────────────────────────────────────────┐
│  Label                                         │
│  ┌──────────────────────────────────────────┐ │
│  │  Selected value               [Chevron]   │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ Option 1                                  │ │
│  │ Option 2                           [Check]│ │
│  │ Option 3                                  │ │
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

#### Tokens

| Property | Value |
|----------|-------|
| Trigger height | 44px |
| Trigger padding | 16px horizontal |
| Trigger radius | 12px |
| Dropdown shadow | `shadow-vlossom-elevated` |
| Dropdown radius | 12px |
| Option padding | 12px horizontal, 10px vertical |
| Option hover | `surface.default` |

#### Code Example

```tsx
<div className="space-y-2">
  <Label className="text-caption font-medium text-text-primary">
    Service Type
  </Label>
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="
      h-11 px-4
      rounded-input
      border border-border-default
      bg-background-primary
      text-body
      focus:ring-2 focus:ring-primary focus:ring-offset-2
    ">
      <SelectValue placeholder="Select a service" />
      <Icon name="chevronDown" size="sm" className="text-text-muted" />
    </SelectTrigger>

    <SelectContent className="
      bg-surface-elevated
      rounded-lg
      shadow-vlossom-elevated
      border border-border-subtle
      overflow-hidden
      animate-unfold-vertical
    ">
      {options.map(option => (
        <SelectItem
          key={option.value}
          value={option.value}
          className="
            px-4 py-2.5
            text-body
            cursor-pointer
            hover:bg-surface
            focus:bg-surface
            transition-colors
          "
        >
          <span className="flex items-center justify-between w-full">
            {option.label}
            {value === option.value && (
              <Icon name="check" size="sm" className="text-primary" />
            )}
          </span>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

---

## Feedback Components

### 11. Toast Notification

#### Anatomy
```
┌────────────────────────────────────────────────┐
│  [Icon]  Toast message            [Close]      │
│          Action link (optional)                │
└────────────────────────────────────────────────┘
```

#### Tokens

| Property | Value |
|----------|-------|
| Background | `surface.elevated` |
| Shadow | `shadow-vlossom-elevated` |
| Border radius | 12px |
| Padding | 16px |
| Max width | 400px |
| Animation | `animate-slideInUp` |

#### Variants

| Variant | Icon | Accent Color |
|---------|------|--------------|
| Default | `info` | `primary` |
| Success | `success` | `status.success` |
| Warning | `calmError` | `status.warning` |
| Error | `error` | `status.error` |

#### Code Example

```tsx
<div className="
  fixed bottom-24 left-4 right-4
  max-w-md mx-auto
  bg-surface-elevated
  rounded-lg
  shadow-vlossom-elevated
  p-4
  flex items-start gap-3
  animate-slideInUp
  z-toast
">
  {/* Icon */}
  <div className={cn(
    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
    variantStyles[variant].bg
  )}>
    <Icon
      name={variantStyles[variant].icon}
      size="sm"
      className={variantStyles[variant].text}
    />
  </div>

  {/* Content */}
  <div className="flex-1 min-w-0">
    <p className="text-body font-medium text-text-primary">
      {message}
    </p>
    {action && (
      <button
        onClick={action.onClick}
        className="text-caption text-primary font-medium mt-1 hover:underline"
      >
        {action.label}
      </button>
    )}
  </div>

  {/* Close */}
  <Button
    variant="ghost"
    size="icon"
    className="h-8 w-8 shrink-0"
    onClick={onClose}
    aria-label="Dismiss"
  >
    <Icon name="close" size="sm" />
  </Button>
</div>
```

---

### 12. Empty State

#### Anatomy
```
┌────────────────────────────────────────────────┐
│                                                │
│              [Illustration]                    │
│                                                │
│              Empty State Title                 │
│       Description text explaining the          │
│       empty state and what to do next.         │
│                                                │
│              [Primary Action]                  │
│                                                │
└────────────────────────────────────────────────┘
```

#### Tokens

| Property | Value |
|----------|-------|
| Illustration size | 128px (md), 160px (lg) |
| Title font | `text-h3 font-semibold` |
| Description font | `text-body text-text-secondary` |
| Padding | 48px vertical (`py-12`) |
| Max width | 320px (text container) |

#### Presets

| Preset | Icon | Title |
|--------|------|-------|
| `noBookings` | `calendar` | No Rituals Yet |
| `noNotifications` | `notifications` | All Caught Up |
| `noSearchResults` | `search` | No Results Found |
| `noTransactions` | `wallet` | No Transactions |
| `networkError` | `error` | Connection Lost |

#### Code Example

```tsx
<div className="flex flex-col items-center justify-center py-12 px-6 text-center">
  {/* Illustration */}
  <div className="
    w-32 h-32
    rounded-full
    bg-surface
    flex items-center justify-center
    mb-6
  ">
    <Icon name="calendar" size="2xl" className="text-text-muted" />
  </div>

  {/* Title */}
  <h3 className="text-h3 font-semibold text-text-primary mb-2">
    No Rituals Yet
  </h3>

  {/* Description */}
  <p className="text-body text-text-secondary max-w-xs mb-6">
    Your hair journey begins with a single ritual.
    Book your first session and start growing.
  </p>

  {/* Action */}
  <Button variant="primary">
    <Icon name="search" size="sm" className="mr-2" />
    Find a Stylist
  </Button>
</div>
```

---

### 13. Skeleton Loader

#### Tokens

| Property | Value |
|----------|-------|
| Background | `border.default` |
| Animation | `animate-shimmer` |
| Border radius | Match target element |

#### Code Example

```tsx
// Text skeleton
<Skeleton className="h-4 w-3/4 rounded-md" />

// Avatar skeleton
<Skeleton className="h-12 w-12 rounded-full" />

// Card skeleton
<div className="p-6 space-y-4">
  <div className="flex items-center gap-3">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  </div>
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-2/3" />
</div>

// Implementation
const Skeleton = ({ className }) => (
  <div
    className={cn(
      "bg-border-default animate-shimmer",
      "bg-gradient-to-r from-transparent via-white/10 to-transparent",
      "bg-[length:200%_100%]",
      className
    )}
    aria-label="Loading"
  />
);
```

---

## Modal Components

### 14. Bottom Sheet

#### Anatomy
```
┌────────────────────────────────────────────────┐
│                 [Handle]                       │
│                                                │
│  Sheet Title                           [Close] │
│                                                │
│  Sheet content goes here...                    │
│                                                │
│                                                │
│  [Primary Action]                              │
│                                                │
└────────────────────────────────────────────────┘ ← Safe area padding
```

#### Tokens

| Property | Value |
|----------|-------|
| Background | `surface.elevated` |
| Border radius | 24px top (`rounded-t-xl`) |
| Shadow | `shadow-vlossom-modal` |
| Handle | 40px × 4px, `border.default`, `rounded-full` |
| Max height | 85vh |
| Padding bottom | safe-area + 24px |

#### Code Example

```tsx
<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetOverlay className="
    fixed inset-0
    bg-overlay
    animate-fadeIn
  " />

  <SheetContent className="
    fixed bottom-0 left-0 right-0
    bg-surface-elevated
    rounded-t-xl
    shadow-vlossom-modal
    max-h-[85vh]
    overflow-y-auto
    pb-safe
    animate-slideUp
  ">
    {/* Handle */}
    <div className="flex justify-center pt-3 pb-2">
      <div className="w-10 h-1 rounded-full bg-border-default" />
    </div>

    {/* Header */}
    <div className="flex items-center justify-between px-6 pb-4">
      <SheetTitle className="font-display text-h2">
        {title}
      </SheetTitle>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(false)}
        aria-label="Close"
      >
        <Icon name="close" />
      </Button>
    </div>

    {/* Content */}
    <div className="px-6 pb-6">
      {children}
    </div>

    {/* Footer Action */}
    {action && (
      <div className="px-6 pb-6">
        <Button variant="primary" className="w-full" onClick={action.onClick}>
          {action.label}
        </Button>
      </div>
    )}
  </SheetContent>
</Sheet>
```

---

### 15. Dialog/Modal

#### Anatomy
```
┌────────────────────────────────────────────────┐
│                                        [Close] │
│  Dialog Title                                  │
│                                                │
│  Dialog content and form fields...             │
│                                                │
│                                                │
│              [Cancel]  [Confirm]               │
└────────────────────────────────────────────────┘
```

#### Tokens

| Property | Value |
|----------|-------|
| Background | `surface.elevated` |
| Border radius | 24px (`rounded-xl`) |
| Shadow | `shadow-vlossom-modal` |
| Width | 90vw, max 448px |
| Padding | 32px (`p-8`) |
| Animation | `animate-dialogIn` |

#### Code Example

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogOverlay className="
    fixed inset-0
    bg-overlay
    animate-fadeIn
  " />

  <DialogContent className="
    fixed
    top-1/2 left-1/2
    -translate-x-1/2 -translate-y-1/2
    w-[90vw] max-w-md
    bg-surface-elevated
    rounded-xl
    shadow-vlossom-modal
    p-8
    animate-dialogIn
  ">
    {/* Close button */}
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-4 right-4"
      onClick={() => setIsOpen(false)}
      aria-label="Close"
    >
      <Icon name="close" />
    </Button>

    {/* Header */}
    <DialogHeader className="mb-6">
      <DialogTitle className="font-display text-h2">
        {title}
      </DialogTitle>
      {description && (
        <DialogDescription className="text-body text-text-secondary mt-2">
          {description}
        </DialogDescription>
      )}
    </DialogHeader>

    {/* Content */}
    <div className="space-y-4">
      {children}
    </div>

    {/* Footer */}
    <DialogFooter className="flex gap-3 mt-8">
      <Button
        variant="secondary"
        className="flex-1"
        onClick={() => setIsOpen(false)}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        className="flex-1"
        onClick={onConfirm}
      >
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Onboarding Components

### 16. Onboarding Step

#### Anatomy
```
┌────────────────────────────────────────────────┐
│                                                │
│                                                │
│              [Illustration]                    │
│                                                │
│                                                │
│              Welcome Title                     │
│                                                │
│       Description explaining this step         │
│       and what the user will learn.            │
│                                                │
│               ○ ○ ● ○                          │
│                                                │
│              [Continue]                        │
│                                                │
└────────────────────────────────────────────────┘
```

#### Tokens

| Property | Value |
|----------|-------|
| Illustration size | 160px |
| Title font | `font-display text-h1` |
| Description max-width | 320px |
| Progress dots | 8px, gap 8px |
| Active dot | `primary` |
| Inactive dot | `border.default` |
| Animation | `animate-settle` on content |

#### Code Example

```tsx
<div className="
  flex flex-col items-center justify-center
  min-h-screen
  px-6 py-12
  text-center
">
  {/* Illustration */}
  <div className="
    w-40 h-40
    rounded-full
    bg-surface
    flex items-center justify-center
    mb-8
    animate-unfold-subtle
  ">
    <Icon name={stepIcon} size="2xl" className="text-primary" />
  </div>

  {/* Content (animated) */}
  <div className="animate-settle">
    <h1 className="font-display text-h1 text-text-primary mb-4">
      {stepTitle}
    </h1>

    <p className="text-body text-text-secondary max-w-xs mx-auto mb-8">
      {stepDescription}
    </p>
  </div>

  {/* Progress Indicator */}
  <div className="flex gap-2 mb-8">
    {steps.map((_, index) => (
      <div
        key={index}
        className={cn(
          "w-2 h-2 rounded-full transition-colors duration-200",
          index === currentStep ? "bg-primary" : "bg-border-default"
        )}
      />
    ))}
  </div>

  {/* Action */}
  <Button
    variant="primary"
    className="w-full max-w-xs"
    onClick={onContinue}
  >
    {isLastStep ? "Get Started" : "Continue"}
  </Button>

  {/* Skip (optional) */}
  {!isLastStep && (
    <Button
      variant="ghost"
      className="mt-4"
      onClick={onSkip}
    >
      Skip for now
    </Button>
  )}
</div>
```

---

## Component Checklist Summary

Use this checklist for every component you implement:

### Visual
- [ ] Uses semantic color tokens (never hex)
- [ ] Typography follows font pairing rules
- [ ] Spacing follows 4px grid
- [ ] Border radius consistent with component type
- [ ] Shadow level appropriate for elevation
- [ ] Touch targets minimum 44px

### Motion
- [ ] Uses motion verbs (unfold, settle, breathe)
- [ ] Duration matches action type
- [ ] No idle animations
- [ ] Respects reduced motion preference

### Icons
- [ ] Imported from `@/components/icons`
- [ ] Uses semantic names
- [ ] Correct size for context
- [ ] Weight changes for states (light → fill)

### Accessibility
- [ ] Focus states visible
- [ ] aria-labels on icon buttons
- [ ] Color contrast meets AA
- [ ] Screen reader content logical

### States
- [ ] Default state defined
- [ ] Hover state (desktop)
- [ ] Active/pressed state
- [ ] Focus state
- [ ] Disabled state (if applicable)
- [ ] Loading state (if applicable)
- [ ] Error state (if applicable)

---

*This guide is meant to be used alongside `STYLING_SPEC.md`. When implementing a component, reference both documents to ensure complete compliance with the Vlossom design system.*
