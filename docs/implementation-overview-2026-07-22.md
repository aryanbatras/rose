# VoiceFlow — Complete Implementation Overview

**Date:** July 22, 2026  
**Repository:** `github.com/aryanbatras/voiceflow`  
**Branch:** `main`  
**Stack:** Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4 · AT Protocol  
**Total Source Files:** 61 (`.ts` + `.tsx`)  
**Total Lines of Code:** ~1,400+

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Design](#2-architecture--design)
3. [Tech Stack & Dependencies](#3-tech-stack--dependencies)
4. [Project Structure](#4-project-structure)
5. [Authentication System](#5-authentication-system)
6. [API Routes (22 total)](#6-api-routes-22-total)
7. [Services Layer](#7-services-layer)
8. [Pages & Features](#8-pages--features)
9. [Component Library](#9-component-library)
10. [Hooks](#10-hooks)
11. [UI / Design System](#11-ui--design-system)
12. [States Covered](#12-states-covered)
13. [Git History](#13-git-history)
14. [What's Next](#14-whats-next)

---

## 1. Project Overview

VoiceFlow is a **voice-influenced social media application** built entirely on the **AT Protocol (Bluesky)**. It uses Bluesky's infrastructure for:

- **Identity & Authentication** — Users log in with their Bluesky credentials
- **Social Graph** — Follows, followers, likes, reposts
- **Content Storage** — Posts, replies, media are stored in AT Protocol repositories (PDS)
- **Feeds & Discovery** — Timeline, author feeds, post threads, search
- **Notifications** — Likes, follows, reposts, replies

**Key Design Decisions:**
- **Zero backend databases** — No PostgreSQL, SQLite, or any custom storage. Everything goes through the AT Protocol.
- **No mock data** — All data is live from Bluesky's infrastructure
- **Fresh agents per request** — Every API call creates a fresh `BskyAgent` instance to avoid stale session state
- **Zustand + localStorage** for client-side auth persistence (JWT tokens stored securely)
- **Dark mode only** — Designed for dark-first consumption

---

## 2. Architecture & Design

### 2.1 Three-Column Desktop Layout

```
┌────────────┬──────────────────────────┬─────────────┐
│  Sidebar   │      Main Content        │  Right Bar  │
│  (hidden   │      (max-w-lg)          │  (Trends/   │
│   < 640px) │                          │   Search)   │
├────────────┼──────────────────────────┼─────────────┤
│  Nav Icons │ Feed / Profile / Compose │ Suggestions │
│  Compose   │ / Settings / Discover    │ Trending    │
│  Button    │ / Notifications          │             │
│            │                          │             │
│            │                          │             │
└────────────┴──────────────────────────┴─────────────┘
     sm:hidden     max-w-2xl flex-1     hidden lg:block
```

### 2.2 Mobile Bottom Navigation

On screens < 640px, the sidebar is replaced by a bottom navigation bar with:
- Home, Search, Compose (centered, larger), Notifications (with badge), Profile

### 2.3 Data Flow

```
[Client Component]
       │
       ▼
[fetch('/api/...')]  ──→  [API Route (Route Handler)]
                                │
                                ▼
                         [getAgentForSession()]
                                │
                          [cookie: voiceflow_session]
                                │
                                ▼
                         [BskyAgent.resumeSession()]
                                │
                                ▼
                         [AT Protocol (PDS)]
                                │
                         [Bluesky Social]
```

All API routes:
1. Read session from `voiceflow_session` cookie (httpOnly)
2. Create a fresh `BskyAgent` with `resumeSession()`
3. Call the AT Protocol method via the agent
4. Return normalized JSON to the client

---

## 3. Tech Stack & Dependencies

### Core
| Dependency | Version | Purpose |
|------------|---------|---------|
| `next` | 16.2.11 | React framework with App Router |
| `react` / `react-dom` | 19.2.4 | UI library |
| `typescript` | 5.x | Type safety |
| `tailwindcss` | 4.x | Utility-first CSS |

### AT Protocol
| Dependency | Version | Purpose |
|------------|---------|---------|
| `@atproto/api` | ^0.20.31 | Bluesky AT Protocol client SDK |
| `@atproto/oauth-client-node` | ^0.4.9 | OAuth client (for future use) |

### State Management & Data Fetching
| Dependency | Version | Purpose |
|------------|---------|---------|
| `zustand` | ^5.0.14 | Client-side auth state with persist middleware |
| `@tanstack/react-query` | ^5.101.4 | Server data fetching, caching, mutations |
| `zod` | ^4.4.3 | Runtime schema validation for session data |

### UI & Animation
| Dependency | Version | Purpose |
|------------|---------|---------|
| `sonner` | ^2.0.7 | Toast notifications |
| `gsap` | ^3.15.0 | Animation library (for future use) |
| `@gsap/react` | ^2.1.2 | GSAP React integration |
| `@tanstack/react-virtual` | ^3.14.7 | Virtualized lists (for future use) |

### Testing (Dev)
| Dependency | Version | Purpose |
|------------|---------|---------|
| `@playwright/test` | ^1.61.1 | E2E browser testing |
| `jest` | ^30.4.2 | Unit testing |
| `@testing-library/react` | ^16.3.2 | Component testing |
| `msw` | ^2.15.0 | API mocking |

---

## 4. Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (3-column, fonts, providers, toaster)
│   ├── page.tsx                # Root → redirects to /feed or /login
│   ├── error.tsx               # Global error boundary
│   ├── globals.css             # Tailwind + CSS variables (brand colors, surfaces)
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts       # POST: authenticate + set cookie
│   │   │   ├── logout/route.ts      # POST: clear cookie
│   │   │   ├── session/route.ts     # GET: validate session
│   │   │   └── refresh/route.ts     # POST: refresh JWT tokens
│   │   │
│   │   ├── compose/route.ts         # POST: create post (text + images + reply)
│   │   │
│   │   ├── feed/
│   │   │   ├── route.ts             # GET: timeline feed (paginated)
│   │   │   ├── author/route.ts      # GET: author's posts
│   │   │   ├── thread/route.ts      # GET: post thread with replies
│   │   │   └── likes/route.ts       # GET: users who liked a post
│   │   │
│   │   ├── interact/
│   │   │   ├── like/route.ts        # POST: like a post
│   │   │   ├── unlike/route.ts      # POST: remove like
│   │   │   ├── repost/route.ts      # POST/DELETE: repost/unrepost
│   │   │   └── delete/route.ts      # POST: delete own post
│   │   │
│   │   ├── notifications/
│   │   │   ├── route.ts             # GET: all notifications
│   │   │   ├── unread/route.ts      # GET: unread count
│   │   │   └── read/route.ts        # POST: mark as read
│   │   │
│   │   ├── graph/
│   │   │   ├── follow/route.ts      # POST: follow/unfollow user
│   │   │   ├── followers/route.ts   # GET: user's followers
│   │   │   ├── following/route.ts   # GET: who user follows
│   │   │   ├── search/route.ts      # GET: search actors
│   │   │   └── suggestions/route.ts # GET: suggested users (mutuals)
│   │   │
│   │   ├── profile/
│   │   │   ├── route.ts             # GET: user profile
│   │   │   └── update/route.ts      # POST: update profile (avatar, banner, bio, name)
│   │   │
│   │   └── search/
│   │       └── posts/route.ts       # GET: search posts
│   │
│   ├── feed/
│   │   ├── page.tsx                 # Main feed page with infinite scroll
│   │   ├── loading.tsx              # Feed loading skeleton
│   │   └── [uri]/page.tsx           # Post thread page with replies
│   │
│   ├── compose/page.tsx             # Post composer (text + image upload)
│   ├── discover/page.tsx            # Suggested users + trending (placeholder)
│   ├── login/page.tsx               # Bluesky login form
│   ├── messages/page.tsx            # DMs placeholder
│   ├── notifications/page.tsx       # Notifications list
│   ├── profile/[handle]/page.tsx    # User profile + posts
│   ├── search/page.tsx              # Search users & posts
│   └── settings/page.tsx            # Profile editor + preferences + logout
│
├── components/
│   ├── feed/
│   │   ├── FeedCard.tsx             # Post card (like, repost, share, delete)
│   │   └── ReplyThread.tsx          # Recursive nested reply renderer
│   │
│   ├── navigation/
│   │   ├── Sidebar.tsx              # Desktop left sidebar nav
│   │   ├── MobileNav.tsx            # Mobile bottom tab bar
│   │   └── TrendsSidebar.tsx        # Right sidebar (suggestions)
│   │
│   ├── profile/
│   │   └── ProfileHeader.tsx        # Profile banner, avatar, follow button, stats
│   │
│   ├── ui/
│   │   ├── avatar.tsx               # Avatar component (xs, sm, md, lg, xl)
│   │   ├── button.tsx               # Button with variants
│   │   ├── input.tsx                # Form input
│   │   └── skeleton.tsx             # Loading skeletons (ProfileSkeleton, FeedCardSkeleton)
│   │
│   └── providers.tsx                # React Query provider
│
├── hooks/
│   ├── useAuth.ts                   # Auth hook (Zustand + session validation)
│   ├── useFeed.ts                   # Feed queries (timeline, author feed, thread)
│   ├── useProfile.ts                # Profile queries + follow/unfollow mutations
│   ├── useNotifications.ts          # Notifications queries + unread count
│   └── useSearch.ts                 # Search actors + posts
│
├── services/
│   ├── agent.ts                     # BskyAgent factory (login, resume, refresh, cookie)
│   ├── posts.ts                     # Post operations (timeline, create, delete, like, repost, upload)
│   ├── graph.ts                     # Social graph (follow/unfollow, profile, suggestions, blocks)
│   └── notifications.ts             # Notification queries
│
├── store/
│   └── auth-store.ts                # Zustand store with persist + Zod validation
│
├── types/
│   └── atproto.ts                   # TypeScript types for AT Protocol data structures
│
└── lib/
    └── time.ts                      # Relative time formatting utility
```

---

## 5. Authentication System

### 5.1 Architecture

```
┌──────────────────────────────────────────────┐
│              Client (Browser)                 │
│                                                │
│  ┌──────────────────────────────┐             │
│  │   Zustand Store (persist)     │             │
│  │   - session {                │             │
│  │     did, handle,             │             │
│  │     accessJwt, refreshJwt    │             │
│  │   }                          │             │
│  │   - isAuthenticated          │             │
│  │   - isLoading                │             │
│  │   - error                    │             │
│  └──────────────┬──────────────┘             │
│                 │ localStorage                │
│                 │ key: "voiceflow-auth"       │
│                 ▼                             │
│  ┌──────────────────────────────┐             │
│  │      useAuth() Hook           │             │
│  │  - login(identifier, pass)   │             │
│  │  - logout()                  │             │
│  │  - session validation on     │             │
│  │    mount (with refresh)      │             │
│  └──────────────┬──────────────┘             │
│                 │ fetch()                     │
└─────────────────┼────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────┐
│            API Route (Server)                  │
│  1. Read voiceflow_session cookie             │
│  2. JSON.parse(sessionCookie.value)           │
│  3. getAgentForSession(session)               │
│  4. Create fresh BskyAgent                    │
│  5. agent.resumeSession({...session})         │
│  6. Call AT Protocol method                   │
└──────────────────────────────────────────────┘
```

### 5.2 Login Flow

1. User submits handle + app password on `/login`
2. `POST /api/auth/login` → `authenticateUser()` creates `new BskyAgent()` and calls `agent.login()`
3. On success: session is stored in `voiceflow_session` httpOnly cookie (7-day expiry)
4. Full session data (including JWT tokens) is returned to client
5. Client calls `store.setSession(data.session)` → saves to Zustand + localStorage
6. User is redirected to `/feed`

### 5.3 Session Restoration

On page load:
1. Zustand persist middleware loads session from localStorage
2. `useAuth()` hook calls `POST /api/auth/session` to validate
3. If session check fails: tries `POST /api/auth/refresh` with refreshJwt
4. If refresh succeeds: updates Zustand store with new tokens
5. If refresh fails: clears session, redirects to `/login`

### 5.4 Logout

1. `POST /api/auth/logout` clears the httpOnly cookie
2. `store.clearSession()` removes from Zustand + localStorage
3. User redirected to `/login`

### 5.5 Security Notes

- JWT tokens stored in localStorage via Zustand persist (as requested)
- httpOnly cookie also set for API route backward compatibility
- Fresh `BskyAgent` per request (no singleton pattern)
- Zod validates session data on store writes

---

## 6. API Routes (22 total)

### 6.1 Auth (4 routes)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/login` | POST | Authenticate with Bluesky credentials |
| `/api/auth/logout` | POST | Clear session cookie |
| `/api/auth/session` | GET | Validate current session |
| `/api/auth/refresh` | POST | Refresh expired JWT tokens |

### 6.2 Feed (4 routes)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/feed` | GET | Timeline feed (paginated, cursor-based) |
| `/api/feed/author` | GET | User's posts |
| `/api/feed/thread` | GET | Post thread with nested replies |
| `/api/feed/likes` | GET | Users who liked a post |

### 6.3 Interaction (4 routes)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/interact/like` | POST | Like a post |
| `/api/interact/unlike` | POST | Remove like |
| `/api/interact/repost` | POST/DELETE | Repost / un-repost |
| `/api/interact/delete` | POST | Delete own post |

### 6.4 Graph (5 routes)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/graph/follow` | POST | Follow / unfollow user |
| `/api/graph/followers` | GET | User's followers list |
| `/api/graph/following` | GET | Who a user follows |
| `/api/graph/search` | GET | Search for users |
| `/api/graph/suggestions` | GET | Suggested users (mutual follows) |

### 6.5 Notifications (3 routes)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/notifications` | GET | All notifications |
| `/api/notifications/unread` | GET | Unread notification count (polling) |
| `/api/notifications/read` | POST | Mark notifications as read |

### 6.6 Profile (2 routes)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/profile` | GET | Fetch user profile |
| `/api/profile/update` | POST | Update profile (FormData: avatar, banner, name, bio) |

### 6.7 Search (1 route)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/search/posts` | GET | Search posts by keyword |

### 6.8 Other (1 route)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/compose` | POST | Create post (FormData: text, images[], replyUri, replyCid) |

---

## 7. Services Layer

### 7.1 `agent.ts` — AT Protocol Agent Factory

Server-side only (`'use server'`).

| Function | Purpose |
|----------|---------|
| `authenticateUser(identifier, password)` | Login → returns SessionData |
| `resumeSession(sessionData)` | Create fresh agent from session |
| `storeSession(session)` | Set httpOnly cookie |
| `clearSession()` | Delete httpOnly cookie |
| `getAgentForSession(sessionData?)` | Get agent (from data or cookie fallback) |
| `createAgentFromSession(sessionData)` | Resume agent from session data |
| `refreshSession(sessionData)` | Refresh expired JWT tokens |

### 7.2 `posts.ts` — Feed & Post Operations

| Function | Purpose |
|----------|---------|
| `getTimeline(agent, cursor?, limit?)` | Fetch home timeline |
| `getAuthorFeed(agent, actor, cursor?, limit?)` | Fetch user's posts |
| `getPostThread(agent, uri, depth?)` | Fetch post thread with replies |
| `createPost(agent, text, options?)` | Create post (with reply, embed, facets) |
| `deletePost(agent, uri)` | Delete own post |
| `likePost(agent, uri, cid)` | Like a post |
| `unlikePost(agent, likeUri)` | Remove like |
| `repostPost(agent, uri, cid)` | Repost |
| `unrepostPost(agent, repostUri)` | Remove repost |
| `getLikes(agent, uri, cursor?, limit?)` | Get users who liked |
| `searchPosts(agent, query, cursor?, limit?)` | Search posts |
| `uploadBlob(agent, data, encoding)` | Upload image/video blob |

### 7.3 `graph.ts` — Social Graph Operations

| Function | Purpose |
|----------|---------|
| `getProfile(agent, actor)` | Fetch user profile |
| `updateProfile(agent, updates)` | Update profile (via upsertProfile) |
| `getFollows(agent, actor, cursor?, limit?)` | Get who user follows |
| `getFollowers(agent, actor, cursor?, limit?)` | Get user's followers |
| `followUser(agent, subjectDid)` | Follow a user |
| `unfollowUser(agent, followUri)` | Unfollow |
| `searchActors(agent, term, limit?)` | Search users |
| `getSuggestions(agent, limit?)` | Get suggested users (2nd-degree follows) |
| `getBlocks(agent)` | Get blocked users |
| `blockUser(agent, did)` | Block user |
| `unblockUser(agent, blockUri)` | Unblock |
| `muteUser(agent, did)` | Mute user |
| `unmuteUser(agent, did)` | Unmute |
| `getMutes(agent)` | Get muted users |

### 7.4 `notifications.ts` — Notification Operations

| Function | Purpose |
|----------|---------|
| `getNotifications(agent, cursor?, limit?)` | Fetch notifications |
| `getUnreadCount(agent)` | Get unread notification count |
| `markRead(agent, uris)` | Mark notifications as read |

---

## 8. Pages & Features

### 8.1 `/` (Root)
- Auth-aware redirect: authenticated → `/feed`, unauthenticated → `/login`
- Loading state with pulse animation

### 8.2 `/login`
- Bluesky handle + app password form
- Error display for invalid credentials
- Loading state during authentication
- Redirects to `/feed` on success

### 8.3 `/feed`
- Main timeline with cursor-based pagination
- FeedCard for each post (text, images, reply count, likes, reposts, share)
- Action buttons: Comment (navigate to thread), Like (toggle), Repost (toggle), Share (clipboard)
- Post options menu (own posts): Delete
- Skeleton loading state
- Empty state: "Follow some people to see their posts"
- Error state: "Failed to load feed"
- Loading page (`loading.tsx`) with FeedCardSkeleton

### 8.4 `/feed/[uri]` (Post Thread)
- Main post display with FeedCard
- Nested reply tree via `ReplyThread` (recursive component, max depth 10)
- Visual connector lines for nested replies
- Sticky reply composer at bottom → navigates to `/compose?replyUri=...`
- Skeleton loading state
- Error state: "Post not found"

### 8.5 `/compose`
- Text input (max 300 chars) with character counter
- Image upload (up to 4 images) with preview and remove
- Reply context header when replying to a post
- Form submission via FormData to `/api/compose`
- Suspense boundary for `useSearchParams()`
- Redirects to thread page after reply

### 8.6 `/profile/[handle]`
- Profile header: banner, avatar, display name, handle, bio, stats (posts, followers, following), join date
- Follow/unfollow button (with hover-to-unfollow state)
- Edit Profile link to `/settings` (own profile)
- User's posts feed (paginated)
- Skeleton loading states
- Error state: "User not found"

### 8.7 `/settings`
- Full profile editor:
  - Banner image upload with preview
  - Avatar image upload with camera icon button
  - Display name input (max 64)
  - Bio textarea (max 256) with character counter
  - Save button with loading state
  - React Query cache invalidation on save
- Account info (handle, DID)
- About section
- Logout button

### 8.8 `/search`
- Actor search (by handle/display name)
- Post search (by keyword)
- Loading states
- Empty states: "No results found"

### 8.9 `/discover`
- Suggested users from mutuals network (2nd-degree follows)
- Click to visit profile
- Loading skeleton
- Empty state: "Follow more users to get better suggestions"
- Trending section (placeholder)

### 8.10 `/notifications`
- Notification list (likes, reposts, follows, replies, mentions)
- Unread badge on sidebar/mobile nav (polling)
- Skeleton loading state
- Empty state

### 8.11 `/messages`
- Placeholder page: "Direct messaging coming soon with Bluesky DMs"

---

## 9. Component Library

### 9.1 Feed Components

**`FeedCard.tsx`** — The primary content unit
- Author row: avatar, display name, handle, timestamp, options menu (for own posts)
- Post text with `whitespace-pre-wrap` preserving line breaks
- Embedded media: single image / image grid / external link cards / quoted posts
- Interaction row: Reply (navigate), Like (toggle with optimistic count), Repost (toggle with optimistic count), Share (clipboard with fallback)
- Like/Unlike via `/api/interact/like` or `/api/interact/unlike`
- Repost/Unrepost via `POST` or `DELETE` on `/api/interact/repost`
- Delete via `/api/interact/delete` (only own posts, with confirmation)
- Click post → navigate to `/feed/{uri}`
- Click avatar → navigate to `/profile/{handle}`
- Deleted state: returns `null` (removed from DOM)
- `e.stopPropagation()` on all buttons to prevent card navigation

**`ReplyThread.tsx`** — Recursive nested reply rendering
- Accepts `replies` array and `depth` (default 0)
- Visual connector lines (vertical + horizontal branch) for nested replies
- Max depth guard at 10 levels: shows "… continued deeper" after limit
- Each reply rendered as FeedCard
- Handles `reply.post` or `reply` directly (AT Protocol can return either structure)
- Empty replies → renders nothing

### 9.2 Navigation Components

**`Sidebar.tsx`** — Desktop left sidebar
- Hidden on mobile (< 640px)
- Hidden on login/root pages
- Logo "VoiceFlow" in brand color
- Navigation entries: Home, Search, Notifications (with unread badge), Feeds, Profile, Settings
- Active state detection based on pathname
- Compose button at bottom (pill-shaped)
- Each entry: SVG icon + label, click → `router.push()`
- Badge shows unread notification count (>99 shows "99+")

**`MobileNav.tsx`** — Mobile bottom tab bar
- Visible only on mobile (< 640px) when sidebar is hidden
- Five tabs: Home, Search, Compose, Notifications (badge), Profile
- Centered compose button
- Fixed at bottom with backdrop blur

**`TrendsSidebar.tsx`** — Right sidebar
- Visible on large screens (≥ 1024px)
- Current user info at top
- Suggested users list

### 9.3 Profile Components

**`ProfileHeader.tsx`**
- Banner image (with fallback if none)
- Avatar (with brand ring)
- Follow/Following toggle button
  - Following: border style, hover turns red (unfollow)
  - Not following: brand background
- Display name, @handle
- Bio with whitespace preservation
- Stats row: posts count, followers count, following count
- Join date formatted
- Edit Profile button (own profile)

### 9.4 UI Primitives

| Component | Variants | Features |
|-----------|----------|----------|
| `Avatar` | xs(24px), sm(32px), md(40px), lg(48px), xl(80px) | Image fallback to initials, ring support |
| `Button` | primary, secondary, outline, ghost, destructive, link | Loading state, disabled, size |
| `Input` | default, file | Focus ring, placeholder |
| `Skeleton` | ProfileSkeleton, FeedCardSkeleton | Pulse animation |

---

## 10. Hooks

### 10.1 `useAuth.ts`
- Returns: `{ session, isLoading, error, login, logout, isAuthenticated }`
- Uses Zustand store (not React Context)
- Session validation on mount with auto-refresh
- Login: calls `/api/auth/login`, stores session on success
- Logout: calls `/api/auth/logout`, clears store

### 10.2 `useFeed.ts`
- `useTimeline()` — Paginated feed with `useInfiniteQuery`
- `useAuthorFeed(handle)` — User's posts
- `usePostThread(uri)` — Post thread with replies
- All enabled only when authenticated

### 10.3 `useProfile.ts`
- `useProfile(handle)` — Single user profile
- `useFollows(handle, type)` — Followers/following lists
- `useFollowUser()` — Follow mutation with cache invalidation
- `useUnfollowUser()` — Unfollow mutation with cache invalidation
- `useSuggestions()` — Suggested users
- `useSearchActors()` — Search users mutation

### 10.4 `useNotifications.ts`
- `useNotifications()` — All notifications
- `useUnreadCount()` — Unread count (polls every 30s)
- `useMarkRead()` — Mark as read mutation

### 10.5 `useSearch.ts`
- `useSearchPosts()` — Search posts mutation
- `useSearchActorsQuery()` — Actor search hook

---

## 11. UI / Design System

### 11.1 Color Palette

The app uses an **Bluesky-inspired** color scheme with yellow #FFDD00 as the accent:

```
Brand:       #FFDD00 (yellow/amber)
Brand hover: #E6C800 
Blue:        #0085FF (Bluesky blue)
Blue hover:  #0070E0
```

CSS Variables defined in `globals.css`:

| Variable | Value | Purpose |
|----------|-------|---------|
| `--brand` | `#FFDD00` | Primary accent color |
| `--brand-hover` | `#E6C800` | Hover state |
| `--blue` | `#0085FF` | Secondary accent (repost indicator) |
| `--blue-hover` | `#0070E0` | Hover state |
| `--surface-base` | `#0a0a0a` | Background |
| `--surface-elevated` | `#141414` | Card background |
| `--foreground` | `#e5e5e5` | Primary text |
| `--muted-foreground` | `#737373` | Secondary text |
| `--border` | `#262626` | Borders |
| `--accent` | `#1a1a1a` | Hover backgrounds |
| `--destructive` | `#ef4444` | Destructive actions |
| `--success` | `#22c55e` | Success states |

### 11.2 Typography

- **Headings:** Plus Jakarta Sans (variable font)
- **Body:** Geist (clean, highly readable)
- Headings use `text-wrap: balance` to prevent widows
- Counts use `tabular-nums` for stable widths

### 11.3 Dark Mode

- Default and only theme (dark-first consumption)
- `color-scheme: dark` meta tag
- Appropriate contrast ratios for accessibility
- No light mode toggle yet in the UI

### 11.4 Layout

- **Desktop (≥1024px):** Three-column with sidebar + main + trends
- **Tablet (640-1023px):** Two-column with sidebar hidden + main
- **Mobile (<640px):** Bottom nav replaces sidebar
- Main content: `max-w-2xl` centered
- Feed cards are borderless (no visible card boundaries)
- Clean, minimal with focus on typography and spacing

---

## 12. States Covered

| State | Implementation |
|-------|---------------|
| **Loading** | Pulse skeletons (FeedCardSkeleton, ProfileSkeleton), branded pulse spinner on root/login |
| **Empty** | Descriptive messages with actionable CTAs ("Follow more users to get suggestions") |
| **Error** | "Failed to load feed/post/profile" messages, toast notifications |
| **Not Found** | "Post not found", "User not found" |
| **Unauthenticated** | Redirect to `/login`, API returns 401 |
| **Optimistic Updates** | Like count updates immediately (not waiting for server) |
| **Deleted** | Post returns `null` from FeedCard (removed from DOM immediately) |
| **Loading Mutation** | Button shows "Deleting...", "Saving..." during async operations |
| **Network Error** | Toast "Connection error" |
| **Session Expired** | Auto-refresh via refreshJwt, clear session if refresh fails |
| **Edge Cases** | Long text truncated, >99 unread shown as "99+", image limit 4 |

---

## 13. Git History

Recent commit history (most recent first):

```
85b8737 - Add profile editing: avatar/banner upload, display name, bio editor in settings
0fd984a - Add recursive ReplyThread component for nested reply rendering with depth guard
d0cecce - Add post deletion with options menu on FeedCard. Fix auth cookie name in all API routes.
[earlier] - Add reply functionality: compose accepts reply query params, thread page reply composer, Suspense fix
[earlier] - Add image upload to compose, mobile navigation, clean up Buffer dependency
[earlier] - Complete overhaul: Bluesky-inspired UI redesign, removed all mock/voice data, pure AT Protocol
[earlier] - Initial VoiceFlow scaffolding with Next.js + AT Protocol
```

---

## 14. What's Next

### Planned / Suggested Features

1. **New User Signup** — Research Bluesky's account creation API (`com.atproto.server.createAccount`) so users can register directly in the app
2. **Auth Header Support** — Make API routes accept `Authorization: Bearer <accessJwt>` from localStorage in addition to cookies, for more robust auth
3. **Direct Messages** — Bluesky recently introduced DMs; implement real DM UI
4. **Feed Customization** — Custom feeds, mute/block lists
5. **Loading Polish** — Better loading states for compose page, image upload
6. **Post Threading UX** — More sophisticated reply tree with collapsed threads
7. **Profile Enhancements** — Profile tabs (Replies, Media, Likes), follow buttons on suggestions
8. **Accessibility Audit** — Keyboard navigation, screen reader compliance, focus management
9. **Unit Tests** — Jest + Testing Library for critical components and hooks
10. **E2E Tests** — Playwright for auth flow, post creation, interaction flows

---

**Document generated:** July 22, 2026  
**App version:** v1.0.0  
**Repository:** `github.com/aryanbatras/voiceflow`
