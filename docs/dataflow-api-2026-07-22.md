# Rose — Data Flow & API Reference

> **Date:** July 22, 2026  
> **Covers:** Data flow architecture, all API routes, service layer, hooks, and Zustand stores

---

## 1. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                        │
│                                                                 │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌───────────────┐  │
│  │  Pages  │  │  Hooks   │  │ Stores    │  │ UI Components │  │
│  │ (Next)  │─▶│(useFeed) │─▶│(Zustand)  │  │ (FeedCard,    │  │
│  │         │  │(useAuth) │  │(auth,     │  │  Sidebar, etc)│  │
│  │         │  │(useSearch│  │ bookmarks,│  │               │  │
│  │         │  │ etc.)    │  │ spells)   │  │               │  │
│  └─────────┘  └────┬─────┘  └───────────┘  └───────────────┘  │
│                    │                                            │
│                    │ HTTP fetch()                               │
│                    ▼                                            │
│            ┌───────────────┐                                    │
│            │ API Routes    │  /api/feed, /api/search, etc.     │
│            │ (Next.js)     │                                    │
│            └───────┬───────┘                                    │
└────────────────────┼────────────────────────────────────────────┘
                     │
                     │ 'use server' boundary
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js Server                             │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │ API Route    │───▶│ Services     │───▶│ BskyAgent        │  │
│  │ (route.ts)   │    │ (posts.ts,   │    │ (@atproto/api)   │  │
│  │              │    │  feeds.ts,   │    │                  │  │
│  │ • Session    │    │  agent.ts,   │    │ resumeSession()  │  │
│  │   validation │    │  graph.ts)   │    │ getTimeline()    │  │
│  │ • Parameter   │    │              │    │ getFeed()        │  │
│  │   parsing    │    │ • NSFW filter│    │ searchPosts()    │  │
│  │ • Error      │    │ • normalize  │    │ etc.             │  │
│  │   handling   │    │ • pagination │    │                  │  │
│  └──────────────┘    └──────────────┘    └────────┬─────────┘  │
│                                                   │            │
└───────────────────────────────────────────────────┼────────────┘
                                                    │ HTTPS
                                                    ▼
                                      ┌────────────────────────┐
                                      │  AT Protocol Network   │
                                      │  (bsky.social PDS)     │
                                      │                        │
                                      │ • Personal Data Server │
                                      │ • Relay / AppView      │
                                      │ • PLC Directory        │
                                      └────────────────────────┘
```

---

## 2. API Route Reference

### 2.1 Authentication (`/api/auth/*`)

| Route | Method | Service | Description |
|-------|--------|---------|-------------|
| `/api/auth/login` | POST | `agent.ts` → `authenticateUser()` | Authenticate with Bluesky credentials |
| `/api/auth/signup` | POST | `agent.ts` → `createAccount()` | Create new Bluesky account |
| `/api/auth/logout` | POST | `agent.ts` → `clearSession()` | Clear session cookie |
| `/api/auth/refresh` | POST | `agent.ts` → `refreshSession()` | Refresh expired JWT tokens |
| `/api/auth/session` | GET | — | Validate current session (returns 200 if valid) |

**Login Request:**
```json
{ "identifier": "user.bsky.social", "password": "..." }
```

**Login Response:**
```json
{
  "session": {
    "did": "did:plc:abc123",
    "handle": "user.bsky.social",
    "accessJwt": "eyJ...",
    "refreshJwt": "eyJ...",
    "active": true
  }
}
```

### 2.2 Feed (`/api/feed/*`)

| Route | Method | Service | Description |
|-------|--------|---------|-------------|
| `/api/feed` | GET | `posts.ts` | Get posts from a feed source |
| `/api/feed/author` | GET | `posts.ts` → `getAuthorFeed()` | Get posts by a specific actor |
| `/api/feed/thread` | GET | `posts.ts` → `getPostThread()` | Get a post thread with replies |
| `/api/feed/likes` | GET | `posts.ts` → `getLikes()` | Get users who liked a post |
| `/api/feed/generators` | GET | `feeds.ts` → `getPopularFeedGenerators()` | Search/browse feed generators |

**`GET /api/feed` Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `sourceType` | `following \| discover \| custom \| trending` | `following` | Which feed to fetch |
| `feedUri` | string | — | AT URI of custom feed (required for `custom` source) |
| `cursor` | string | — | Pagination cursor from previous response |
| `limit` | number | 30 | Items per page (max 100) |

**`GET /api/feed/generators` Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | `popular \| suggested` | `popular` | Mode of operation |
| `query` | string | — | Search term to filter feeds by name/description |
| `cursor` | string | — | Pagination cursor |
| `limit` | number | 25 | Items per page |

### 2.3 Social Interactions (`/api/interact/*`)

| Route | Method | Service | Description |
|-------|--------|---------|-------------|
| `/api/interact/like` | POST | `posts.ts` → `likePost()` | Like a post |
| `/api/interact/unlike` | POST | `posts.ts` → `unlikePost()` | Remove like from a post |
| `/api/interact/repost` | POST/DELETE | `posts.ts` → `repostPost()` / `unrepostPost()` | Repost or undo repost |
| `/api/interact/delete` | POST | `posts.ts` → `deletePost()` | Delete own post |

### 2.4 Social Graph (`/api/graph/*`)

| Route | Method | Service | Description |
|-------|--------|---------|-------------|
| `/api/graph/follow` | POST | `graph.ts` → `follow()` | Follow an actor |
| `/api/graph/followers` | GET | `graph.ts` → `getFollowers()` | Get followers of an actor |
| `/api/graph/following` | GET | `graph.ts` → `getFollowing()` | Get actors followed by an actor |
| `/api/graph/search` | GET | `graph.ts` → `searchActors()` | Search actors by handle/display name |
| `/api/graph/suggestions` | GET | — | Get suggested actors to follow |

### 2.5 Compose (`/api/compose`)

| Route | Method | Service | Description |
|-------|--------|---------|-------------|
| `/api/compose` | POST | Various | Create a post with optional images and reply context |

Accepts `multipart/form-data`:
- `text` (optional): Caption text
- `images[]` (required): Image files (up to 4)
- `replyUri` (optional): URI of post being replied to
- `replyCid` (optional): CID of post being replied to

### 2.6 Search (`/api/search/*`)

| Route | Method | Service | Description |
|-------|--------|---------|-------------|
| `/api/search/posts` | GET | `posts.ts` → `searchPosts()` | Search posts by text query |

### 2.7 Profile (`/api/profile/*`)

| Route | Method | Service | Description |
|-------|--------|---------|-------------|
| `/api/profile` | GET | `graph.ts` → `getProfile()` | Get actor profile |
| `/api/profile/update` | POST | — | Update own profile |

### 2.8 Notifications (`/api/notifications/*`)

| Route | Method | Service | Description |
|-------|--------|---------|-------------|
| `/api/notifications` | GET | `notifications.ts` | Get notification list |
| `/api/notifications/unread` | GET | `notifications.ts` | Get unread count |
| `/api/notifications/read` | POST | `notifications.ts` | Mark notifications as read |

### 2.9 Groups (`/api/groups/*`)

| Route | Method | Service | Description |
|-------|--------|---------|-------------|
| `/api/groups` | GET/POST | `groups.ts` | List groups / Create group |
| `/api/groups/[id]` | GET | `groups.ts` | Get group details |
| `/api/groups/[id]/members` | GET | `groups.ts` | List group members |
| `/api/groups/[id]/messages` | GET/POST | `groups.ts` | List messages / Send message |
| `/api/groups/[id]/settings` | POST | `groups.ts` | Update group settings |
| `/api/groups/[id]/invite` | POST | `groups.ts` | Create join link |
| `/api/groups/[id]/requests` | GET/POST | `groups.ts` | List/approve join requests |
| `/api/groups/join` | POST | `groups.ts` | Join group via invite code |
| `/api/groups/preview` | GET | `groups.ts` | Preview a group via invite code |

### 2.10 Bookmarks (Client-side)

Bookmarks are stored entirely in the client — no API routes:

```ts
// Zustand store persisted to localStorage under 'rose-bookmarks'
interface Bookmark {
  uri: string;
  cid: string;
  author: { handle: string; displayName?: string; avatar?: string };
  text: string;
  savedAt: string;
}
```

---

## 3. Service Layer Reference

### 3.1 `services/agent.ts` — AT Protocol Client Management

| Function | Scope | Description |
|----------|-------|-------------|
| `authenticateUser(identifier, password)` | Server | Creates agent and logs in with credentials |
| `resumeSession(sessionData)` | Server | Creates agent from stored session tokens |
| `createAccount(handle, email, password, inviteCode?)` | Server | Creates new Bluesky account |
| `refreshSession(sessionData)` | Server | Refreshes expired JWT tokens |
| `storeSession(session)` | Server | Persists session to httpOnly cookie |
| `clearSession()` | Server | Deletes session cookie |
| `getAgentForSession(sessionData?)` | Server | Creates agent from session data or cookie |
| `getAgentFromRequest(request)` | Server | Extracts session from request headers/cookies |
| `createAgentFromSession(sessionData)` | Server | Internal: creates BskyAgent from session |

### 3.2 `services/posts.ts` — Feed & Post Operations

| Function | Scope | Description |
|----------|-------|-------------|
| `getTimeline(agent, cursor?, limit?)` | Server | Get following timeline (NSFW filtered) |
| `getAuthorFeed(agent, actor, cursor?, limit?)` | Server | Get actor's posts (NSFW filtered) |
| `getPostThread(agent, uri, depth?)` | Server | Get post thread with recursive replies (NSFW filtered) |
| `getCustomFeed(agent, feedUri, cursor?, limit?)` | Server | Get custom feed posts (NSFW filtered) |
| `searchPosts(agent, query, cursor?, limit?)` | Server | Search posts (NSFW filtered) |
| `createPost(agent, text, options?)` | Server | Create new post |
| `deletePost(agent, uri)` | Server | Delete own post |
| `likePost(agent, uri, cid)` | Server | Like a post |
| `unlikePost(agent, likeUri)` | Server | Remove like |
| `repostPost(agent, uri, cid)` | Server | Repost |
| `unrepostPost(agent, repostUri)` | Server | Undo repost |
| `getLikes(agent, uri, cursor?, limit?)` | Server | Get post likes |
| `uploadBlob(agent, data, encoding)` | Server | Upload image/video blob |
| `normalizeFeedItem(item)` | Internal | Normalizes raw AT Protocol response to `FeedItem` |
| `normalizeThreadNode(node)` | Internal | Recursively normalizes thread tree |
| `isNsfwPost(item)` | Internal | Checks post/author labels for NSFW content |
| `filterNsfwItems(items)` | Internal | Filters out NSFW content from array |

### 3.3 `services/feeds.ts` — Feed Generator Operations

| Function | Scope | Description |
|----------|-------|-------------|
| `getSuggestedFeeds(agent, limit?, cursor?)` | Server | Get suggested feeds |
| `getPopularFeedGenerators(agent, options?)` | Server | Search/browse popular feeds (50k+) |
| `getFeedGeneratorsInfo(agent, feedUris)` | Server | Get metadata for specific feeds |
| `getFeedPosts(agent, feedUri, cursor?, limit?)` | Server | Get posts from a feed (NSFW filtered) |
| `isNsfwPost(item)` | Internal | NSFW check (duplicated from posts.ts) |
| `filterNsfwItems(items)` | Internal | NSFW filter (duplicated from posts.ts) |

### 3.4 `services/graph.ts` — Social Graph Operations

| Function | Scope | Description |
|----------|-------|-------------|
| `follow(agent, did)` | Server | Follow an actor |
| `unfollow(agent, followUri)` | Server | Unfollow an actor |
| `getFollowers(agent, actor, cursor?, limit?)` | Server | Get actor's followers |
| `getFollowing(agent, actor, cursor?, limit?)` | Server | Get who an actor follows |
| `searchActors(agent, term, cursor?, limit?)` | Server | Search actors by term |
| `getProfile(agent, actor)` | Server | Get detailed profile |

### 3.5 `services/groups.ts` — Chat Groups

Uses Bluesky's `chat.bsky.convo.*` Lexicon namespace. Functions include list convos, get messages, send message, create group, manage join links, handle join requests.

### 3.6 `services/notifications.ts` — Notifications

| Function | Scope | Description |
|----------|-------|-------------|
| `getNotifications(agent, cursor?, limit?)` | Server | Get notification list |
| `getUnreadCount(agent)` | Server | Get unread notification count |
| `markRead(agent)` | Server | Mark all notifications as read |

---

## 4. Hooks Reference

### 4.1 `useAuth()` — Authentication
- **Returns**: `{ session, isLoading, error, login, logout, isAuthenticated }`
- **Storage**: Zustand `auth-store` persisted to `localStorage` under `rose-auth`
- **Side effect**: Validates session on mount, auto-refreshes if expired
- **Helper**: `authFetch(url, options)` — attaches session header automatically

### 4.2 `useFeed(feedSource?, limit?)` — Feed Data (Infinite)
- **Returns**: `{ data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch }`
- **Query keys**: `['feed', sourceType, feedUri?, session.did]`
- **Page size**: 30 by default
- **Cursor**: Bluesky's timestamp-based cursor string

### 4.3 `useAuthorFeed(handle, limit?)` — Author Feed (Infinite)
- Same pattern as `useFeed` but for a specific author's posts

### 4.4 `usePostThread(uri)` — Post Thread
- **Returns**: `{ data, isLoading, error }` (single fetch, no pagination)
- **Data shape**: `{ post: FeedItem, replies: ThreadNode[], depth: number }`

### 4.5 `useSearchPosts(query)` — Post Search (Infinite)
- Uses `useInfiniteQuery` with cursor-based pagination
- **Query key**: `['searchPosts', query]`
- Enabled when `query.length >= 2`

### 4.6 `useSearchActors(query)` — Actor Search
- Uses regular `useQuery` (single page)
- Enabled when `query.length >= 2`

### 4.7 `useDebouncedSearch(delay?)` — Debounced Input
- **Returns**: `{ query, setQuery, debouncedQuery }`
- Debounces raw input by `delay` ms (default 300)

### 4.8 `useSpells()` — Active Spell Effects
- **Returns**: Object with boolean flags for each spell effect type
- Evaluates conditions (time, session duration, counts, intervals)

### 4.9 `useProfile(handle)` — Profile Data + Posts
- Combines profile lookup with author feed (infinite)

### 4.10 `useNotifications()` — Notification List + Unread Count
- Polls for new notifications
- Provides mark-as-read functionality

---

## 5. Zustand Stores

| Store | Key | Persists | Purpose |
|-------|-----|----------|---------|
| `auth-store` | `rose-auth` | ✅ | Session data, isAuthenticated, isLoading |
| `feed-source-store` | `rose-feed-sources` | ✅ | Active feed source + saved feeds |
| `filter-store` | `rose-filters` | ✅ | Content filters (hide reposts, media only, etc.) |
| `view-mode-store` | `rose-view-mode` | ✅ | Grid vs Classic |
| `bookmark-store` | `rose-bookmarks` | ✅ | Bookmarked posts |
| `spell-store` | `rose-spells` | ✅ | Active spells & counters |
| `group-name-store` | `rose-group-names` | ✅ | Group display name cache |

---

## 6. Pagination Pattern

All paginated endpoints follow the same pattern:

```
Client                    Server                    AT Protocol
  │                        │                         │
  │ fetch(/api/feed?       │                         │
  │   limit=30)            │── getTimeline() ────────▶│
  │                        │◀── { feed, cursor } ────│
  │◀── { items, cursor } ─│                         │
  │                        │                         │
  │ fetch(/api/feed?       │                         │
  │   limit=30&cursor=     │── getTimeline(cursor) ─▶│
  │   "abc123")            │◀── { feed, cursor } ────│
  │◀── { items, cursor } ─│                         │
  │                        │                         │
```

The client's `useInfiniteQuery` manages:
- `initialPageParam: undefined` (first request has no cursor)
- `getNextPageParam: (lastPage) => lastPage.cursor ?? undefined` (null → undefined = no more pages)
- Pages are flattened on the client: `data.pages.flatMap(p => p.items)`

---

## 7. NSFW Filtering Flow

```
AT Protocol Response
        │
        ▼
   normalizeFeedItem()
        │
        ▼
   Check labels:
   post.labels? [{val: 'porn'}, ...]
   post.author.labels? [{val: 'sexual'}, ...]
        │
        ▼
   NSFW_LABELS = {'porn', 'sexual', 'nudity', 'graphic-media'}
        │
        ▼
   filterNsfwItems() — removes any item where isNsfwPost() returns true
        │
        ▼
   Clean response returned to client
```

Applied in: `getTimeline`, `getAuthorFeed`, `getCustomFeed`, `searchPosts`, `normalizeThreadNode`, `getFeedPosts`.
