# VOICEFLOW — Complete UI/UX Design System & Visual Specification
## Voice-First Social Media — Design Language, Components & User Experience

**Date:** July 22, 2026
**Status:** Draft v1.0
**Stack:** Next.js 15 · React 19 · Tailwind CSS 4 · shadcn/ui · Framer Motion · GSAP

---

## TABLE OF CONTENTS

1. [Design Philosophy & Principles](#1-design-philosophy--principles)
2. [Visual Identity & Brand System](#2-visual-identity--brand-system)
3. [Color System](#3-color-system)
4. [Typography System](#4-typography-system)
5. [Spacing & Layout Grid](#5-spacing--layout-grid)
6. [Iconography & Visual Language](#6-iconography--visual-language)
7. [Animation & Motion Design](#7-animation--motion-design)
8. [Navigation & Information Architecture](#8-navigation--information-architecture)
9. [Feed Card Design System](#9-feed-card-design-system)
10. [Post Composer & Voice Recording UI](#10-post-composer--voice-recording-ui)
11. [Profile Page Design](#11-profile-page-design)
12. [Direct Messaging Design](#12-direct-messaging-design)
13. [Notification Center Design](#13-notification-center-design)
14. [Search & Discovery UI](#14-search--discovery-ui)
15. [Story System Design](#15-story-system-design)
16. [Moderation & Safety UI](#16-moderation--safety-ui)
17. [Onboarding & Sign-Up Flow](#17-onboarding--sign-up-flow)
18. [Empty States, Loading & Error States](#18-empty-states-loading--error-states)
19. [Settings & Preferences UI](#19-settings--preferences-ui)
20. [Responsive Design & Breakpoints](#20-responsive-design--breakpoints)
21. [Accessibility Compliance](#21-accessibility-compliance)
22. [Component Architecture & ## 22.5 Vercel Performance & Web Interface Guidelines

These rules are enforced across all VoiceFlow components. Every screen and interaction must comply.

### Data Fetching (Critical)

```typescript
// ELIMINATE WATERFALLS: Use Promise.all for independent operations
export async function loadProfilePage(agent: BskyAgent, handle: string) {
  // INCORRECT (waterfall):
  // const profile = await agent.getProfile({ actor: handle });
  // const follows = await agent.getFollows({ actor: handle });
  // const feed = await agent.getAuthorFeed({ actor: handle });
  
  // CORRECT (parallel):
  const [profileRes, followsRes, feedRes] = await Promise.all([
    agent.getProfile({ actor: handle }),
    agent.getFollows({ actor: handle, limit: 100 }),
    agent.getAuthorFeed({ actor: handle, limit: 30 }),
  ]);
  
  return {
    profile: profileRes.data,
    follows: followsRes.data,
    feed: feedRes.data,
  };
}

// USE React.cache() for per-request deduplication
import { cache } from 'react';

export const getProfile = cache(async (handle: string) => {
  const agent = await getAuthenticatedAgent();
  const response = await agent.getProfile({ actor: handle });
  return response.data;
});

// SERVER ACTIONS: Authenticate like API routes
export async function createVoicePost(formData: FormData) {
  'use server';
  
  const session = await getSession(); // Check auth
  if (!session) throw new Error('Unauthorized');
  
  const agent = await getAgentForSession(session);
  // ... create post
  
  revalidatePath('/feed');
}

// SUSPENSE BOUNDARIES: Stream content progressively
// FeedPage loads shell immediately, feed streams in:
// <Suspense fallback={<FeedSkeleton />}>
//   <FeedContent />
// </Suspense>
```

### Bundle Size Optimization

```typescript
// DYNAMIC IMPORT: Heavy components load on interaction
const VoiceRecorder = dynamic(() => import('@/components/voice/VoiceRecorder'), {
  loading: () => <RecordButtonPlaceholder />,
});

const WaveformEditor = dynamic(() => import('@/components/voice/WaveformEditor'), {
  ssr: false, // Only client-side
});

// BARREL IMPORTS: Never import from barrel files
// INCORRECT: import { Button } from '@/components/ui';
// CORRECT:  import { Button } from '@/components/ui/button';
```

### Server-Side Performance

```typescript
// HOIST STATIC IO: Module-level for fonts, logos
const fontUrl = 'https://fonts.cdnfonts.com/css/satoshi';
const logoPath = '/images/logo.svg';

// MINIMIZE SERIALIZATION: Only pass needed data to client components
// INCORRECT: return <FeedItem post={fullPostObject} /> // entire object
// CORRECT:  return <FeedItem post={{ uri: post.uri, text: post.record.text }} />

// use after() for non-blocking operations (analytics, logging)
import { after } from 'next/server';

export async function handlePostCreation(formData: FormData) {
  'use server';
  // ... create post ...
  
  after(async () => {
    await logAnalytics('post_created', { userId });
  });
}
```

### Client-Side Rendering

```typescript
// VIRTUALIZE LARGE LISTS (>50 items)
import { useVirtualizer } from '@tanstack/react-virtual';

// CONTENT VISIBILITY for list items
// <div style={{ content-visibility: 'auto' }}>...

// FUNCTIONAL setState for stable callbacks
// INCORRECT: setCount(count + 1) in useEffect deps
// CORRECT:  setCount(prev => prev + 1)

// LAZY STATE INITIALIZATION
// INCORRECT: const [state, setState] = useState(expensiveCalculation());
// CORRECT:  const [state, setState] = useState(() => expensiveCalculation());

// START TRANSITION for non-urgent updates
const [isPending, startTransition] = useTransition();
startTransition(() => {
  setSearchResults(results);
});
```

### Accessibility & Web Standards

```typescript
// FOCUS VISIBLE: Never remove outline without replacement
// INCORRECT: className="outline-none"
// CORRECT:  className="focus-visible:ring-2 focus-visible:ring-brand"

// ICON BUTTONS: Always need aria-label
<button aria-label="Like this post" onClick={handleLike}>
  <HeartIcon aria-hidden="true" />
</button>

// FORM CONTROLS: Always have associated labels
<label htmlFor="caption">Caption</label>
<input id="caption" name="caption" type="text" />

// TABULAR NUMBERS for counts
.duration {
  font-variant-numeric: tabular-nums;
}

// REDUCED MOTION
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

// HONOR color-scheme META for dark mode scrollbars
<meta name="color-scheme" content="dark" />

// RESPECT env(safe-area-inset-*) for notches
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

// touch-action: manipulation to prevent double-tap zoom
button, a {
  touch-action: manipulation;
}

// Animate only transform and opacity (compositor-friendly)
// INCORRECT: transition: width 0.3s, height 0.3s
// CORRECT:  transition: transform 0.3s var(--ease-out-quart), opacity 0.3s var(--ease-out-quart)

// Never transition: all
// INCORRECT: transition: all 0.3s
// CORRECT:  transition: transform 0.3s, opacity 0.3s

// URL reflects state (filters, tabs in query params)
// /feed?tab=trending
// /profile/@user?tab=likes
// /search?q=music&type=people
```

### Form & Input Guidelines

```typescript
// AUTOCOMPLETE for accessibility
<input name="email" type="email" autoComplete="email" />

// Never block paste
// INCORRECT: <input onPaste={(e) => e.preventDefault()} />

// Spellcheck off for usernames, codes
<input name="handle" spellCheck="false" autoCorrect="off" />

// Submit button: stay enabled until request starts
<form action={handleSubmit}>
  <Button type="submit" disabled={isPending}>
    {isPending ? 'Posting...' : 'Post'}
  </Button>
</form>

// Errors inline next to fields
{error && <p className="text-error text-sm" role="alert">{error}</p>}

// Confirm destructive actions (never immediate)
<Dialog>
  <DialogTitle>Delete post?</DialogTitle>
  <DialogDescription>This cannot be undone.</DialogDescription>
  <Button variant="destructive">Delete</Button>
</Dialog>
```

### Links & Navigation

```typescript
// Use <a>/<Link> for navigation, not <div onClick>
// INCORRECT: <div onClick={() => router.push('/profile')}>Profile</div>
// CORRECT:  <Link href="/profile">Profile</Link>

// Images need explicit width/height (prevents CLS)
<Image src={avatar} alt="" width={48} height={48} />

// Below-fold images: lazy loading
<Image src={postImage} alt="" width={800} height={600} loading="lazy" />

// Above-fold images: priority
<Image src={heroImage} alt="" width={1200} height={630} priority />

// Preconnect to CDN/asset domains
<link rel="preconnect" href="https://cdn.bsky.app" />

// Deep-link all stateful UI
// Tabs, filters, pagination, expanded panels → query params
// /feed?tab=following&cursor=abc
```

---

shadcn/ui Mapping](#22-component-architecture--shadcnui-mapping)
23. [Appendices: Bluesky Client UX Comparisons](#23-appendices-bluesky-client-ux-comparisons)

---

## 1. DESIGN PHILOSOPHY & PRINCIPLES

### 1.1 Core Design Ethos

**"Voice first, but never voice only."**

VoiceFlow is designed around audio as the primary medium, but every feature also supports text, images, and video. The design language communicates warmth, emotional resonance, and human connection — the qualities that voice brings to communication.

### 1.2 Design Principles

| # | Principle | Description |
|---|-----------|-------------|
| 1 | **Audio as Artifact** | Voice is not just a medium — it's a visual artifact. Waveforms, progress rings, and sound visualizations are central design elements, not afterthoughts. |
| 2 | **Dark by Default** | The app is designed for dark-first viewing. Voice is intimate, often consumed in low-light environments (bedrooms, commutes). Dark mode is the default, not an alternative. |
| 3 | **Depth through Elevation** | Surfaces communicate hierarchy through lightness and contrast, not simulated glass. Elevated panels are subtly lighter than the base, with 1px borders at low opacity to define edges. |
| 4 | **Motion with Meaning** | Every animation serves a purpose: indicating state (recording), providing feedback (like heart), or guiding attention (new content appears with gentle entrance). |
| 5 | **Information Density, Curated** | Voice posts prioritize the waveform and play button; text is secondary. Use spacing and hierarchy over containers. Nested cards are strictly avoided. |
| 6 | **Thumb-Friendly Navigation** | The most frequent actions (record voice, like, reply) are within the thumb zone on mobile. Navigation is bottom-tab-first. |
| 7 | **Audio Accessibility** | Transcripts are mandatory. Voice controls are large and high-contrast. Speed controls are visible. Every interactive element has a keyboard-accessible equivalent and aria-label. |
| 8 | **Emotional Restraint** | Color is applied sparingly. One accent carries the brand. Voice moods use subtle hue shifts of the same accent, not a full rainbow. |

### 1.3 Design Influences

| Source | What We Borrow |
|--------|---------------|
| **Instagram** | Bottom tab navigation, story ring design, profile grid, post interaction patterns |
| **Twitter/X** | Left-sidebar desktop layout, conversation threading, card density |
| **Discord** | Channel/server navigation, voice state indicators, dark theme mastery |
| **Spotify** | Audio-first visualizations, playlist/waveform design, dark+green aesthetic |
| **Clubhouse** | Voice-first social UX, room/audio card design, minimalist audio UI |
| **TikTok** | Full-screen immersive content, side action bar, creator overlay |
| **Telegram** | Messaging design, voice message recording UX (hold-to-record, slide-to-cancel) |
| **Bluesky (Official)** | AT Protocol data patterns, custom feed integration, moderation UX |
| **Graysky** | Custom feed switching, inline GIF support, power-user interactions |
| **SkyFeed** | Multi-column dashboard, feed builder UX |
| **Klearsky** | Clean single-column web design, modular architecture, lightweight UX |

---

## 2. VISUAL IDENTITY & BRAND SYSTEM

### 2.1 Brand Name & Logo

**Product Name: VoiceFlow**

Logo Concept: A stylized sound wave that forms the letter "V" — representing both "Voice" and "Flow." The wave has 3-4 peaks, suggesting audio amplitude. Two design variants:
- **Full logo**: Waveform-V + "VoiceFlow" wordmark in Plus Jakarta Sans SemiBold
- **Icon only**: The waveform-V for favicon, app icon, navigation

### 2.2 Brand Voice & Tone

| Context | Tone | Example |
|---------|------|---------|
| Onboarding | Warm, direct | "Record your first post to get started." |
| Notifications | Concise | "Alex replied to your voice post" |
| Error states | Helpful, not technical | "Something went wrong. Try again." |
| Empty states | Encouraging | "Your feed is empty. Follow some people." |
| Moderation | Clear | "This content has been flagged for review" |
| Settings | Neutral | "Control how you experience VoiceFlow" |

### 2.3 Tagline & Value Proposition

**Primary tagline:** "Your voice, your space."
**Secondary tagline:** "The social network that listens."

---

## 3. COLOR SYSTEM

### 3.1 Color Strategy

VoiceFlow uses a **Restrained** color strategy: tinted neutrals with one accent carrying the brand. This avoids the generic purple-blue AI aesthetic common in modern tools. The accent is Deep Rose (oklch(0.55 0.15 15)) -- warm, human, and auditory. It evokes the warmth of the human voice without the coldness of blue or the cliche of purple.

All colors use the OKLCH color space for perceptually uniform gradients and consistent chroma. Chroma decreases as lightness approaches 0 or 100, preventing garish extremes.

### 3.2 Brand Color Palette

```css
/* Brand Colors (OKLCH) */
--color-brand: oklch(0.55 0.15 15);           /* Deep Rose - warm, human, auditory */
--color-brand-hover: oklch(0.50 0.16 15);
--color-brand-active: oklch(0.45 0.17 15);
--color-brand-subtle: oklch(0.55 0.15 15 / 0.12);
--color-brand-muted: oklch(0.55 0.15 15 / 0.06);

/* Neutrals tinted toward brand hue at chroma 0.008 */
--color-neutral-50: oklch(0.98 0.004 15);
--color-neutral-100: oklch(0.95 0.005 15);
--color-neutral-200: oklch(0.90 0.006 15);
--color-neutral-300: oklch(0.80 0.007 15);
--color-neutral-400: oklch(0.70 0.008 15);
--color-neutral-500: oklch(0.55 0.008 15);
--color-neutral-600: oklch(0.45 0.008 15);
--color-neutral-700: oklch(0.35 0.007 15);
--color-neutral-800: oklch(0.25 0.006 15);
--color-neutral-900: oklch(0.18 0.005 15);
--color-neutral-950: oklch(0.12 0.003 15);
```

### 3.3 Dark Theme (Default)

```css
/* Dark Theme - Default */
--color-surface-base: var(--color-neutral-950);
--color-surface-elevated: var(--color-neutral-900);
--color-surface-elevated-2: oklch(0.14 0.005 15);
--color-surface-overlay: oklch(0 0 0 / 0.55);

--color-border-subtle: oklch(1 0 0 / 0.06);
--color-border-default: oklch(1 0 0 / 0.10);
--color-border-strong: oklch(1 0 0 / 0.16);

--color-text-primary: oklch(0.95 0.005 15);
--color-text-secondary: oklch(0.70 0.008 15);
--color-text-tertiary: oklch(0.55 0.007 15);
--color-text-inverse: oklch(0.15 0.004 15);

/* Semantic Colors */
--color-success: oklch(0.60 0.15 145);
--color-warning: oklch(0.70 0.15 75);
--color-error: oklch(0.55 0.18 30);
--color-info: oklch(0.60 0.10 250);
```

### 3.4 Light Theme (Alternative)

```css
/* Light Theme */
--color-surface-base: oklch(0.97 0.003 15);
--color-surface-elevated: oklch(0.99 0.002 15);
--color-surface-elevated-2: oklch(0.94 0.004 15);

--color-border-subtle: oklch(0 0 0 / 0.06);
--color-border-default: oklch(0 0 0 / 0.10);
--color-border-strong: oklch(0 0 0 / 0.16);

--color-text-primary: oklch(0.15 0.004 15);
--color-text-secondary: oklch(0.40 0.006 15);
--color-text-tertiary: oklch(0.60 0.007 15);
```

### 3.5 Voice Mood Color Mapping

Voice posts can carry a mood tag that subtly shifts the accent in the player. All hues stay within the warm rose-to-amber range at reduced chroma -- no full-spectrum rainbow:

| Mood | Variation |
|------|-----------|
| Normal | Brand rose |
| Whisper | Rose, reduced chroma |
| Rant | Rose shifted toward amber |
| Story | Rose shifted toward gold |
| ASMR | Rose, lowest chroma |
| Singing | Rose, slightly higher chroma |

---

## 4. TYPOGRAPHY SYSTEM

### 4.1 Font Stack

```css
/* Headlines: Satoshi -- geometric, distinctive, warm character */
--font-heading: 'Satoshi', sans-serif;

/* Body Text: Geist -- clean, highly readable, excellent for UI */
--font-body: 'Geist', sans-serif;

/* Mono: JetBrains Mono -- for durations, timestamps, tabular numbers */
--font-mono: 'JetBrains Mono', monospace;

/* Preload critical fonts */
<link rel="preload" as="font" href="/fonts/Satoshi-Bold.woff2" crossorigin />
<link rel="preload" as="font" href="/fonts/Geist-Regular.woff2" crossorigin />
```

### 4.2 Type Scale

```css
--text-xs: 0.75rem;    /* 12px — timestamps, badges */
--text-sm: 0.875rem;   /* 14px — secondary text, captions */
--text-base: 1rem;     /* 16px — body text */
--text-lg: 1.125rem;   /* 18px — post text */
--text-xl: 1.25rem;    /* 20px — section titles */
--text-2xl: 1.5rem;    /* 24px — profile headings */
--text-3xl: 1.875rem;  /* 30px — page headings */
--text-4xl: 2.25rem;   /* 36px — hero display */

/* Fluid typography using clamp() */
--text-fluid-sm: clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem);
--text-fluid-base: clamp(0.875rem, 0.8rem + 0.3vw, 1rem);
--text-fluid-lg: clamp(1rem, 0.9rem + 0.4vw, 1.125rem);
```

### 4.3 Line Heights

```css
--leading-tight: 1.25;    /* Headings */
--leading-normal: 1.5;    /* Body text */
--leading-relaxed: 1.75;  /* Long-form content */
```

### 4.4 Font Weights

```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### 4.5 Usage Guide

```css
/* Body line length capped at 75ch */
p, .text-body {
  max-width: 75ch;
}

/* Tabular numbers for durations and counts */
.tabular-nums {
  font-variant-numeric: tabular-nums;
}

/* Text balance on headings to prevent widows */
h1, h2, h3 {
  text-wrap: balance;
}
```

| Element | Font | Weight | Size | Leading |
|---------|------|--------|------|---------|
| App title/logo | Satoshi | 700 | 1.25rem | tight |
| Feed card - username | Geist | 600 | 0.875rem | normal |
| Feed card - timestamp | Geist | 400 | 0.75rem | normal |
| Voice player - duration | JetBrains Mono | 500 | 0.75rem | normal |
| Post caption/text | Geist | 400 | 1rem | normal |
| Profile - display name | Satoshi | 700 | 1.5rem | tight |
| Profile - bio text | Geist | 400 | 0.875rem | normal |
| Navigation labels | Geist | 500 | 0.75rem | normal |
| Button labels | Geist | 600 | 0.875rem | normal |
| Notification text | Geist | 400 | 0.875rem | normal |
| Onboarding headings | Satoshi | 700 | 1.5rem | tight |

---

## 5. SPACING & LAYOUT GRID

### 5.1 Spacing Scale

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
```

### 5.2 Border Radius System

```css
--radius-none: 0px;
--radius-sm: 0.375rem;    /* 6px — inputs, buttons */
--radius-md: 0.5rem;      /* 8px — cards */
--radius-lg: 0.75rem;     /* 12px — modals */
--radius-xl: 1rem;        /* 16px — sheets */
--radius-2xl: 1.5rem;     /* 24px — voice player cards */
--radius-full: 9999px;    /* Pills, avatars, buttons */
```

**Border Radius Psychology Applied:**
- Sharp (sm): Inputs, forms — functional, professional
- Rounded (md-lg): Cards, containers — approachable, standard
- Extra rounded (2xl): Voice player cards — friendly, audio-focused
- Full: Avatars, record button, pills — playful, touchable

### 5.3 Layout Grid

```css
/* Max content widths */
--max-width-feed: 640px;        /* Feed column width */
--max-width-sidebar: 320px;     /* Right sidebar */
--max-width-sidebar-narrow: 72px; /* Icon-only sidebar */

/* Container padding */
--container-padding-mobile: 1rem;
--container-padding-tablet: 1.5rem;
--container-padding-desktop: 2rem;
```

---

## 6. ICONOGRAPHY & VISUAL LANGUAGE

### 6.1 Icon Library

**Primary:** Lucide Icons (through shadcn/ui) — consistent stroke-width (2px), geometric, comprehensive set.
**Secondary:** Custom SVG icons for voice-specific interactions.

### 6.2 Core Icon Set

| Feature | Icon | Library |
|---------|------|---------|
| Home/Feed | House | Lucide |
| Search | Search | Lucide |
| Compose/Post | Plus (with circle) | Lucide |
| Notifications | Bell | Lucide |
| Profile | User | Lucide |
| Messages | MessageSquare | Lucide |
| Like | Heart | Lucide |
| Filled Like | Heart (filled) | Custom |
| Reply | MessageCircle | Lucide |
| Repost/Share | Repeat | Lucide |
| Bookmark | Bookmark | Lucide |
| More Options | MoreHorizontal | Lucide |
| Play | Play | Lucide |
| Pause | Pause | Lucide |
| Record (idle) | Circle | Lucide |
| Record (active) | Circle (red, pulsing) | Custom |
| Voice Post | Mic | Lucide |
| Waveform | AudioLines | Lucide |
| Transcript | FileText | Lucide |
| Music Note | Music | Lucide |
| Close | X | Lucide |
| Back | ArrowLeft | Lucide |
| Settings | Settings | Lucide |
| Dark Mode | Moon | Lucide |
| Mood/Tag | Tag | Lucide |
| Follow | UserPlus | Lucide |
| Following | UserCheck | Lucide |
| Verified | BadgeCheck | Lucide |
| Block | ShieldOff | Lucide |
| Report | Flag | Lucide |

### 6.3 Icon Sizing

```css
--icon-xs: 0.75rem;    /* 12px — inline indicators */
--icon-sm: 1rem;       /* 16px — action bar icons */
--icon-md: 1.25rem;    /* 20px — nav icons */
--icon-lg: 1.5rem;     /* 24px — primary CTAs */
--icon-xl: 2rem;       /* 32px — record button */
```

### 6.4 Badge & Dot System

- **Notification badge**: Red circle with white count number. Positioned top-right of nav icons. Max display "99+".
- **Unread dot**: Small blue/purple dot (6px diameter) on feed items, DMs, notifications.
- **Online indicator**: Green dot (8px) overlapping avatar bottom-right.
- **Recording indicator**: Red pulsing dot in status bar during voice recording.

---

## 7. ANIMATION & MOTION DESIGN

### 7.1 Timing & Easing

```css
/* Durations */
--duration-instant: 100ms;
--duration-fast: 200ms;
--duration-normal: 300ms;
--duration-slow: 500ms;

/* Easing curves - exponential, no bounce or elastic */
--ease-out-quart: cubic-bezier(0.25, 0.46, 0.45, 0.94);  /* Standard exit */
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);        /* Emphasis exit */
--ease-in: cubic-bezier(0.4, 0, 0.4, 1);                 /* Entering */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);           /* Natural */
```

### 7.2 Micro-Interactions

| Interaction | Animation | Duration | Easing |
|-------------|-----------|----------|--------|
| Like button | Heart scales up to 1.3x, fills with color, scales back | 300ms | ease-out-quint |
| Follow button | Text transition: Follow to Following | 200ms | ease-out-quart |
| Voice play/pause | Button crossfade between states | 150ms | ease-out-quart |
| Card hover (desktop) | Lift 2px via translateY | 200ms | ease-out-quart |
| Card tap (mobile) | Scale to 0.97, then back to 1.0 | 150ms | ease-out-quart |
| Tab switch | Content slides and fades | 250ms | ease-in-out |
| Modal open | Background darkens, modal scales from 0.95 to 1.0 | 300ms | ease-out-quint |
| Bottom sheet | Sheet slides up from bottom | 350ms | ease-out-quint |
| Pull to refresh | Icon rotates continuously, checkmark on success | varies | ease-out-quart |
| Recording | Pulse ring expands from record button | continuous | ease-out-quart |
| Skeleton loading | Shimmer sweep across card | 1.5s loop | linear |
| New feed item | Slides in from bottom with opacity fade | 400ms | ease-out-quint |
| Notification toast | Slides in from top, pauses, slides out | 500ms in/out | ease-out-quart |
| Profile image load | Blur-up from low-res thumbnail | 300ms | ease-out-quart |
| Voice waveform | Bars animate based on audio amplitude | real-time | linear |

### 7.3 GSAP Integration Points

```typescript
// Animation examples using GSAP

// Feed item staggered entrance
gsap.fromTo('.feed-item', 
  { y: 30, opacity: 0 },
  { y: 0, opacity: 1, stagger: 0.05, duration: 0.4, ease: 'power2.out' }
);

// Recording pulse animation
gsap.to('.record-pulse', {
  scale: 1.5,
  opacity: 0,
  duration: 1.5,
  repeat: -1,
  ease: 'power1.out',
});

// Like heart burst
gsap.timeline()
  .to('.like-icon', { scale: 1.3, duration: 0.15, ease: 'back.out(2)' })
  .to('.like-icon', { scale: 1, duration: 0.2, ease: 'power2.out' });
```

### 7.4 Reduced Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. NAVIGATION & INFORMATION ARCHITECTURE

### 8.1 Navigation Structure

```
Mobile Bottom Tab Bar (5 tabs)
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  Home    │ Search   │ Compose  │ Activity │ Profile  │
│  [icon]  │ [icon]   │ [+ icon] │ [icon]   │ [icon]   │
└──────────┴──────────┴──────────┴──────────┴──────────┘

Desktop Left Sidebar
┌──────────────────────┐
| [Logo] VoiceFlow     |
├──────────────────────┤
| [icon] Home          |
| [icon] Search        |
| [icon] Activity      |
| [icon] Messages      |
| [icon] Profile       |
├──────────────────────┤
| [icon] Settings      |
| [icon] Theme Toggle  |
└──────────────────────┘

Desktop Right Sidebar (optional)
┌──────────────────────┐
| [icon] Search        |
├──────────────────────┤
| Trending Topics      |
| #VoiceOfTheDay       |
| #MusicMonday         |
├──────────────────────┤
| Suggested Voices     |
| [avatar] @user1      |
| [avatar] @user2      |
└──────────────────────┘
```

### 8.2 Tab Navigation Details

| Tab | Mobile Label | Desktop Label | Content |
|-----|-------------|---------------|---------|
| Home | Icon only | Home | Primary feed (following + discover) |
| Search | Icon only | Search | Search bar + trending + explore grid |
| Compose | (+) icon | (+) button | Post creation (voice default) |
| Activity | Icon only | Activity | Notifications feed |
| Messages | Icon only | Messages | DM list and conversations |
| Profile | Avatar | Profile | User's own profile |
| Settings | In sidebar | Settings | App preferences and controls |

### 8.3 The Compose Button

The compose button is the most visually distinctive element:

**Mobile:** Floating action button (FAB) - 56px diameter, brand background, white icon. Positioned center of bottom tab bar.

```css
.compose-fab {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s var(--ease-out-quart);
  touch-action: manipulation;
}
.compose-fab:active {
  transform: scale(0.92);
}
```

**Desktop:** Pill-shaped button in the left sidebar — "Post" with microphone icon. Fixed position.

### 8.4 Responsive Navigation Transformation

```css
/* Mobile: bottom tab bar */
@media (max-width: 767px) {
  .nav-sidebar { display: none; }
  .nav-bottom-tabs { display: flex; position: fixed; bottom: 0; width: 100%; }
}

/* Tablet: bottom tabs still, wider feed */
@media (min-width: 768px) and (max-width: 1023px) {
  .nav-sidebar { display: none; }
  .nav-bottom-tabs { display: flex; }
  .feed-container { max-width: 600px; margin: 0 auto; }
}

/* Desktop: left sidebar appears */
@media (min-width: 1024px) {
  .nav-sidebar { display: flex; width: 280px; position: fixed; left: 0; }
  .nav-bottom-tabs { display: none; }
  .feed-container { margin-left: 280px; max-width: 640px; }
}

/* Large Desktop: right sidebar appears */
@media (min-width: 1280px) {
  .right-sidebar { display: block; width: 320px; }
  .feed-container { max-width: 640px; }
  .layout { display: grid; grid-template-columns: 280px 1fr 320px; }
}
```

---

## 9. FEED CARD DESIGN SYSTEM

### 9.1 Voice Post Card (Primary)

This is the most important component in the app — the primary content unit.

```
+-- post-card --------------------------------------------------+
| +-- header-row ----------------------------------------------+ |
| | [avatar] @username - 2m ago              [more options]    | |
| +------------------------------------------------------------+ |
|                                                               |
| +-- voice-player --------------------------------------------+ |
| |  [play] /\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\ | |
| |       \/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/  | |
| |     0:42                              duration bar        | |
| +------------------------------------------------------------+ |
|                                                               |
|  This is the transcript or caption text...                    |
|  #voice #story #music                                         |
|                                                               |
|  [heart: 24] [reply: 8] [repost: 5] [bookmark: 3]            |
|                                                               |
|  View 12 replies                                              |
+---------------------------------------------------------------+

**Component Structure:**

```
<Card className="bg-surface-elevated rounded-2xl border-border-subtle p-4 space-y-3">
  <PostHeader />         /* Avatar + name + timestamp + menu */
  <VoicePlayer />        /* Waveform + play/pause + duration */
  <PostContent />        /* Optional text/transcript */
  <PostTags />           /* Mood chip + hashtags */
  <PostActions />        /* Like, reply, repost, bookmark */
  <ReplyPreview />       /* Last reply preview */
</Card>
```

### 9.2 Voice Player Component (Embedded in Card)

```tsx
// Key visual properties
const voicePlayerStyle = {
  backgroundColor: 'var(--color-brand-muted)',
  borderRadius: '12px',
  padding: '12px',
  border: '1px solid var(--color-brand-subtle)',
};
```

**States:**
- **Loading**: Skeleton with waveform-shaped shimmer bars
- **Paused**: Static waveform, play button prominent, duration shown
- **Playing**: Animated waveform (bars animate to audio frequency), progress bar advances, play button becomes pause, current time counts up
- **Completed**: Waveform fully filled with brand color, reset to start, show total duration

### 9.3 Text Post Card (Secondary)

```
+-- text-post-card ---------------------------------------------+
| +-- header-row ----------------------------------------------+ |
| | [avatar] @username - 5m ago              [more options]    | |
| +------------------------------------------------------------+ |
|                                                               |
|  This is the text content of the post. It                     |
|  can contain @mentions and #hashtags with                     |
|  proper link styling and highlighting...                      |
|                                                               |
|  [heart: 12] [reply: 3] [repost: 2]                          |
+---------------------------------------------------------------+

### 9.4 Image Post Card

Same structure as text, but with a 4:5 or 1:1 image grid below the header and above the actions. Images use aspect-ratio CSS with object-fit: cover.

### 9.5 Card Interaction States

| State | Visual Change |
|-------|--------------|
| Default | Subtle border (--color-border-subtle) |
| Hover (desktop) | Border becomes --color-border-default, translateY(-2px) |
| Press/Tap | scale(0.98) for 150ms |
| Active (being played) | Border uses --color-brand-subtle |
| Focus visible | focus-visible:ring-2 offset-2 in brand color |

---

## 10. POST COMPOSER & VOICE RECORDING UI

### 10.1 The Voice-First Composer Flow

The composer is designed around **voice as the primary action**. Opening the composer immediately puts the user into recording mode — no separate "text vs voice" choice.

```
┌──────────────────────────────────────────────┐
│  [X] Cancel                        [Post]    │
│                                              │
│         ┌──────────────────────┐            │
│         │                      │            │
│         │    ● RECORD          │            │
│         │    Hold to record    │            │
│         │                      │            │
│         └──────────────────────┘            │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │ Add text caption (optional)       │     │
│  └────────────────────────────────────┘     │
│                                              │
|  [Tags] [Mention] [Attach] [Mood] [Settings] |
└──────────────────────────────────────────────┘
```

### 10.2 Recording State Transitions

**Phase 1: Idle**
- Large pulsing record button (80px diameter) centered
- "Hold to record" text below
- Text input field below for caption
- Bottom toolbar: hashtag, mention, media, mood buttons

**Phase 2: Recording (Button held)**
- Button transforms: outer ring becomes progress circle (counts down from 2:00)
- Live waveform visualization appears above the button
- Duration counter: "0:00" → counting up
- Red recording indicator dot at top of screen
- "Slide left to cancel" hint appears

**Phase 3: Recording Complete (Button released)**
- Waveform stabilizes
- Playback preview appears
- "Re-record" button available
- Caption field becomes more prominent
- Transcript auto-generates (visual indicator: "Transcribing...")
- Post button becomes active

**Phase 4: Posting**
- Loading overlay: "Publishing your voice..."
- Progress animation
- On success: dismiss composer, show toast "Posted!"
- On error: inline error with retry option

### 10.3 Recording Progress Ring Design

```css
.record-progress-ring {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(
    var(--color-brand-primary) 0%,
    var(--color-brand-secondary) var(--progress),
    transparent var(--progress) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
}

.record-progress-ring-inner {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--color-surface-base);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### 10.4 Recording Controls Toolbar

```tsx
<Toolbar>
  <ToolbarButton icon={Hash} label="Add tags" />
  <ToolbarButton icon={AtSign} label="Mention" />
  <ToolbarButton icon={Image} label="Add image" />
  <ToolbarButton icon={Tag} label="Mood" dropdown={
    <MoodPicker moods={['Normal', 'Whisper', 'Rant', 'Story', 'ASMR', 'Singing', 'Laughing']} />
  } />
  <ToolbarButton icon={Settings2} label="Post settings" dropdown={
    <PrivacyPicker options={['Public', 'Followers only', 'Mentioned only']} />
  } />
</Toolbar>
```

### 10.5 Transcription Display

Below the voice player preview, show auto-generated transcript:
- Use a subtle background tint
- Show first 2 lines with "Show more" expand
- Editable text area for corrections
- Character count badge

---

## 11. PROFILE PAGE DESIGN

### 11.1 Profile Page Layout

```
┌──────────────────────────────────────────────┐
│  ← Back                        [Edit Profile] │
│                                              │
│  ┌──────────┐                                │
│  │  Avatar  │  Display Name                   │
│  │  (96px)  │  @handle.bsky.social           │
│  └──────────┘  [Follow] [Message]            │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  ▶ Voice Bio · "Hey, I'm Sarah..."   │   │
│  │  0:23                       0:23/0:23│   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Bio text line 1                             │
│  Bio text line 2                             │
│                                              │
|  [Music] My playlist: link to Spotify         |
|                                              |
|  1.2k Followers - 420 Following - 156 Posts  |
│      Posts · 8.4k Total Plays               │
│                                              │
│  [Posts] [Replies] [Media] [Likes]  ← Tabs  │
├──────────────────────────────────────────────┤
│                                              │
│  Content grid/timeline based on active tab   │
│                                              │
└──────────────────────────────────────────────┘
```

### 11.2 Profile Header Components

| Element | Design |
|---------|--------|
| Avatar | 96px diameter on profile page, circular, with optional story ring |
| Display Name | Plus Jakarta Sans Bold, 1.5rem, brand color accent |
| Handle | Inter Medium, 0.875rem, text-secondary |
| Verified Badge | 16px blue checkmark next to display name |
| Action Buttons | Follow (brand gradient) / Message (outline) / Edit Profile (ghost) |
| Voice Bio | Glassmorphism card with waveform player, 64px height |
| Bio Text | Inter Regular, 0.875rem, max 3 lines with expand |
| Stats Row | Geist SemiBold 1rem for numbers, Geist Regular 0.75rem for labels |
| Music Link | Chip with music icon, links to external platform |

### 11.3 Profile Tabs

| Tab | Content | View |
|-----|---------|------|
| Posts | User's voice/text posts | Vertical feed list |
| Replies | User's replies to others | Compact reply cards |
| Media | Posts with images/video | Grid gallery (2 columns) |
| Likes | Posts the user has liked | Compact card list |

### 11.4 Profile Empty States

| Scenario | Message | CTA |
|----------|---------|-----|
| No posts yet | "No voice posts yet" | "Record your first post →" |
| No followers | "Building your community" | "Find people to follow →" |
| No following | "Following 0 people" | "Discover voices →" |
| No likes | "No likes yet" | "Explore the feed →" |

---

## 12. DIRECT MESSAGING DESIGN

### 12.1 DM Layout

```
Mobile: Full-screen modal/route
Desktop: Right sidebar or separate page

┌──────────────────────────────────────────────┐
│  💬 Messages                    [New Message] │
├──────────────────────────────────────────────┤
│  ┌──────┐ Alex Smith                          │
│  │ avtr │ Hey! Loved your voice post about... │
│  └──────┘ Today 12:30                    ●   │
│                                              │
│  ┌──────┐ Jamie Lee                          │
│  │ avtr │ Want to collaborate on a track?... │
│  └──────┘ Yesterday                      ●   │
│                                              │
|  +------+ Music Group (3)                     |
|  | grp  | Sarah: Here's my latest beat!    |
|  +------+ Yesterday                           |
│                                              │
│  ...empty state if no messages...            │
└──────────────────────────────────────────────┘
```

### 12.2 Conversation View

```
┌──────────────────────────────────────────────┐
|  [back]                   Alex Smith    [more] |
|                                               |
|              +-----------------------+         |
|              | Voice message 0:32   |(them)   |
|              | [play]/\/\/\/\/      |         |
|              +-----------------------+         |
|                                               |
|  +-----------------------+                    |
|  | That's amazing! I'd   | (me)             |
|  | love to collab!       | [read] 12:31 PM  |
|  +-----------------------+                    |
|                                               |
|              +-----------------------+         |
|              | Here's my reply...   |(them)   |
|              | [play]/\/\/\/\/\/\/\/ |        |
|              +-----------------------+         |
│                                              │
│                               [Typing...]    │
├──────────────────────────────────────────────┤
|  [attach] [record] [emoji] [Type a message...] [send] |
└──────────────────────────────────────────────┘
```

### 12.3 Message Types

| Type | Design |
|------|--------|
| Text | Standard rounded bubble, max-width 75%, left (them) or right (me) aligned |
| Voice message | Voice player card (compact): 32px high waveform + play button + duration |
| Image | Rounded image within bubble, tap to expand |
| Link preview | Card with thumbnail, title, description |
| Voice reply to post | Small quoted card showing original post + reply |

### 12.4 Voice Message in DM (Hold-to-Record)

The microphone button in the message input bar triggers the same recording UX as the main composer, but compact:
- Press and hold mic icon
- Blue bar grows at bottom of screen showing recording progress
- Waveform appears briefly above input
- Release to send, slide down to cancel
- Max 1 minute per voice message

### 12.5 Read Receipts & Typing Indicators

- **Sent**: Single check (✓) gray
- **Delivered**: Double check (✓✓) gray
- **Read**: Double check (✓✓) brand blue
- **Typing**: "... is recording..." or animated dots

---

## 13. NOTIFICATION CENTER DESIGN

### 13.1 Notification Types

| Type | Icon | Description |
|------|------|-------------|
| Like | Heart | Someone liked your post |
| Reply | MessageCircle | Someone replied to your post |
| Repost | Repeat | Someone reposted your post |
| Follow | UserPlus | Someone followed you |
| Mention | AtSign | Someone mentioned you |
| Quote | Quote | Someone quoted your post |
| Voice Reply | Mic | Someone replied with voice |
| Welcome | Wave | Welcome message for new users |
| Milestone | Award | Follower/play milestones |

### 13.2 Notification Card Design

```
┌──────────────────────────────────────────────┐
│  ┌──────┐                                    │
│  │  ♥   │ Alex Smith and 12 others liked     │
│  └──────┘ your voice post                     │
│          2m ago                         ●    │
│                                              │
│  [Voice post preview: "My thoughts on..."]   │
└──────────────────────────────────────────────┘

Unread: Light brand-tint background (--color-brand-primary at 5% opacity)
Read: Transparent background
```

### 13.3 Notification Grouping

- **Time-based**: Today, Yesterday, This Week, Earlier
- **Smart grouping**: "Alex and 12 others liked your post" instead of 13 individual notifications
- **Per-type filtering**: Tab bar at top: All, Likes, Replies, Follows, Mentions

### 13.4 Notification States

| State | Visual |
|-------|--------|
| Unread | Subtle violet tinted background (rgba(139, 92, 246, 0.04)) + left blue dot (6px) |
| Read | No tint, no dot |
| New (real-time) | Brief highlight animation on appearance |
| All caught up | Empty state with illustration + "Follow more people" CTA |

---

## 14. SEARCH & DISCOVERY UI

### 14.1 Search Bar

```css
.search-bar {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: var(--glass-blur);
  border-radius: var(--radius-full);
  padding: 0.75rem 1rem;
  width: 100%;
  transition: border-color 0.2s;
}
.search-bar:focus {
  border-color: var(--color-brand-primary);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
}
```

### 14.2 Search Results

```
+-- search-page ------------------------------------------------+
| [search icon] [Search voices, people, tags...]          [x]   |
+--------------------------------------------------------------+
|                                                              |
|  Recent Searches:                                            |
|  @sarahj   #music   @beatmaker                              |
|                                                              |
|  - Trending Tags -                                           |
|  #VoiceOfTheDay  (2.4k posts)                               |
|  #MusicMonday   (1.8k posts)                                |
|  #StoryTime     (1.2k posts)                                |
|                                                              |
|  - Suggested Creators -                                      |
|  +------+ @sarahj - Music producer           [Follow]        |
|  | avtr |                                                     |
|  +------+                                                     |
+--------------------------------------------------------------+
```

### 14.3 Search Tabs

| Tab | Content |
|-----|---------|
| Top | Mix of relevant results across all categories |
| People | User profile cards with follow button |
| Voice Posts | Voice post cards with player |
| Tags | Hashtag pages with post count |
| Music | Music-related results (with Spotify/Apple Music links) |

### 14.4 Discover/Explore Page

- **Trending tags grid**: 2-column chip layout of popular hashtags
- **Featured voices**: Curated user profiles with voice bio preview
- **Trending voice posts**: Feed of popular voice content
- **Music discovery**: Users with matching music taste (showing progress bars)
- **Suggested communities**: Hashtag-based communities with member count

---

## 15. STORY SYSTEM DESIGN

### 15.1 Story Ring Design

Users can post ephemeral voice+text stories that disappear after 24 hours.

```
Story ring (avatar with gradient ring):
┌──────────────────┐
│  ⭕ ← Gradient   │
│  ring (viewed:   │
│  gray, unseen:   │
│  brand gradient) │
│     ┌──────┐    │
│     │ avtr │    │
│     └──────┘    │
│  Username        │
└──────────────────┘

Ring states:
- Not viewed: Brand gradient ring (violet → pink)
- Viewed: Gray ring (text-tertiary)
- Has voice: Microphone icon overlay on avatar
- No story: No ring (just avatar)
```

### 15.2 Story Viewer

```
┌──────────────────────────────────────────────┐
│  [Progress bar segments]                     │
│                                              │
│  ← [Avatar] @username · 2h ago    ⋮  [X]    │
│                                              │
│                                              │
│              ▶ Voice Story                   │
│              ╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲ 0:45        │
│                                              │
│                                              │
│                                              │
│           ┌────────────────────┐             │
│           │ 💬 Reply to story |             │
│           └────────────────────┘             │
│  [Send message]                        [♥]  │
└──────────────────────────────────────────────┘
```

### 15.3 Story Creation

Similar to the main composer but with:
- No caption field (text overlays on the voice visualization instead)
- Add text overlay: tap to add text at any position
- Background color/gradient picker
- Privacy: Public or Close Friends only
- Auto-deletes after 24 hours

---

## 16. MODERATION & SAFETY UI

### 16.1 Content Warning

```
+-- sensitive-content-warning ----------------------------------+
|  [warning icon] Sensitive Content                             |
|  This voice post has been flagged as potentially sensitive.   |
|                                                               |
|  [View Post]  [Hide Post]                                     |
+---------------------------------------------------------------+
```

### 16.2 Report Flow

```
Step 1: Select reason
+-- report-modal -----------------------------------------------+
|  Report this post                                             |
|                                                               |
|  (o) Spam                                                     |
|  (o) Hate speech or harassment                                |
|  (o) Graphic violence                                         |
|  (o) Nudity or sexual content                                 |
|  (o) Self-harm or suicide                                     |
|  (o) Impersonation                                            |
|  (o) Copyright violation                                      |
|                                                               |
|  [Next]                                                       |
+---------------------------------------------------------------+

Step 2: Additional context
+-- report-context ---------------------------------------------+
|  Add details (optional)                                       |
|  +--------------------------------------------------------+  |
|  | Provide additional context...                           |  |
|  +--------------------------------------------------------+  |
|                                                               |
|  [Submit Report]  [Cancel]                                    |
+---------------------------------------------------------------+

Step 3: Confirmation
+-- report-confirmation ----------------------------------------+
|  Report submitted                                             |
|  Thank you for helping keep VoiceFlow safe.                   |
|  Our team will review this content.                           |
|                                                               |
|  [Done]                                                       |
+---------------------------------------------------------------+
```

### 16.3 Block/Mute UI

```
User menu dropdown (three dots on any post or profile):
- Not interested in this post
- Mute @username
- Block @username
- Report @username
- Copy link to post
```

**Block confirmation modal:**
```
┌──────────────────────────────────────────────┐
│  Block @username?                             │
│  They won't be able to find your profile,    │
│  posts, or message you.                      │
│                                              │
│  [Block]  [Cancel]                            │
└──────────────────────────────────────────────┘
```

---

## 17. ONBOARDING & SIGN-UP FLOW

### 17.1 Onboarding Steps

```
Step 1: Welcome Screen
┌──────────────────────────────────────────────┐
│  ____/╲____                                  │
│     /  \                                     │
│    ╱    ╲                                    │
│                                              │
|  Welcome to VoiceFlow                        |
|  The social network that listens             |
│                                              │
│  [Get Started]                    [Log In]   │
└──────────────────────────────────────────────┘

Step 2: Create Account
┌──────────────────────────────────────────────┐
│  Create your account                         │
│                                              │
│  Email or Phone                              │
│  ┌──────────────────────────────┐            │
│  │ your@email.com              │            │
│  └──────────────────────────────┘            │
│                                              │
│  Password                                    │
│  ┌──────────────────────────────┐            │
│  │ •••••••••                   │            │
│  └──────────────────────────────┘            │
│                                              │
│  Display Name                                │
│  ┌──────────────────────────────┐            │
│  │ Your Name                    │            │
│  └──────────────────────────────┘            │
│                                              │
│  By continuing, you agree to our Terms      │
│                                              │
│  [Create Account]                             │
└──────────────────────────────────────────────┘

Step 3: Record Your First Voice
┌──────────────────────────────────────────────┐
|  Your voice matters                            |
|                                               |
|  Record a quick intro so others can           |
|  hear your voice.                             |
|                                               |
|         +---------------------+               |
|         |                     |               |
|         |  [Record button]    |               |
|         |  Hold to introduce  |               |
|         |  yourself           |               |
|         |                     |               |
|         +---------------------+               |
|                                               |
|  You can always do this later                 |
|                          [Skip For Now]       |
└──────────────────────────────────────────────┘

Step 4: Pick Your Interests
┌──────────────────────────────────────────────┐
│  What are you into?                          │
│  Pick a few topics to personalize your feed │
│                                              │
│  ┌────────┐ ┌────────┐ ┌────────┐           │
│  │ Music  │ │ Tech   │ │ Comedy │           │
│  └────────┘ └────────┘ └────────┘           │
│  ┌────────┐ ┌────────┐ ┌────────┐           │
│  │ Sports │ │ Gaming │ │ News   │           │
│  └────────┘ └────────┘ └────────┘           │
│  ┌────────┐ ┌────────┐ ┌────────┐           │
│  │ Art    │ │ Science│ │ ASMR   │           │
│  └────────┘ └────────┘ └────────┘           │
│                                              │
│  [Continue →]                                │
└──────────────────────────────────────────────┘

Step 5: Follow Suggested Accounts
┌──────────────────────────────────────────────┐
│  Follow some voices to fill your feed!       │
│                                              │
│  ┌──────┐ @musician · Music producer        │
│  │ avtr │ [Follow]                           │
│  └──────┘                                    │
│  ┌──────┐ @comedian · Daily laughs          │
│  │ avtr │ [Follow]                           │
│  └──────┘                                    │
│  ┌──────┐ @techpod · Tech discussions       │
│  │ avtr │ [Follow]                           │
│  └──────┘                                    │
│                                              │
│  [Follow All]               [Finish Setup]  │
└──────────────────────────────────────────────┘

Step 6: Welcome & Tutorial Overlay
┌──────────────────────────────────────────────┐
|  You're all set!                             |
│                                              │
│  [Overlay tooltips:                          │
│   → "Tap here to record your first post"     │
│   → "Scroll to discover voices"              │
│   → "Heart icon to like"                     │
│  ]                                           │
│                                              │
│  [Start Using VoiceFlow]                     │
└──────────────────────────────────────────────┘
```

---

## 18. EMPTY STATES, LOADING & ERROR STATES

### 18.1 Empty States

| Screen | Illustration | Message | Action |
|--------|-------------|---------|--------|
| Feed (no posts) | Sound waves in void | "Your feed is quiet." | "Follow some voices to hear what they're saying" |
| Feed (all caught up) | Checkmark with waves | "You're all caught up!" | "Discover new voices or check back later" |
| Messages (empty) | Empty chat bubbles | "No messages yet" | "Start a conversation with someone" |
| Notifications (empty) | Bell with waves | "No notifications" | "Your activity will appear here" |
| Search (no results) | Magnifying glass | "Nothing found" | "Try different keywords or browse trending" |
| Profile (no posts) | Microphone | "No posts yet" | "Record your first voice post" |
| Liked posts (empty) | Heart | "No likes yet" | "Explore the feed and like some posts" |
| Blocked list (empty) | Shield | "No blocked users" | "You're all clear" |

### 18.2 Loading States

**Feed Skeleton:**
```
┌──────────────────────────────────────────────┐
│  ┌──────┐ ████████ ██████                   │
│  │ ████ │                                     │
│  └──────┘                                     │
│                                              │
│  ████████████████████████                     │
│  ████████████████████████  ← Shimmer bars    │
│  ████████████████████████                     │
│                                              │
│  ████████  ████████  ████████                │
└──────────────────────────────────────────────┘
```

**Voice Player Loading:**
```
┌──────────────────────────────────────────────┐
│  Flat line with slight shimmer               │
│  ───────────────────────────────────────     │
│  Loading audio...                             │
└──────────────────────────────────────────────┘
```

### 18.3 Error States

| Error | Message | Recovery |
|-------|---------|----------|
| Network offline | "You're offline" | Auto-retry when connection restores |
| API rate limited | "Taking a breather" | "Try again in a moment" with countdown |
| Post failed to load | "Couldn't load this post" | "Tap to retry" |
| Upload failed | "Upload failed" | "Retry upload" button |
| Auth expired | "Session expired" | "Log in again" redirect |
| 404 Not found | "This page doesn't exist" | "Go home" button |
| Server error | "Something went wrong" | "Try again" with exponential backoff |

---

## 19. SETTINGS & PREFERENCES UI

### 19.1 Settings Structure

```
Settings
├── Account
│   ├── Edit Profile
│   ├── Change Password
│   ├── Connected Apps
│   └── Delete Account
├── Notifications
│   ├── Likes (toggle)
│   ├── Replies (toggle)
│   ├── Follows (toggle)
│   ├── Reposts (toggle)
│   ├── Mentions (toggle)
│   └── Quiet Hours (time range)
├── Privacy
│   ├── Blocked Users (list + manage)
│   ├── Muted Users (list + manage)
│   ├── Muted Words (list + manage)
│   ├── Content Filtering (label preferences)
│   └── Profile Visibility (public/followers)
├── Accessibility
│   ├── Reduced Motion (toggle)
│   ├── Transcript Display (always/on demand)
│   ├── Playback Speed (1x, 1.25x, 1.5x, 2x)
│   └── High Contrast (toggle)
├── Display
│   ├── Theme (dark/light/system)
│   ├── Font Size (small/medium/large)
│   └── Feed Density (comfortable/compact)
└── About
    ├── Terms of Service
    ├── Privacy Policy
    └── Version
```

### 19.2 Settings Component Patterns

- **Toggle switches**: For binary preferences (notifications on/off)
- **Chip selection**: For multi-select (content filters)
- **Range slider**: For time ranges (quiet hours)
- **List with actions**: For blocked/muted users
- **Radio group**: For single-select options (theme, font size)
- **Pill navigation**: For settings categories

---

## 20. RESPONSIVE DESIGN & BREAKPOINTS

### 20.1 Breakpoint Definitions

```css
/* Tailwind default breakpoints used */
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet portrait */
lg: 1024px  /* Tablet landscape / small desktop */
xl: 1280px  /* Standard desktop */
2xl: 1536px /* Large desktop */

/* Custom breakpoints for our layout */
@custom-media --mobile (max-width: 767px);
@custom-media --tablet (768px <= width <= 1023px);
@custom-media --desktop (1024px <= width <= 1279px);
@custom-media --desktop-wide (1280px <= width);
```

### 20.2 Layout by Breakpoint

| Element | Mobile (<768px) | Tablet (768-1023) | Desktop (1024-1279) | Wide Desktop (1280+) |
|---------|----------------|-------------------|--------------------|---------------------|
| Navigation | Bottom tab bar (fixed) | Bottom tab bar | Left sidebar (280px) | Left sidebar (280px) |
| Feed | Full width | Max 600px centered | Max 640px | Max 640px |
| Right Sidebar | Hidden | Hidden | Hidden | Visible (320px) |
| Compose FAB | Bottom-right floating | Bottom-right floating | Post button in sidebar | Post button in sidebar |
| Modal | Full screen | Centered, max 480px | Centered, max 480px | Centered, max 480px |
| Bottom Sheet | Full width, 80% height | Max 480px, centered | Centered sheet | Centered sheet |
| DM | Full screen modal | Full screen modal | Right sidebar panel | Right sidebar panel |
| Notifications | Full screen | Full screen | Right sidebar panel | Right sidebar panel |

### 20.3 Safe Area Handling

```css
/* iOS safe areas */
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.safe-top {
  padding-top: env(safe-area-inset-top, 0px);
}
.safe-left {
  padding-left: env(safe-area-inset-left, 0px);
}
.safe-right {
  padding-right: env(safe-area-inset-right, 0px);
}

/* Bottom tab bar with safe area */
.bottom-tab-bar {
  padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));
  height: calc(4rem + env(safe-area-inset-bottom, 0px));
}
```

---

## 21. ACCESSIBILITY COMPLIANCE

### 21.1 WCAG 2.1 AA Targets

| Requirement | Standard | Our Implementation |
|-------------|----------|-------------------|
| Color contrast | 4.5:1 for text, 3:1 for large text | All text colors tested against backgrounds |
| Touch targets | 44x44px minimum | All interactive elements meet this |
| Keyboard navigation | Full keyboard support | All shadcn/ui components are keyboard-accessible |
| Screen reader | Semantic HTML + ARIA | aria-labels on all icons, roles on custom components |
| Focus indicators | Visible focus ring | 2px brand-colored ring on all focusable elements |
| Transcripts | Audio content must have text alternative | Auto-generated transcripts for all voice posts |
| Reduced motion | Respect prefers-reduced-motion | Animation duration set to 0.01ms |

### 21.2 Accessibility Features Specific to Voice App

- **Transcripts**: Every voice post auto-generates transcript. Displayed inline below player, expandable.
- **Playback speed**: 1x, 1.25x, 1.5x, 2x options for voice content
- **Visual indicators**: Recording state indicated not just by color (red) but also by text label "Recording"
- **Skip silence**: Option to auto-skip silent sections in voice posts
- **Captions**: Auto-generated closed captions overlaid on voice player
- **High contrast mode**: Toggle that increases all contrast ratios to AAA level

### 21.3 ARIA Implementation Notes

```tsx
// Voice player accessibility
<button
  aria-label={isPlaying ? 'Pause voice post' : 'Play voice post'}
  aria-pressed={isPlaying}
  onClick={togglePlay}
>
  {isPlaying ? <PauseIcon /> : <PlayIcon />}
</button>

// Progress bar accessibility
<div
  role="progressbar"
  aria-valuenow={currentTime}
  aria-valuemin={0}
  aria-valuemax={duration}
  aria-label={`Voice post progress: ${formatTime(currentTime)} of ${formatTime(duration)}`}
>
  <div style={{ width: `${(currentTime / duration) * 100}%` }} />
</div>
```

---

## 22. COMPONENT ARCHITECTURE & SHADCN/UI MAPPING

### 22.1 shadcn/ui Components We Use

| shadcn Component | Our Use |
|-----------------|---------|
| `Button` | All action buttons (follow, post, submit, etc.) |
| `Card` | Feed cards, profile cards, whatever cards |
| `Dialog` | Modals (report, confirm actions, compose on desktop) |
| `Sheet` | Bottom sheets (mobile compose, sharing, settings panels) |
| `DropdownMenu` | Three-dot menus on posts, profile actions |
| `Popover` | Emoji picker, mood picker, tooltips |
| `Tabs` | Profile tabs (posts/replies/media/likes) |
| `Input` | Text fields, search bar |
| `Textarea` | Caption input in composer |
| `Form` | Login/signup forms, settings forms |
| `Avatar` | User avatars everywhere |
| `Badge` | Notification counts, verified badges, mood tags |
| `Toast` | Success/error notifications (sonner) |
| `Tooltip` | Icon labels, hint text |
| `Skeleton` | Loading states for feed cards and profiles |
| `Switch` | Toggle controls (settings) |
| `Select` | Dropdown selections (language, privacy settings) |
| `Slider` | Range controls (volume, quiet hours) |
| `Separator` | Dividing sections |
| `ScrollArea` | Scrollable notification/message lists |
| `Command` | Search command palette (⌘K) |
| `Progress` | Upload progress, profile completion |

### 22.2 Custom Components We Build

| Component | Description | Composition |
|-----------|-------------|-------------|
| `VoicePlayer` | Waveform + play/pause + progress | Custom canvas + shadcn Button |
| `VoiceRecorder` | Record button + waveform + timer | Custom (MediaRecorder integration) |
| `FeedCard` | Post display card | shadcn Card + VoicePlayer + Custom |
| `PostComposer` | Main creation flow | Custom (voice recording + text + media) |
| `Waveform` | Audio visualization component | Custom canvas/svg |
| `MoodPicker` | Voice mood selection | shadcn Popover + Custom grid |
| `StoryRing` | Story status indicator | Custom (gradient border + image) |
| `StoryViewer` | Full-screen story playback | Custom (full-screen overlay) |
| `DMConversation` | Message list + input | Custom (scroll + input) |
| `MessageBubble` | Individual message | Custom (asymmetric bubble) |
| `NotificationCard` | Notification display | Custom (icon + text + time) |
| `ProfileHeader` | Profile header block | Custom (avatar + bio + stats) |
| `SuggestedUser` | Follow suggestion card | shadcn Card + Avatar + Button |
| `TrendingTag` | Trending hashtag display | Custom chip with count |
| `TranscriptDisplay` | Expandable transcript | Custom animated expand |

### 22.3 Component Tree (Simplified)

```
App
├── Navigation
│   ├── BottomTabBar (mobile)
│   │   └── TabItem (home, search, compose, activity, profile)
│   └── Sidebar (desktop)
│       ├── Logo
│       ├── NavItem[] (sidebar links)
│       └── UserMenu
├── Layout
│   ├── FeedColumn
│   │   ├── FeedList
│   │   │   ├── FeedCard (voice)
│   │   │   │   ├── PostHeader
│   │   │   │   ├── VoicePlayer
│   │   │   │   ├── PostContent
│   │   │   │   ├── PostTags
│   │   │   │   └── PostActions
│   │   │   ├── FeedCard (text)
│   │   │   └── FeedCard (image)
│   │   └── LoadMoreTrigger
│   └── RightSidebar (desktop-wide only)
│       ├── SearchBar
│       ├── TrendingTags
│       └── SuggestedUsers
├── Composer (modal/sheet)
│   ├── VoiceRecorder
│   ├── TextInput
│   └── Toolbar
├── Profile
│   ├── ProfileHeader
│   │   ├── Avatar
│   │   ├── VoiceBio
│   │   └── ProfileStats
│   ├── ProfileTabs
│   └── ContentGrid
├── Messages
│   ├── ConversationList
│   └── ConversationView
│       ├── MessageBubble[]
│       └── MessageInput
├── Notifications
│   ├── NotificationFilters
│   └── NotificationList
│       └── NotificationCard[]
├── Search
│   ├── SearchBar
│   └── SearchResults
│       ├── UserResults
│       ├── PostResults
│       └── TagResults
└── Settings
    ├── SettingsNav
    └── SettingsPanels
```

---

## 23. APPENDICES: BLUESKY CLIENT UX COMPARISONS

### 23.1 Official Bluesky Web App — Design Analysis

**Layout:** Three-column responsive (Left nav, center feed, right widgets)
**Nav:** Left sidebar with icon + label (Home, Search, Notifications, Profile, Settings, Feeds)
**Feed cards:** Compact, high density. Shows avatar, name, handle, timestamp, text, media, action bar
**Strengths:** Clean, accessible, cross-platform consistency via React Native Web
**Weaknesses:** Can feel generic, lacks personality, text-first approach, no audio-specific optimization

### 23.2 Graysky — Design Analysis

**Layout:** Tab-based navigation, bottom tabs on mobile, custom feed switching
**Nav:** Bottom tabs: Home, Search, Notifications, Profile. Custom feeds accessible from top bar
**Feed cards:** Similar to official but with richer interaction previews (GIFs inline, translations)
**Strengths:** GIF support, translations, power-user features, custom feed management
**Weaknesses:** Mobile-first, web version less polished than native apps

### 23.3 Klearsky — Design Analysis

**Layout:** Single-column minimalist web design
**Nav:** Top bar with settings, feeds as horizontally scrollable tabs
**Feed cards:** Clean, stripped-back, prioritizes content over chrome
**Strengths:** Fast loading, lightweight, great for reading, modular architecture
**Weaknesses:** Sparse feature set, less visual appeal

### 23.4 SkyFeed — Design Analysis

**Layout:** Multi-column dashboard (user-configurable columns)
**Nav:** Custom column system — add/remove/rearrange columns for feeds, search, profiles
**Feed cards:** Compact, dashboard-optimized
**Strengths:** Feed builder UX is innovative, power-user focused
**Weaknesses:** Overwhelming for casual users, desktop-only mindset

### 23.5 WhiteWind — Design Analysis

**Layout:** Blog-inspired single column, focus on typography
**Nav:** Minimal — just a feed list and settings
**Feed cards:** Long-form reading cards with Markdown rendering
**Strengths:** Excellent typography, clean reading experience, custom records for blogs
**Weaknesses:** Not a social media UX, no audio features

### 23.6 Design Lessons for VoiceFlow

| Lesson | Source | Application |
|--------|--------|-------------|
| Keep it simple | Klearsky | Don't overload voice cards with too much metadata |
| Power users need options | Graysky/SkyFeed | Provide feed customization but as progressive enhancement |
| Typography matters | WhiteWind | Use Plus Jakarta Sans + Inter for readability |
| Consistency is key | Official app | Use the same component patterns across all surfaces |
| Audio needs its own UI | None exist | VoiceFlow must invent voice-first card designs |
| Custom feeds are valued | All clients | Integrate custom feed support (Bluesky feed generators) |
| GIFs increase engagement | Graysky | Include GIF picker in composer |
| Don't hide the social graph | All | Make followers, following, likes visible and accessible |
| Empty states need personality | Klearsky | Create warm, encouraging empty states (not just "Nothing here") |

---

*This design specification is meant to be a living document. As development progresses and user testing provides feedback, these guidelines should be updated. The core design principles — voice-first warmth, glassy dark aesthetics, and emotional color — should remain consistent throughout evolution.*

*Document generated July 22, 2026. Based on comprehensive research across Bluesky third-party clients (Graysky, Klearsky, SkyFeed, WhiteWind, Frontpage), Instagram, Twitter/X, TikTok, Discord, Spotify, and Clubhouse design systems, combined with design psychology and accessibility best practices.*
