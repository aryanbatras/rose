# VOICEFLOW — Architecture & Feature Specification v2

## Pure Bluesky Integration · Zero Custom Infrastructure · User-Controlled Experience

**Date:** July 22, 2026
**Stack:** Next.js 15 · React 19 · Tailwind CSS 4 · shadcn/ui · Framer Motion · Zustand · Zod · TanStack Query

---

## TABLE OF CONTENTS

1. [Architecture Decision: Pure `app.bsky.*` APIs Only](#1-architecture-decision)
2. [Authentication & Session Management](#2-authentication--session-management)
3. [View Mode System](#3-view-mode-system)
4. [User-Controlled Filtering System](#4-user-controlled-filtering-system)
5. [Feed Source Management](#5-feed-source-management)
6. [Power Features](#6-power-features)
7. [Navigation & Layout](#7-navigation--layout)
8. [Feature Implementation Plan](#8-feature-implementation-plan)

---

## 1. ARCHITECTURE DECISION

### 1.1 Core Principle

**Zero custom infrastructure. Zero custom Lexicons. Pure `app.bsky.*` APIs only.**

VoiceFlow uses ONLY standard Bluesky AT Protocol schemas:
- `app.bsky.feed.post` — All posts
- `app.bsky.feed.like` — All likes
- `app.bsky.graph.follow` — All follows
- `app.bsky.actor.profile` — All profiles
- `app.bsky.feed.repost` — All reposts
- `app.bsky.graph.list` — All lists and curation

No `com.voiceflow.*` custom Lexicons. No custom AppView. No Feed Generator. No Firehose consumer.

### 1.2 What We Build

```
┌─────────────────────────────────────────────┐
│              VOICEFLOW APP                   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  View Modes                          │   │
│  │  ├── Classic (single-column feed)    │   │
│  │  ├── Grid (media-only masonry)       │   │
│  │  ├── Reels (full-screen vertical)    │   │
│  │  └── Compact (dense text-only)       │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  User Controls                       │   │
│  │  ├── Mute words / Hide reposts       │   │
│  │  ├── Content type filters            │   │
│  │  ├── Feed density                    │   │
│  │  ├── Hide engagement metrics         │   │
│  │  └── Custom feed picker (50K+)       │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Power Features                      │   │
│  │  ├── Private bookmarks (localStorage)│   │
│  │  ├── Keyboard shortcuts              │   │
│  │  ├── Multi-column (desktop)          │   │
│  │  └── Starter pack support            │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ALL ↓ Powered by ↓ pure ↓ app.bsky.* ↓ API │
└─────────────────────────────────────────────┘
```

### 1.3 What We DON'T Build

| Feature | Reason |
|---------|--------|
| Custom Lexicons (`com.voiceflow.*`) | Not needed — `app.bsky.*` is sufficient |
| Voice/audio recording | No infrastructure support in Bluesky |
| Feed Generator server | Zero infrastructure commitment |
| AppView / Firehose consumer | Not needed for client-side filtering |
| Database or storage | Not needed — all data in AT Protocol repos |
| OAuth / App password flow | Email+password login works directly |
| Matchmaking / Music / Astrology | Beyond scope, no API support |

---

## 2. AUTHENTICATION & SESSION MANAGEMENT

### 2.1 Login Flow

```
User enters:
  ├── Email or Handle (identifier)
  └── Bluesky password (NOT app password)
         │
         ▼
POST /api/auth/login
  └── agent.login({ identifier, password })
         │
         ▼
Session stored in:
  ├── Zustand (persisted to localStorage)
  └── HTTP cookie (for server-side API routes)
         │
         ▼
User is authenticated ✓
```

**API:** `com.atproto.server.createSession` — accepts email OR handle + password directly.

### 2.2 Session Refresh

When a 401 occurs on any API call:
1. POST `/api/auth/refresh` with `refreshJwt` from stored session
2. If refresh succeeds → update stored session, retry original request
3. If refresh fails → clear session, redirect to `/login`

### 2.3 Signup Flow

```
User clicks "Create Account"
         ↓
Cross-origin redirect → https://bsky.app/signup
         ↓
User creates Bluesky account (invite code may be required)
         ↓
User returns to VoiceFlow
         ↓
User enters identifier + password
         ↓
VoiceFlow calls createSession()
         ↓
Done ✓
```

---

## 3. VIEW MODE SYSTEM

### 3.1 Available Modes

| Mode | Icon | Description | Best For |
|------|------|-------------|----------|
| **Classic** | List | Single-column feed with full cards | Default browsing |
| **Grid** | Grid | 2-3 column masonry of media-only posts | Visual discovery |
| **Reels** | Video | Full-screen vertical video scroll with snap | Video content |
| **Compact** | AlignLeft | Dense text-only feed, minimal UI | Power users |

### 3.2 View Mode Implementation

```typescript
// Stored in Zustand (persisted to localStorage)
type ViewMode = 'classic' | 'grid' | 'reels' | 'compact';

interface ViewModeStore {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
}
```

**Classic Mode:** Current single-column feed. Full `FeedCard` component with author, text, media, and interaction row.

**Grid Mode:**
- Filter feed items for `embed.images` or `embed.video`
- Render in 2-3 column masonry grid
- Click to open thread view
- Minimal overlay shows author handle + like count on hover

**Reels Mode:**
- Filter feed items for `embed.video`
- Full-screen vertical snap-scroll
- Side action bar (like, comment, share, profile)
- Auto-play video on visibility

**Compact Mode:**
- Minimal card: avatar, author, text (truncated to 2 lines), timestamp
- No media rendering inline
- Denser spacing, smaller text
- Interaction row is minimal (like + reply only)

### 3.3 View Mode Toggle

```
Position: Top-right of feed header (desktop), bottom of header (mobile)

┌─────────────────────────────────────────────┐
│  Home                        [≡] [⊞] [▶] [≡] │
└─────────────────────────────────────────────┘
                                  ↑  ↑   ↑   ↑
                              Classic Grid Reels Compact
```

---

## 4. USER-CONTROLLED FILTERING SYSTEM

### 4.1 Filter Categories

**Content Filters** — What posts to show/hide:
```typescript
interface ContentFilters {
  hideReposts: boolean;         // Hide reposts from feed
  hideReplies: boolean;         // Hide replies from feed  
  hideQuotePosts: boolean;      // Hide quote posts
  mediaOnly: boolean;           // Only show posts with media
  videoOnly: boolean;           // Only show posts with video
  textOnly: boolean;            // Only show text-only posts
}
```

**Mute Filters** — What content to suppress:
```typescript
interface MuteFilters {
  mutedWords: string[];         // Keywords to hide
  mutedUsers: string[];         // User DIDs/handles to hide
  mutedTags: string[];          // Hashtags to hide
}
```

**Display Filters** — How content appears:
```typescript
interface DisplayFilters {
  hideEngagementMetrics: boolean;  // Hide likes/reposts counts
  feedDensity: 'comfortable' | 'compact';
  fontSize: 'small' | 'medium' | 'large';
}
```

### 4.2 Filter Application Logic

```typescript
function applyFilters(posts: FeedItem[], filters: AllFilters): FeedItem[] {
  let filtered = [...posts];

  // Content type filters
  if (filters.content.hideReposts) {
    filtered = filtered.filter(p => !p.reason?.$type?.includes('reasonRepost'));
  }
  if (filters.content.mediaOnly) {
    filtered = filtered.filter(p => !!p.record.embed);
  }
  if (filters.content.videoOnly) {
    filtered = filtered.filter(p => 
      p.record.embed?.$type === 'app.bsky.embed.video#view'
    );
  }

  // Mute filters
  if (filters.mute.mutedWords.length > 0) {
    const lowerWords = filters.mute.mutedWords.map(w => w.toLowerCase());
    filtered = filtered.filter(p => 
      !lowerWords.some(w => p.record.text.toLowerCase().includes(w))
    );
  }

  // Apply display filters at render time
  return filtered;
}
```

### 4.3 Filter UI

```
Filters panel (slide-in drawer or modal):

┌─────────────────────────────────────────────┐
│  Feed Filters                          [X]  │
├─────────────────────────────────────────────┤
│  CONTENT                                    │
│  ┌─────────────────────────────────────┐   │
│  │ [ ] Hide reposts                    │   │
│  │ [ ] Hide replies                    │   │
│  │ [ ] Hide quote posts                │   │
│  │ [ ] Media only                      │   │
│  │ [ ] Video only                      │   │
│  └─────────────────────────────────────┘   │
│                                              │
│  MUTED WORDS                                 │
│  ┌─────────────────────────────────────┐   │
│  │ [keyword] [keyword] [keyword]  [+]  │   │
│  │ Type a word and press Enter          │   │
│  └─────────────────────────────────────┘   │
│                                              │
│  DISPLAY                                    │
│  ┌─────────────────────────────────────┐   │
│  │ Feed density: [Comfortable ▾]       │   │
│  │ Font size:    [Medium ▾]            │   │
│  │ [ ] Hide likes/repost counts        │   │
│  └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  [Reset to defaults]    [Apply filters]     │
└─────────────────────────────────────────────┘
```

### 4.4 Filter State Persistence

```typescript
// Zustand store, persisted to localStorage
interface FilterStore {
  content: ContentFilters;
  mute: MuteFilters;
  display: DisplayFilters;
  setContent: (filters: Partial<ContentFilters>) => void;
  setMute: (filters: Partial<MuteFilters>) => void;
  addMutedWord: (word: string) => void;
  removeMutedWord: (word: string) => void;
  setDisplay: (filters: Partial<DisplayFilters>) => void;
  resetAll: () => void;
}
```

---

## 5. FEED SOURCE MANAGEMENT

### 5.1 Feed Sources

Users can switch between:
1. **Following** — `agent.getTimeline()` — posts from people they follow
2. **Discover** — Popular posts across the network
3. **Custom Feeds** — Any of the 50,000+ Bluesky community feeds
4. **Lists** — User-created or subscribed lists

### 5.2 Custom Feed Implementation

```typescript
// Fetch any custom feed by its URI
async function getCustomFeed(agent: BskyAgent, feedUri: string, cursor?: string) {
  const response = await agent.app.bsky.feed.getFeed({
    feed: feedUri,
    limit: 30,
    cursor,
  });
  return {
    items: response.data.feed.map(normalizeFeedItem),
    cursor: response.data.cursor,
  };
}
```

### 5.3 Feed Source UI

```
┌─────────────────────────────────────────────┐
│  [Following ▾]    [≡ Filters] [≡ Views]    │
├─────────────────────────────────────────────┤
│  Feed Sources:                               │
│  ● Following (default)                       │
│  ○ Discover                                  │
│  ○ Custom feeds...                           │
│  ○ Lists...                                  │
└─────────────────────────────────────────────┘

When "Custom feeds..." is selected:
┌─────────────────────────────────────────────┐
│  Search feeds...                              │
│                                              │
│  My Feeds:                                    │
│  ├── [X] #Music (pinned)                    │
│  ├── [X] Photography                        │
│  └── [ ] Tech News                          │
│                                              │
│  Browse Popular Feeds:                       │
│  ├── What's Hot                              │
│  ├── Trending Topics                         │
│  ├── Mutuals Only                            │
│  └── View all 50,000+ feeds...              │
└─────────────────────────────────────────────┘
```

---

## 6. POWER FEATURES

### 6.1 Private Bookmarks

```typescript
// Stored entirely in localStorage — no server needed
interface Bookmark {
  uri: string;
  cid: string;
  author: { handle: string; displayName?: string; avatar?: string };
  text: string;
  savedAt: string;  // ISO timestamp
}

// Zustand store, persisted
interface BookmarkStore {
  bookmarks: Bookmark[];
  addBookmark: (post: FeedItem) => void;
  removeBookmark: (uri: string) => void;
  isBookmarked: (uri: string) => boolean;
}
```

### 6.2 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `j` | Next post |
| `k` | Previous post |
| `l` | Like post |
| `r` | Reply (open thread) |
| `s` | Share |
| `b` | Bookmark |
| `/` | Focus search |
| `n` | New post (compose) |
| `Esc` | Close modal/return |
| `1`-`4` | Switch view mode |
| `?` | Show shortcuts help |

### 6.3 Multi-Column Mode (Desktop)

```
1280px+ screens:

┌─────────────┬──────────────┬──────────────┐
│   Column 1  │   Column 2   │   Column 3   │
│  Following  │  Discover    │  Bookmarks   │
│             │              │              │
│  post       │  post        │  post        │
│  post       │  post        │  post        │
│  post       │  post        │  post        │
│  post       │  post        │  post        │
└─────────────┴──────────────┴──────────────┘

Users can:
  - Add/remove columns
  - Choose source per column
  - Reorder columns via drag
  - Save column layouts
```

### 6.4 Starter Pack Support

```typescript
// Create a starter pack with curated follows
async function createStarterPack(
  agent: BskyAgent,
  name: string,
  description: string,
  dids: string[],
  feedUris?: string[]
) {
  // Create the starter pack record
  await agent.app.bsky.graph.starterpack.create(
    { repo: agent.session!.did },
    {
      name,
      description,
      list: starterPackListUri,   // Points to a curation list
      feeds: feedUris?.map(uri => ({ uri })),
      createdAt: new Date().toISOString(),
    }
  );
}
```

---

## 7. NAVIGATION & LAYOUT

### 7.1 Desktop Layout (1024px+)

```
┌────────────┬──────────────────────┬──────────────┐
│            │                      │              │
│  Sidebar   │      MAIN            │  Trends      │
│  240px     │     CONTENT          │  320px       │
│            │   (feed/search/      │  (search,    │
│  Home      │    profile/notif)    │   quick      │
│  Search    │                      │   links,     │
│  Notifs    │                      │   footer)    │
│  Feeds     │                      │              │
│  Bookmarks │                      │              │
│  Profile   │                      │              │
│  Settings  │                      │              │
│            │                      │              │
│  [Compose] │                      │              │
│            │                      │              │
└────────────┴──────────────────────┴──────────────┘
```

### 7.2 Mobile Layout (<1024px)

```
┌────────────────────────────────────┐
│  [≡]  Home  [Filters▾]  [Views▾] │
├────────────────────────────────────┤
│                                    │
│           Feed Content             │
│                                    │
├────────────────────────────────────┤
│  [🏠] [🔍] [+] [🔔] [👤]  (bottom nav)│
└────────────────────────────────────┘
```

### 7.3 Sidebar Navigation

| Icon | Label | Path | Notes |
|------|-------|------|-------|
| Home | Home | `/feed` | Primary feed |
| Search | Search | `/search` | Search page |
| Bell | Notifications | `/notifications` | Badge for unread |
| Grid | Feeds | `/discover` | Feed discovery |
| Bookmark | Bookmarks | `/bookmarks` | Private bookmarks |
| User | Profile | `/profile/{handle}` | Dynamic based on session |
| Settings | Settings | `/settings` | App settings |
| + | Compose | `/compose` | Pill button at bottom |

---

## 8. FEATURE IMPLEMENTATION PLAN

### Phase 1: Fix Existing App
- Remove ALL mock/hardcoded data from components
- Verify every API call works with live Bluesky data
- Test auth flow (email+password login, session persistence, refresh)
- Remove TrendsSidebar dummy data (already done)
- Remove discover page placeholder content (already done)

### Phase 2: View Mode System
- Create `stores/view-mode-store.ts` (Zustand, persisted)
- Create `ViewModeToggle` component
- Create `GridView` component (media-only masonry)
- Create `ReelsView` component (full-screen video)
- Create `CompactView` component (dense text)
- Integrate view mode with feed page

### Phase 3: Filtering System
- Create `stores/filter-store.ts` (Zustand, persisted)
- Create `FilterPanel` component (slide-in drawer)
- Apply client-side filters to feed data
- Mute word management UI
- Content type filter UI
- Display preference controls

### Phase 4: Feed Source Management
- Create `stores/feed-source-store.ts`
- Create `FeedSourcePicker` component
- Add custom feed query support via `app.bsky.feed.getFeed`
- Add list browsing via `app.bsky.graph.getList`
- Persist user's feed subscriptions locally

### Phase 5: Power Features
- Create `stores/bookmark-store.ts` (localStorage only)
- Create `BookmarkButton` component
- Create `BookmarksPage` component
- Add keyboard shortcut handler hook
- Create multi-column layout for desktop
- Create `ColumnManager` component

### Phase 6: UI Polish
- Apply Klearsky-inspired clean design
- Smooth animations (Framer Motion)
- Dark theme refinement
- Responsive design pass
- Loading states and empty states
- Accessibility audit

---

*End of spec. All features use pure `app.bsky.*` APIs with zero custom infrastructure.*
