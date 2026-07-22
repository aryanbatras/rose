# Rose — Implementation History & Decision Log

> **Date:** July 22, 2026  
> **Purpose:** Track all significant changes, architectural decisions, bugs fixed, and design rationale

---

## 1. Project Origins

Rose began as a social media project called **VoiceFlow**, originally conceptualized as a voice-first social network. During implementation, the focus shifted to a **visual-first, Instagram-like experience** built on Bluesky's AT Protocol infrastructure.

### Key Initial Decisions

| Decision | Rationale |
|----------|-----------|
| Build on AT Protocol (Bluesky) | Zero infrastructure cost, free PDS hosting, no database needed |
| No custom database | All social data comes from Bluesky's PDS; only localStorage for preferences |
| Next.js App Router | Server-side AT Protocol calls (tokens never leak), API routes, SSR |
| Zustand over Redux | Simpler API, built-in persist middleware, smaller bundle |
| TanStack Query over SWR | Better TypeScript support, built-in infinite queries, mature ecosystem |

---

## 2. Brand Evolution

### VoiceFlow → Rose

| Aspect | Before | After |
|--------|--------|-------|
| Name | VoiceFlow | Rose |
| Brand color | Yellow (`#FFDD00`) | Soft pink (`oklch(0.64 0.20 355)`) |
| Storage keys | `voiceflow-auth`, `voiceflow-filters`, etc. | `rose-auth`, `rose-filters`, etc. |
| Cookie name | `voiceflow_session` | `rose_session` |
| Spells author | `voiceflow` | `rose.app` |
| GitHub repo | `aryanbatras/voiceflow` | `aryanbatras/rose` |

**Rebrand scope**: 41 files changed, 319 insertions, 224 deletions.

---

## 3. Feature Implementation Timeline

### Phase 1: Foundation
- **AT Protocol Integration**: BskyAgent creation, session management, cookie-based auth
- **Authentication**: Login, signup, session refresh, logout
- **Core Types**: FeedItem, ActorView, Label, PostRecord, PaginatedResponse
- **Feed Service**: getTimeline, getCustomFeed, getAuthorFeed, searchPosts
- **Basic Feed Page**: Single-column feed with FeedCard component

### Phase 2: Instagram-like UI
- **Design System**: Borderless layout, soft pink brand, warm off-white background
- **Feed Redesign**: Icon-free post cards, large images, like text instead of heart
- **Grid View**: 3-column media grid for Search/Discover
- **Stories Row**: Horizontal scrolling story rings
- **Feed Source Picker**: Dropdown with Following, Trending, Discover, custom feeds
- **View Mode Toggle**: Grid vs Classic view

### Phase 3: Advanced Features
- **Discover Page**: Browse 50k+ Bluesky feeds via `getPopularFeedGenerators`
- **Image Editor**: Canvas-based filters, adjust, crop, rotate, text, stickers, doodle, collage
- **Image Compression**: `browser-image-compression` for upload optimization
- **Reels**: Full-screen vertical video feed with HLS playback, multi-source aggregation
- **Thread View**: Recursive reply rendering with connector lines
- **Groups & Messages**: Bluesky Chat (Convo) API integration
- **Spells**: Digital wellness system with 8 predefined spells
- **Bookmarks**: Client-side bookmark store
- **Notifications**: List, unread count, mark-as-read
- **Search**: Debounced search with infinite scroll grid
- **NSFW Filtering**: Server-side content filtering by Bluesky moderation labels

---

## 4. Bugs Fixed & Issues Resolved

### 4.1 Feed Source Switching
**Problem**: Dynamic query keys in `useFeed` hook weren't updating when feed source changed, causing stale data.
**Fix**: Added `feedUri` to query key array, split API route routing for discover/following/custom.

### 4.2 Infinite Scroll Loops
**Problem** (multiple occurrences): IntersectionObserver callbacks causing fetch loops when state updates trigger observer recreation.

**Root cause pattern**: State changes in effect dependencies → observer teardown → new observer created → fires immediately (sentinel still visible) → starts new fetch → state changes → cycle repeats.

**Fix pattern**: Use `useRef` as a fetching guard (`fetchingRef.current`) that is set to `true` during fetch and `false` in `.finally()`. Observer callback checks `fetchingRef.current` before starting any new fetch.

**Applied to**:
- Reels page (discover + following sources)
- Discover page (popular feeds infinite scroll)
- Feed page (timeline infinite scroll)

### 4.3 Reels Auto-scroll Reset
**Problem**: When load-more appended new reels, scroll jumped back to reel #1 because the auto-scroll effect fired on EVERY `reels.length` change.

**Fix**: Added `initialLoadedRef` ref that tracks whether the initial load has happened. Auto-scroll only fires on the transition from empty → non-empty. Resets properly when switching feeds.

### 4.4 Reply Thread Layout
**Problems reported**:
1. "Comments shrink to one letter per row at deep nesting"
2. "Lines everywhere" (visual noise from connector lines)
3. "Unreadable deep replies due to opacity fade"
4. "Thread line doesn't track with content" (misaligned vertical line)

**Fixes**:
| Issue | Before | After |
|-------|--------|-------|
| Indentation | 40px per level | 16px per level (Instagram-like) |
| Connectors | Vertical + horizontal lines | Single thin vertical line only |
| Opacity | `max(1 - depth * 0.08, 0.6)` | Constant `opacity: 1` |
| Line position | Hardcoded `left-[18px]` | Calculated: `depth * 16 + 18` |

### 4.5 Duplicate Keys in Sidebar
**Problem**: "Encountered two children with the same key, `/feed`" — Home and Reels both used `/feed` path.

**Fix**: Changed keys to use `entry.icon` instead of `entry.path`, since each nav item has a unique icon.

### 4.6 FeedAPI 500 Errors
**Problem**: Custom feeds returning 500 "Failed to fetch feed" — AT Protocol JSON parsing issues with certain feed generators.

**Fix**: Added try/catch in feed API route that returns `{ items: [], cursor: undefined }` on error instead of crashing. This prevents the UI from breaking on problematic feeds.

### 4.7 Post Thread FeedCard Rendering
**Problem**: `FeedCard` inside thread view had duplicated share buttons and broken interaction layout.

**Fix**: Redesigned PostCard for the feed page to be icon-free. Thread view keeps `FeedCard` with full interaction row.

---

## 5. Design Evolution

### 5.1 From Yellow to Pink
Original brand color was yellow (`#FFDD00`). Changed to soft pink (`oklch(0.64 0.20 355)`) for a "cute, Instagram-like" feel.

**Why pink?**
- Matches the "Rose" name
- Softer and more welcoming than yellow
- Instagram uses pink/purple gradient — market familiarity
- Works well on both light and dark backgrounds

### 5.2 From Bordered to Borderless
Original design had visible borders on cards and posts. Evolved to fully borderless:
- Cards separated by whitespace and subtle shadows instead of borders
- Border color (`--border`) is now barely visible (`oklch(0.90 0.004 80)`)
- Sidebar has no right border (used to have `border-r`)

### 5.3 From Icon-heavy to Icon-free Feed
Original feed had like, comment, share, repost buttons with icons. Evolved to:
- **Zero icons** on the main feed
- Like count text IS the like button
- Caption is clickable → thread view
- No comment/share/repost buttons visible on feed
- Full interaction row only shown on Thread view (`FeedCard`)

### 5.4 From Three-Column to Single-Column Default
Original default was a 3-column grid. Evolved to:
- **Single-column classic view** as default (Instagram-like)
- Grid view available on Search/Discover only
- Clear separation: Home = classic media feed, Search = grid media grid

---

## 6. Spells: Digital Wellness System

Spells are a unique feature — client-side "spells" that modify app behavior without any API calls.

### Architecture
```
Spell definitions (static) → Spell store (Zustand, localStorage) → useSpells() hook (evaluates conditions) → Components (conditional rendering)
```

### Design Decisions
| Decision | Rationale |
|----------|-----------|
| Client-side only | No server involvement needed; spells are personal preferences |
| LocalStorage persistence | Spells persist across sessions without login |
| Predefined only (no custom) | Avoids complexity of a spell-editor UI |
| Time-based conditions | Evaluated via `new Date().getHours()` — no server clock needed |
| Interval reminders | Implemented with `setInterval` in `useSpells` hook |

---

## 7. NSFW Content Filtering

### Research Findings
- Bluesky uses moderation labels: `porn`, `sexual`, `nudity`, `graphic-media`
- Labels appear on POSTS (`post.labels`) and AUTHORS (`post.author.labels`)
- The AT Protocol API does NOT support server-side content filtering — you must filter client-side after fetching
- NSFWJS (TensorFlow.js) is available for image-level detection but requires a 10-20MB model download

### Implementation Decision
**Chose label-based filtering** over client-side image detection because:
1. **Zero model download** — no 20MB TF model to load
2. **Covers text posts too** — labels apply to accounts, not just images
3. **Better accuracy** — Bluesky's moderation team labels content reliably
4. **Lower latency** — synchronous check vs async model inference
5. **No false positives** — labels are authoritatively applied

### Applied To
All content-returning service functions: `getTimeline`, `getAuthorFeed`, `getCustomFeed`, `searchPosts`, `normalizeThreadNode`, `getFeedPosts`.

---

## 8. Key Technical Lessons

### 8.1 Ref Pattern for Infinite Scroll
Using `useRef` for fetching guards instead of state is CRITICAL for preventing infinite loops. The ref bypasses React's closure/staleness issues and doesn't trigger re-renders.

### 8.2 `'use server'` Constraints
All exported functions in a `'use server'` module MUST be async. Utility functions (like `isNsfwPost` and `filterNsfwItems`) must NOT be exported if they're synchronous.

### 8.3 AT Protocol Embed Structure
Bluesky returns embeds in TWO locations:
- `post.embed` = the hydrated VIEW form (actual CDN URLs, thumbnails)
- `record.embed` = the raw INPUT form (BlobRef references)

Always prefer `post.embed` for display data.

### 8.4 Bluesky Video Playback
- Bluesky delivers video via HLS playlists (`.m3u8`)
- `hls.js` library for cross-browser HLS playback
- Safari can play HLS natively without hls.js
- Video posts are RARE on Bluesky — aggressive pagination needed for Reels

### 8.5 Zustand + TanStack Query Separation
- Zustand for CLIENT state (auth, preferences, UI state)
- TanStack Query for SERVER state (feed data, posts, profiles)
- Never mix the two — if data comes from an API, use TanStack Query
