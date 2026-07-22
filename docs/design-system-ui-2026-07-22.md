# Rose — Design System & UI

> **Date:** July 22, 2026  
> **Philosophy:** Borderless, spacious, cute, content-first, Instagram-inspired

---

## 1. Design Philosophy

Rose's design system is guided by these principles:

1. **Borderless** — No visible borders on containers. Whitespace and shadow create separation.
2. **Spacious** — Generous padding, large images, comfortable line heights.
3. **Cute** — Soft pink brand color (`oklch(0.64 0.20 355)`), rounded corners (`18px` base), warm off-white background.
4. **Content-first** — Images and videos are the hero. Text, icons, and UI chrome are minimized.
5. **No icons on feed** — The main feed has zero icon buttons. Interactions are text-based (like count text is clickable, not a heart icon).
6. **Instagram-inspired** — Single-column media feed, stories row, profile layout, reel format.

---

## 2. Color System

### Light Theme (Default)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.985 0.002 80)` | Warm off-white page background |
| `--foreground` | `oklch(0.15 0.005 0)` | Near-black text |
| `--muted` | `oklch(0.94 0.004 80)` | Subtle gray for backgrounds |
| `--muted-foreground` | `oklch(0.54 0.008 0)` | Medium gray for secondary text |
| `--accent` | `oklch(0.92 0.005 80)` | Subtle hover state |
| `--brand` | `oklch(0.64 0.20 355)` | **Soft pink** — primary brand color |
| `--brand-hover` | `oklch(0.59 0.22 355)` | Darker pink for hover states |
| `--brand-subtle` | `oklch(0.64 0.20 355 / 0.12)` | Transparent pink for backgrounds |
| `--brand-muted` | `oklch(0.64 0.20 355 / 0.04)` | Barely-there pink |
| `--destructive` | `oklch(0.65 0.20 18)` | Soft coral red for likes |
| `--border` | `oklch(0.90 0.004 80)` | Very subtle border |
| `--surface-base` | Same as `--background` | Card backgrounds |
| `--surface-elevated` | `oklch(1 0 0)` | Pure white for elevated surfaces |
| `--blue` | `oklch(0.58 0.15 250)` | Link blue |
| `--radius` | `1.125rem` (~18px) | Base border radius |

### Dark Theme

Same hue family but inverted luminance. Brand pink stays consistent for cross-theme brand recognition.

### CSS Variables vs Tailwind Classes

All colors are exposed as both CSS custom properties and Tailwind theme tokens. Use `text-foreground`, `bg-surface-base`, `border-border`, `text-brand`, `bg-brand/10` etc.

---

## 3. Typography

### Font Family
- **Body**: System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`)
- **Headings**: `Plus Jakarta Sans` (Google Font, via `--font-heading`)
- **Code/Numbers**: `Geist` (via `--font-geist-sans`)

### Sizes
| Element | Size | Weight |
|---------|------|--------|
| Page title | `18px` (text-lg) | 700 |
| Post display name | `17px` (text-[17px]) | 600 |
| Post body text | `17px` | 400 |
| Caption below image | `14px` | 400 |
| Like count | `14px` | 600 |
| Time on image | `11px` | 500 |
| Sidebar nav item | `15px` | 500 |
| Feed label | `15px` | 500 |
| Meta/secondary | `12-13px` | 400 |

### Line Height
- Body text: `1.6` (generous, readable)
- Post text: `1.65`
- Post textarea: `normal`

---

## 4. Spacing & Layout

### App Layout

```
┌────────────┬──────────────────┬────────────┐
│            │                  │            │
│  Sidebar   │    Main Area     │  Trends    │
│  220px     │    max 660px     │  300px     │
│  sticky    │    flex: 1       │  sticky    │
│  100dvh    │    center        │  100dvh    │
│            │    < 640px: 100% │            │
│            │                  │ < 1024px:  │
│            │                  │   hidden   │
└────────────┴──────────────────┴────────────┘
```

### Key Spacing Values
- **Sidebar padding**: `12px 8px 12px 16px`
- **Feed post padding**: `20px 0` (vertical only — borderless sides)
- **Card border-radius**: `16px` (images), `18px` (base radius), `12px` (nav items)
- **Horizontal page padding**: `16px` (px-4)
- **Gap between posts**: `4px` (margin-top on feed-post + feed-post)

### Breakpoints
| Breakpoint | Behavior |
|------------|----------|
| `< 640px` | Sidebar hidden, mobile nav visible, main full-width |
| `640-1024px` | Sidebar visible, trends hidden |
| `> 1024px` | Full 3-column layout |

---

## 5. Component Library

### 5.1 UI Primitives (`src/components/ui/`)

| Component | Description |
|-----------|-------------|
| `Avatar` | User avatar with size variants (sm, md, lg), optional fallback |
| `Button` | Styled button with variants (primary, secondary, ghost, destructive) |
| `Input` | Text input with focus ring |
| `Skeleton` | Loading skeleton (`FeedCardSkeleton`, pulsing shapes) |

### 5.2 Navigation (`src/components/navigation/`)

| Component | Description |
|-----------|-------------|
| `Sidebar` | Left sidebar with logo, nav items, compose button. Hidden on mobile. |
| `MobileNav` | Bottom tab bar with 5 items + center compose button. Shown on mobile only. |
| `TrendsSidebar` | Right sidebar with search bar, quick links, footer. Hidden below 1024px. |

**Sidebar Nav Items** (`nav-item` class):
- Spacious pill shape (`padding: 10px 14px`, `border-radius: 12px`)
- Scale-down on click (`transform: scale(0.97)`)
- Icon scales up on hover (`transform: scale(1.05)`)
- Active state: bold weight, thicker icon stroke

**Compose Button** (`nav-compose` class):
- Pink pill with subtle shadow (`box-shadow: 0 2px 8px var(--brand-subtle)`)
- Lifts on hover (`translateY(-1px)`)
- Enhanced shadow on hover (`box-shadow: 0 6px 16px var(--brand-subtle)`)

**Nav Entries:**
| Icon | Route | Label |
|------|-------|-------|
| `Home` | `/feed` | Home |
| `Search` | `/search` | Search |
| `Play` | `/reels` | Reels |
| `Bell` | `/notifications` | Notifications (with badge) |
| `LayoutGrid` | `/discover` | Discover |
| `Users` | `/groups` | Groups |
| `Zap` | `/spells` | Spells |
| `Bookmark` | `/bookmarks` | Bookmarks (with count badge) |
| Avatar | `/profile/[handle]` | Profile |
| `Settings` | `/settings` | Settings |

### 5.3 Feed Components (`src/components/feed/`)

| Component | Description |
|-----------|-------------|
| `FeedCard` | Generic post card with author row, text, media, and interaction buttons |
| `ReplyThread` | Recursive thread component with indented replies and connector lines |
| `BlueskyVideoPlayer` | HLS video player with hls.js |
| `FeedSourcePicker` | Dropdown for selecting/saving feed sources |
| `FilterPanel` | Content filter toggles |
| `BookmarkButton` | Bookmark toggle button |
| `ViewModeToggle` | Grid/Classic view toggle |
| `StoriesRow` | Horizontal scrolling story rings |
| `TrendingFeedView` | Dedicated trending feed view |

---

## 6. Key UI Patterns

### 6.1 Post Card (Feed Page)

```
┌──────────────────────────────────┐
│  [avatar]  Display Name          │  ← Compact author row
│                                  │
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │     Large Image/Video      │  │  ← Generous radius (16px)
│  │                    [3h]    │  │  ← Time pill overlay top-right
│  │                            │  │
│  │          [▶]               │  │  ← Play icon for videos
│  └────────────────────────────┘  │
│                                  │
│  1,234 likes                     │  ← Clickable like text
│                                  │
│  Display Name Caption text...    │  ← Clickable caption → thread
└──────────────────────────────────┘
```

**Key design decisions:**
- No heart icon — like count text IS the button
- No comment, share, or repost buttons on feed
- No borders between posts — spacing creates separation
- Time shown as overlay on image, not in header

### 6.2 Feed Image Grid (Search/Discover)

```
┌────────┬────────┬────────┐
│  ┌────┐│  ┌────┐│  ┌────┐│
│  │img ││  │img ││  │img ││
│  │    ││  │    ││  │    ││  ← 3 columns, gap-2
│  │    ││  │    ││  │    ││
│  └────┘│  └────┘│  └────┘│
│   ❤ 42 │  ▶     │  📷 2  │  ← Hover overlay shows author + likes
└────────┴────────┴────────┘
```

**Hover overlay**: Gradient from bottom, shows avatar, author name, and like count. Slides up with `translate-y-2 → translate-y-0` transition.

### 6.3 Reels Player

```
┌────────────────────────────┐
│  [✕]         [Following ▼] │  ← Top bar (close + feed selector)
│                            │
│                            │
│       ┌──────────────┐    │
│       │              │    │
│       │   Video      │    │  ← Full height, rounded corners
│       │   (HLS)      │    │
│       │              │    │
│       └──────────────┘    │
│                            │
│  [avatar] @username        │
│  Caption text...           │  ← Bottom info overlay
│             [❤] [💬]      │  ← Side interaction buttons
└────────────────────────────┘
```

### 6.4 Reply Thread

```
Post (FeedCard)
─────────────────────────────────
│                                │
│  ●── Reply 1                   │  ← brand colored line
│  │                             │
│  │   ●── Reply to Reply 1     │  ← muted line, 16px indent
│  │   │                         │
│  │   │   ●── Deep reply       │  ← accent line, 32px indent
│  │   │   ┌──────────────────┐ │
│  │   │   │ Normal text flow │ │  ← No opacity fade
│  │   │   │ not compressed   │ │
│  │   │   └──────────────────┘ │
│  │                             │
│  │   ●── Another reply        │
│  │                             │
│  ●── Reply 2                   │
│                                │
```

---

## 7. Animation & Motion

### CSS Animations
| Name | Duration | Usage |
|------|----------|-------|
| `fade-up` | 0.4s | Feed item entrance (opacity 0→1, y: 12→0) |
| `story-ring-pulse` | 2s infinite | Active story ring glow |
| `pulse` | — | Loading skeleton pulse |

### Framer Motion (FeedCard)
- Entry: `opacity: 0, y: 12 → opacity: 1, y: 0` (0.3s, easeOut)
- Like animation: Spring physics on heart icon (stiffness: 400, damping: 15)
- Like count: Spring scale animation on count change

### Transition Defaults
- Background color: `0.15s ease`
- Transform: `0.15s ease`
- Box-shadow: `0.2s ease`
- All hover/focus/active states use these timings

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Scrollbar Styling

```css
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 8px; }
```

Scrollbars are deliberately minimal — 3px wide, barely visible.

---

## 9. Image Grid Tile (Reusable Pattern)

Used in Search, Discover, and post grids:

| Property | Value |
|----------|-------|
| Container | `aspect-square`, `rounded-2xl` |
| Image | `object-cover`, `hover:scale-105` (500ms ease-out) |
| Overlay | Gradient `from-black/70 via-black/20 to-transparent` |
| Overlay transition | `opacity 0.3s`, `translate-y-2 → translate-y-0` |
| Video badge | Top-right, `black/40` backdrop-blur, Play icon |
| Multi-image badge | Top-left, same style, Image icon |
