# Rose — Architecture Overview

> **Date:** July 22, 2026  
> **Project:** Rose (formerly VoiceFlow)  
> **Description:** A visual-first social media client powered by the AT Protocol (Bluesky), designed as an Instagram-like experience with a focus on photos/videos, minimalist UI, and unique features like Spells (client-side digital wellness).

---

## 1. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 15 (App Router) | Server-rendered React app with API routes |
| **Language** | TypeScript 5.x | Type safety across the entire codebase |
| **Styling** | Tailwind CSS v4 | Utility-first styling with CSS custom properties |
| **State / Server** | TanStack Query v5 | Server state caching & infinite queries |
| **State / Client** | Zustand (with persist) | Client-side state (auth, feed sources, filters) |
| **Fonts** | Geist (body), Plus Jakarta Sans (headings) | Clean, modern typography |
| **UI / Animation** | Framer Motion, Lucide Icons | Micro-interactions, icons |
| **Backend** | AT Protocol (Bluesky) | All social data (posts, profiles, feeds, likes) |
| **Auth** | AT Protocol OAuth + JWT | Bluesky did:plc identity & session tokens |
| **Package Manager** | npm / pnpm | Dependency management |
| **Deployment** | Vercel (planned) | Hosting (free tier) |

---

## 2. Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/                # All server-side API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── compose/        # Post creation
│   │   ├── feed/           # Feed data (timeline, custom, author, thread, likes, generators)
│   │   ├── graph/          # Social graph (follow, followers, following, search, suggestions)
│   │   ├── groups/         # AT Protocol chat groups
│   │   ├── interact/       # Social interactions (like, unlike, repost, delete)
│   │   ├── notifications/  # Notifications (list, read, unread count)
│   │   ├── profile/        # Profile data & updates
│   │   └── search/         # Post search
│   ├── feed/               # Main feed page
│   ├── reels/              # Vertical video feed
│   ├── discover/           # Feed browser & people discovery
│   ├── search/             # Search page
│   ├── compose/            # Post composer with image editor
│   ├── profile/            # User profiles
│   ├── notifications/      # Notifications inbox
│   ├── bookmarks/          # Bookmarked posts
│   ├── spells/             # Digital wellness spells
│   ├── groups/             # Chat groups & direct messages
│   ├── messages/           # Direct messages
│   ├── settings/           # App settings
│   ├── login/              # Login page
│   ├── signup/             # Signup page
│   └── layout.tsx          # Root layout with sidebar + mobile nav
│
├── components/
│   ├── ui/                 # Primitive UI (Avatar, Button, Input, Skeleton)
│   ├── navigation/         # Sidebar, MobileNav, TrendsSidebar
│   ├── feed/               # FeedCard, ReplyThread, BlueskyVideoPlayer, FilterPanel, etc.
│   ├── compose/            # ImageEditor (canvas-based image editing)
│   ├── profile/            # ProfileHeader
│   └── providers.tsx       # TanStack Query provider
│
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts          # Authentication & session management
│   ├── useFeed.ts          # Feed data (timeline, author, thread, likes)
│   ├── useSearch.ts        # Search (debounced + infinite)
│   ├── useProfile.ts       # Profile data & suggestions
│   ├── useNotifications.ts # Notification polling & unread count
│   ├── useSpells.ts        # Active spell effects
│   ├── useKeyboardShortcuts.ts
│   ├── useGSDPScrollAnimation.ts
│   ├── useGroupPolling.ts
│   └── useGroupMessagePolling.ts
│
├── services/               # Server-only AT Protocol logic
│   ├── agent.ts            # BskyAgent creation, session management, auth
│   ├── posts.ts            # Timeline, custom feeds, search, CRUD, thread, NSFW filter
│   ├── feeds.ts            # Feed generators, curation, NSFW filter
│   ├── graph.ts            # Followers, following, search actors
│   ├── groups.ts           # Chat groups (Convo API)
│   └── notifications.ts    # Notification fetching
│
├── stores/                 # Zustand persisted stores
│   ├── auth-store.ts       # Session data (Zustand + localStorage)
│   ├── feed-source-store.ts # Active feed source & saved feeds
│   ├── filter-store.ts     # Content filters (media only, hide reposts, etc.)
│   ├── view-mode-store.ts  # Grid vs Classic toggle
│   ├── bookmark-store.ts   # Bookmarked posts
│   ├── spell-store.ts      # Active spells state
│   └── group-name-store.ts # Group display name cache
│
├── types/                  # TypeScript type definitions
│   ├── atproto.ts          # AT Protocol types (FeedItem, ActorView, Label, etc.)
│   ├── spells.ts           # Spell types & predefined spells
│   └── chat.ts             # Chat & group message types
│
├── lib/
│   └── time.ts             # Relative time formatting
│
└── utils/
    └── imageCompress.ts    # Browser-image-compression wrapper
```

---

## 3. Key Architecture Decisions

### 3.1 No Database — Full AT Protocol Dependency
Rose stores **zero user data** in its own database. All social data (posts, profiles, likes, follows, notifications) is fetched directly from the AT Protocol network via Bluesky's Personal Data Servers (PDS). The only local storage is:
- **Zustand** persisted to `localStorage` (auth session, UI preferences, bookmarks)
- **Cookies** for server-side session validation (`rose_session`)

This means:
- No backend infrastructure costs
- No data migration needed
- User data is portable (can move to any AT Protocol client)
- **Trade-off**: Limited to what Bluesky's API supports (no custom recommendation algorithms, no custom data models)

### 3.2 Server-Only AT Protocol Client
All AT Protocol API calls happen in **server-side service modules** (`src/services/`) using `'use server'` directives. This means:
- Access tokens never leak to the client
- BskyAgent is created fresh per request (no stale singleton)
- Session is validated server-side via cookies or `X-AT-Session` header
- **NSFW filtering** happens server-side before data reaches the client

### 3.3 Client-Side Data Layer
TanStack Query (`@tanstack/react-query`) manages all server state on the client:
- `useInfiniteQuery` for paginated feeds (timeline, custom feeds, author feed, search)
- `useQuery` for single-request data (thread, likes, notifications)
- Cache `staleTime` of 15-30 seconds for freshness without over-fetching

### 3.4 Visual-First, Instagram-Inspired Design
Rose prioritizes photos and videos over text:
- The **Feed page** (`/feed`) filters to only media posts (images/video)
- The **Classic view** shows a single-column layout with large images, avatars, like count, and caption — no icons, no engagement buttons
- The **Grid view** (Search/Discover) uses a 2-3 column masonry-like grid with hover overlays
- The **Reels page** (`/reels`) is a full-screen vertical video feed with snap-scroll

---

## 4. Authentication Flow

```
┌──────────────┐    ┌─────────────────┐    ┌───────────────┐
│  Client App  │    │  API Route      │    │  AT Protocol  │
│  (Zustand)   │───▶│  (Server)       │───▶│  (bsky.social)│
└──────────────┘    └─────────────────┘    └───────────────┘
       │                    │                       │
       │ localStorage      │ cookies                │
       │ rose-auth         │ rose_session            │
       │ (session data)    │ (httpOnly, 7d)          │
       │                    │                       │
       │ X-AT-Session      │ BskyAgent              │
       │ header (base64)   │ resumeSession()        │
       │                    │                       │
```

1. User logs in with identifier (email/handle) + password
2. Server creates BskyAgent, calls `agent.login()`, stores session in cookie + returns to client
3. Client persists session in Zustand (`rose-auth` key in localStorage)
4. Subsequent requests attach session via `X-AT-Session` header (base64-encoded JSON)
5. Server validates session, creates agent via `resumeSession()`, executes AT Protocol calls

---

## 5. NSFW Content Filtering

All content that flows through the server-side service modules is filtered for NSFW labels:

- **Label values**: `porn`, `sexual`, `nudity`, `graphic-media` (Bluesky's official moderation labels)
- **Checked on**: Both post-level labels (`post.labels`) and author-level labels (`post.author.labels`)
- **Applied in**: `getTimeline`, `getAuthorFeed`, `getCustomFeed`, `searchPosts`, `normalizeThreadNode`, `getFeedPosts`
- **Covered surfaces**: Feed page, Discover, Search, Reels, Profile posts, Thread replies
- **Implementation**: `filterNsfwItems()` function in both `services/posts.ts` and `services/feeds.ts`

---

## 6. Image Editing Pipeline (Compose)

```
User selects photos ──▶ browser-image-compression ──▶ Image Preview
                              │
                              ▼
                     Canvas Editor (optional)
                     ├── Filters (CSS + Canvas pixel manipulation)
                     ├── Adjust (brightness, contrast, saturation, blur)
                     ├── Crop (draggable overlay with aspect ratio)
                     ├── Rotate (90° increments)
                     ├── Text overlay (draggable)
                     ├── Stickers (drag-to-move emoji)
                     ├── Doodle (freehand drawing)
                     └── Collage (grid layout, 2-4 images)
                              │
                              ▼
                     browser-image-compression ──▶ Upload to Bluesky PDS
```

The editor is a full-screen modal (`ImageEditor` component) that creates a composited canvas using HTML5 Canvas API. Images are compressed twice — once on selection and once after editing — to stay under Bluesky's 1MB blob limit.
