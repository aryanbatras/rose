# VOICEFLOW — Wireframes & Data Flow Architecture
## Structural Layouts, API Flow, and Content Movement

**Date:** July 22, 2026
**Status:** v1.0
**Style:** Pure structural wireframes — no graphics, logos, waves, or decorative elements.

---

## TABLE OF CONTENTS

1. [Screen Wireframes](#1-screen-wireframes)
   - 1.1 Login Screen
   - 1.2 Feed (Home)
   - 1.3 Voice Post Composer
   - 1.4 Post Detail / Thread
   - 1.5 Profile Page
   - 1.6 Direct Messages
   - 1.7 Notifications
   - 1.8 Search
   - 1.9 Settings
2. [API Data Flow Diagrams](#2-api-data-flow-diagrams)
   - 2.1 Authentication Flow
   - 2.2 Feed Loading Flow
   - 2.3 Post Creation Flow
   - 2.4 Notification Polling Flow
   - 2.5 Social Graph Traversal Flow
   - 2.6 Recommendation Computation Flow
3. [Component → API Mapping](#3-component--api-mapping)
4. [State Management & Data Flow](#4-state-management--data-flow)
5. [Route Structure](#5-route-structure)

---

## 1. SCREEN WIREFRAMES

### 1.1 Login Screen

```
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│              [Login/Sign Up]                 │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │  Email or Phone                    │     │
│  └────────────────────────────────────┘     │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │  Password                          │     │
│  └────────────────────────────────────┘     │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │  [Sign In]                         │     │
│  └────────────────────────────────────┘     │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │  [Sign In with Bluesky]            │     │
│  └────────────────────────────────────┘     │
│                                              │
│  [Create account]                    [Help]  │
│                                              │
└──────────────────────────────────────────────┘

API Calls on this screen:
───────────────────────────────────────────────
- POST /oauth/login → redirect to PDS OAuth
- or: agent.login({ identifier, password }) → Session
───────────────────────────────────────────────
```

### 1.2 Feed (Home) — Mobile Layout

```
┌──────────────────────────────────────────────┐
|  [Search Bar                    [search]]   |  Top Bar
├──────────────────────────────────────────────┤
│                                              │
│  ┌────┐ @username  ·  2m ago           ⋮   │  Feed Card
│  │ av │                                      │  (Voice Post)
│  └────┘                                      │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  |   [play]  =====================..........    |  Waveform Row
|  |            0:42                 1:30   |  |
│  └────────────────────────────────────────┘  │
│  Optional caption text line 1                  │
│  optional caption text line 2                 │
│                                              │
|  [heart: 24]  [reply: 8]  [repost: 5]        |  Action Row
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────┐ @user2  ·  5m ago              ⋮   │  Feed Card
│  │ av │                                      │  (Text Post)
│  └────┘                                      │
│  This is the text content of a text-only     │
│  post. It can contain @mentions and          │
│  #hashtags styled as inline links.           │
│                                              │
|  [heart: 12]  [reply: 3]  [repost: 2]        |
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────┐ @user3  ·  1h ago              ⋮   │  Feed Card
│  │ av │                                      │  (Voice Post)
│  └────┘                                      │
│  ┌────────────────────────────────────────┐  │
│  |   [play]  ==================================  |
|  |            0:00                 0:15    |  |
|  +------------------------------------------------------------+ |
|                                              |
|  [heart: 5]  [reply: 1]  [repost: 0]         |
│                                              │
├──────────────────────────────────────────────┤
│                          [Load more items...] │  Load More
│                                              │
├──────────────────────────────────────────────┤
|  [Home] [Search] [Post] [Activity] [Profile]  |  Bottom Nav
└──────────────────────────────────────────────┘

Data Flow:
───────────────────────────────────────────────
1. Layout mounts → useFeed() hook fires
2. useAgent() gets authenticated BskyAgent from context
3. agent.getTimeline({ limit: 30 }) → paginated response
4. Each item normalized by normalizeFeedItem()
5. Items stored in React Query cache (staleTime: 60s)
6. Virtual list renders only visible items (virtualizer)
7. Scroll near bottom → fetchNextPage() with cursor
8. On error → show inline retry button
9. Voice posts detected by record.$type === 'voiceflow.voice.post'
───────────────────────────────────────────────
```

### 1.2b Feed (Home) — Desktop Layout

```
┌────────────────────────────────────────────────────────────────┐
│ ┌──────────────┐ ┌──────────────────────┐ ┌────────────────┐ │
│ │  Sidebar     │ │  Feed Column          │ │  Right Panel   │ │
│ │              │ │                       │ │                │ │
│ │  [Home]      │ │  [Search Bar     🔍]  │ │  Trends        │ │
│ │  [Search]    │ ├──────────────────────┤ │  ──────────    │ │
│ │  [Activity]  │ │  Feed Card 1          │ │  #hashtag1     │ │
│ │  [Messages]  │ │  (Voice)              │ │  #hashtag2     │ │
│ │  [Profile]   │ │                       │ │  #hashtag3     │ │
│ │              │ │  Feed Card 2          │ │                │ │
│ │  ──────────  │ │  (Text)               │ │  Suggestions   │ │
│ │  [Settings]  │ │                       │ │  ──────────    │ │
│ │              │ │  Feed Card 3          │ │  @user4        │ │
│ │  [Post]      │ │  (Voice)              │ │  @user5        │ │
│ │              │ │                       │ │  @user6        │ │
│ └──────────────┘ └──────────────────────┘ │                │
│                                            └────────────────┘ │
└────────────────────────────────────────────────────────────────┘

Media Queries:
───────────────────────────────────────────────
- < 768px:  Bottom nav, full-width feed
- 768-1023: Bottom nav, centered constrained feed
- 1024-1279: Left sidebar, centered feed
- 1280+:     Left sidebar + centered feed + right panel
───────────────────────────────────────────────
```

### 1.3 Voice Post Composer

```
┌──────────────────────────────────────────────┐
│  [Cancel]                         [Post    ] │
│                                              │
│          ┌──────────────────────┐            │
│          │                      │            │
│          │     [Record]         │            │  Primary CTA
│          │   hold to record     │            │  80x80px circle
│          │                      │            │
│          └──────────────────────┘            │
│                                              │
│  ═══════════════════════════════════         │  Waveform preview
│  ═════════════════════          0:42         │  (appears after record)
│                                              │
│  ┌────────────────────────────────┐          │
│  │  Add caption text (optional)   │          │  Text input
│  └────────────────────────────────┘          │
│                                              │
│  [Tags] [Mention] [Attach] [Mood] [Settings] │  Toolbar row
│                                              │
└──────────────────────────────────────────────┘

State Transitions:
───────────────────────────────────────────────
IDLE        → button shows "Record"
RECORDING   → button pulsing, timer counting, waveform live
RECORDED    → waveform stabilizes, preview appears
REVIEWING   → user can play back, re-record, add caption
UPLOADING   → progress indicator "Publishing..."
SUCCESS     → toast "Posted", dismiss composer
ERROR       → inline error with retry

API Calls:
───────────────────────────────────────────────
1. (browser) MediaRecorder captures audio → Blob
2. (browser) FFmpeg.wasm converts Blob → MP4 video
3. agent.uploadBlob(videoBlob) → blob reference { cid, mimeType, size }
4. agent.com.atproto.repo.putRecord({ collection: 'voiceflow.voice.post', record: {...} })
5. revalidatePath('/') to refresh feed
───────────────────────────────────────────────
```

### 1.4 Post Detail / Thread

```
┌──────────────────────────────────────────────┐
│  [← Back]                                    │
│                                              │
│  ┌────┐ @username  ·  2h ago           ⋮   │  Original Post
│  │ av │                                      │
│  └────┘                                      │
│  ┌────────────────────────────────────────┐  │
│  │   [▶ Play]  ▬▬▬▬▬▬▬▬▬▬▬░░░░░░░░░     │  │
│  │            0:42                 1:30   │  │
│  └────────────────────────────────────────┘  │
│  Post caption text goes here                  │
│  #tags #music                                 │
│                                              │
|  [heart: 24]  [reply: 8]  [repost: 5]        |
|                                              |
|  -- Replies --                               |
|                                              |
|  +------+ @reply1  - 1h ago           [more]|  Reply Card
|  | avtr | Reply text content                 |
|  +------+                                    |
|                                              |
|  +------+ @reply2  - 30m ago          [more]|  Reply Card
|  | avtr |                                    |  (Voice Reply)
|  +------+                                    |
|  +------------------------------------------------------------+ |
|  |   [play]  ======.........................  |
|  +------------------------------------------------------------+ |
│                                              │
│         ┌──────────────────────┐             │
│         │  [Type a reply...]   │             │  Reply Input
│         └──────────────────────┘             │
│                                              │
└──────────────────────────────────────────────┘

API Calls:
───────────────────────────────────────────────
1. agent.getPostThread({ uri, depth: 6 }) → thread with replies
2. agent.post({ text, reply: { root, parent } }) → create reply
3. agent.like(uri, cid) → like post
4. agent.repost(uri, cid) → repost
───────────────────────────────────────────────
```

### 1.5 Profile Page

```
┌──────────────────────────────────────────────┐
│  [← Back]                    [Edit Profile]  │
│                                              │
│  ┌──────────┐                                │
│  │  Avatar  │  Display Name                  │
│  │  (80px)  │  @handle                      │
│  └──────────┘                                │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  |  [play] Voice Bio - 0:22         0:22  |   |  Audio Bio
│  └──────────────────────────────────────┘   │
│                                              │
│  Bio text line 1                             │
│  Bio text line 2                             │
│                                              │
│  1.2k Followers  ·  420 Following            │  Stats Row
│                                              │
│  [Posts]  [Replies]  [Media]  [Likes]        │  Tabs
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Grid / List of content based on      │   │
│  │  active tab selection                 │   │
│  │                                       │   │
│  │  [Voice Post 1]  [Voice Post 2]       │   │
│  │  [Voice Post 3]  [Text Post 1]        │   │
│  │                                       │   │
│  └──────────────────────────────────────┘   │
│                                              │
└──────────────────────────────────────────────┘

API Calls:
───────────────────────────────────────────────
1. agent.getProfile({ actor: handle }) → profile data
2. agent.getAuthorFeed({ actor, limit }) → user's posts
3. agent.getFollows({ actor }) → who they follow
4. agent.getFollowers({ actor }) → their followers
5. agent.follow(did) / agent.deleteFollow(uri) → follow/unfollow
6. agent.getActorLikes({ actor }) → liked posts (for Likes tab)
7. agent.getRecord({ collection: 'voiceflow.actor.bio', rkey: 'self' }) → voice bio
8. agent.getRecord({ collection: 'voiceflow.music.preference', rkey: 'self' }) → music
───────────────────────────────────────────────
```

### 1.6 Direct Messages

```
Conversation List:                     Conversation View:
┌─────────────────────────┐  ┌─────────────────────────────┐
│ [New Message]           │  │ [←] Chat with @user  [⋮]   │
├─────────────────────────┤  ├─────────────────────────────┤
| +--+ @user1             |  |                             |
| |av| Hey! Loved your... |  |  +-----------------------+   |
| +--+ Today 12:30   [unread]|  | Hey, great post!      |<- |
|                         |  |  +-----------------------+   |
| +--+ @user2             |  |                             |
| |av| Want to collab?... |  |  +-----------------------+   |
| +--+ Yesterday     [unread]|  | Thanks! I'm working   |-> |
|                         |  |  | on a new track        |   |
| +--+ Group Name (3)     |  |  +-----------------------+   |
| |gr| Sarah: Here's my.. |  |                             |
| +--+ Yesterday          |  |  +-----------------------+   |
|                         |  |  | [play] Voice 0:15    |<- |
| +--+ @user4             |  |  +-----------------------+   |
| |av| (no messages yet)  |  |                             |
| +--+                    |  |                             |
|                         |  +-----------------------------+
| [No more conversations] |  | [attach] [Type a message] > |
+-------------------------+  +-----------------------------+

API Calls:
───────────────────────────────────────────────
NOTE: AT Protocol does NOT have native DMs yet.
This feature requires additional infrastructure:

Option A (launch): No DMs initially, use Bluesky posts + replies
Option B (post-launch): Build DM service on Railway/Fly with:
  - WebSocket server for real-time messaging
  - D1/SQLite for message storage
  - Endpoints: GET /messages, POST /messages, WebSocket /ws
───────────────────────────────────────────────
```

### 1.7 Notifications

```
┌──────────────────────────────────────────────┐
│  Activity                    [Filter: All  ▾] │
├──────────────────────────────────────────────┤
│                                              │
│  ── Today ──                                 │
│                                              │
|  [like] @user1 and 5 others liked your post |  Unread (tinted bg)
|  [reply] @user2 replied to your voice post   |  [new] indicator
|  [follow] @user3 followed you                |
|  [repost] @user4 reposted your post          |
|                                              |
|  -- Yesterday --                             |
|                                              |
|  [like] @user5 liked your post              |  Read (no tint)
|  [reply] @user6 replied: "Great voice!"      |
|  [follow] @user7 followed you                |
|                                              |
|  -- Earlier This Week --                    |
|                                              |
|  [like] @user8 and 3 others liked your post |
|  [mention] @user9 mentioned you in a post    |
│                                              │
└──────────────────────────────────────────────┘

API Calls:
───────────────────────────────────────────────
1. agent.listNotifications({ limit: 50, cursor }) → notification list
2. agent.updateSeenNotifications(seenAt) → mark all as read
3. POLING: refetchInterval: 30_000 (poll every 30s)
───────────────────────────────────────────────
```

### 1.8 Search

```
┌──────────────────────────────────────────────┐
|  [Search voices, people, tags...    [search]]|
├──────────────────────────────────────────────┤
│                                              │
│  Recent Searches:                            │
|  [@user1]  [#music]  [@user2]  [Clear]      |
│                                              │
│  ── Trending Tags ──                        │
│                                              │
│  #VoiceOfTheDay  ·  2.4k posts              │
│  #MusicMonday   ·  1.8k posts               │
│  #StoryTime     ·  1.2k posts               │
│  #TechTalks     ·  890 posts                │
│                                              │
│  ── Suggested voices ──                     │
│                                              │
│  [Follow]  @user1  ·  Music producer        │
│  [Follow]  @user2  ·  Storyteller           │
│  [Follow]  @user3  ·  Comedian              │
│                                              │
└──────────────────────────────────────────────┘

Search Results View:
┌──────────────────────────────────────────────┐
│  Results for "#music"                        │
│  [Top] [People] [Posts] [Tags]              │
│                                              │
│  ── People ──                               │
│  [Follow] @musician1  · 120 followers       │
│  [Follow] @musician2  · 340 followers       │
│                                              │
│  ── Posts ──                                │
│  Voice post card 1 with #music tag          │
│  Voice post card 2 with #music tag          │
└──────────────────────────────────────────────┘

API Calls:
───────────────────────────────────────────────
1. agent.app.bsky.actor.searchActors({ term, limit }) → user results
2. agent.app.bsky.feed.searchPosts({ q, limit }) → post results
3. LIVE SEARCH: debounce 300ms on input, cancel previous request
4. RECENT SEARCHES: stored in localStorage
───────────────────────────────────────────────
```

### 1.9 Settings

```
┌──────────────────────────────────────────────┐
│  Settings                          [Done]   │
├──────────────────────────────────────────────┤
│                                              │
│  Account                                     │
│  ├─ [Edit Profile]                          │
│  ├─ [Change Password]                       │
│  ├─ [Connected Apps]                        │
│  └─ [Delete Account]                        │
│                                              │
│  Notifications                               │
│  ├─ Likes:            [On]                  │
│  ├─ Replies:          [On]                  │
│  ├─ Follows:          [On]                  │
│  └─ Mentions:         [On]                  │
│                                              │
│  Privacy                                     │
│  ├─ [Blocked Users]     ·  3 users          │
│  ├─ [Muted Users]       ·  5 users          │
│  ├─ [Muted Words]       ·  10 words         │
│  └─ Profile Visibility:  [Public ▾]         │
│                                              │
│  Accessibility                                │
│  ├─ Reduced Motion:     [Off]               │
│  ├─ Playback Speed:     [1x ▾]              │
│  └─ High Contrast:      [Off]               │
│                                              │
│  About                                       │
│  ├─ Terms of Service                        │
│  ├─ Privacy Policy                          │
│  └─ Version 1.0.0                           │
│                                              │
└──────────────────────────────────────────────┘

API Calls:
───────────────────────────────────────────────
Most settings are client-side (localStorage)
Only profile edits, block/mute lists call APIs:
1. agent.com.atproto.repo.putRecord({ collection: 'app.bsky.actor.profile', record: {...} })
2. agent.app.bsky.graph.getBlocks() → blocked list
3. agent.app.bsky.graph.getMutes() → muted list
4. agent.app.bsky.graph.block(did) → block user
5. agent.app.bsky.graph.mute(did) → mute user
───────────────────────────────────────────────
```

---

## 2. API DATA FLOW DIAGRAMS

### 2.1 Authentication Flow

```
                    VOICEFLOW APP                        BLUESKY / AT PROTOCOL
                                                                      
 ┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
 │  User     │    │  Next.js     │    │  OAuth       │    │  Bluesky     │
 │  Browser  │    │  Frontend    │    │  Client      │    │  PDS         │
 └────┬─────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
      │                 │                   │                   │
      │  1. Click        │                   │                   │
      │  "Sign In with   │                   │                   │
      │  Bluesky"        │                   │                   │
      │─────────────────>│                   │                   │
      │                 │                   │                   │
      │                  │  2. POST /oauth/login?handle=@user    │
      │                  │──────────────────────────────────────>│
      │                  │                   │                   │
      │                  │  3. GET handle → DID → PDS URL       │
      │                  │<──────────────────────────────────────│
      │                  │                   │                   │
      │                  │  4. Return OAuth URL                 │
      │                  │<──────────────────────────────────────│
      │                 │                   │                   │
      │  5. Redirect to OAuth URL           │                   │
      │<─────────────────────────────────────────────────────────│
      │                 │                   │                   │
      │  6. User approves on PDS            │                   │
      │─────────────────────────────────────────────────────────>│
      │                 │                   │                   │
      │  7. PDS redirects to callback        │                   │
      │<─────────────────────────────────────────────────────────│
      │                 │                   │                   │
      │                  │  8. GET /oauth/callback?code=xxx      │
      │                  │──────────────────────────────────────>│
      │                  │                   │                   │
      │                  │  9. Exchange code for tokens          │
      │                  │<──────────────────────────────────────│
      │                 │                   │                   │
      │ 10. Store httpOnly cookie: DID + refresh token          │
      │<────────────────│                   │                   │
      │                 │                   │                   │
      │ 11. BskyAgent init with session:                        │
      │     agent = new BskyAgent({ service })                  │
      │     agent.resumeSession(session)                        │
      │─────────────────────────────────────────────────────────>│
      │                 │                   │                   │
      │ 12. API calls now authenticated     │                   │
      │─────────────────────────────────────────────────────────>│
      │                 │                   │                   │
```

### 2.2 Feed Loading Flow

```
 ┌──────────┐     ┌──────────────┐     ┌────────────┐     ┌──────────────┐
 │  Feed     │     │  React Query │     │  Service   │     │  Bluesky     │
 │  Component│     │  (Cache)     │     │  Layer     │     │  API         │
 └─────┬─────┘     └──────┬───────┘     └─────┬──────┘     └──────┬───────┘
       │                  │                   │                   │
       │  useFeed()       │                   │                   │
       │─────────────────>│                   │                   │
       │                  │                   │                   │
       │           Query Key: ['feed', 'following']               │
       │                  │                   │                   │
       │          ┌─── Check staleTime (60s) ───┐                │
       │          │  Is cache fresh?            │                │
       │          └──────────┬──────────────────┘                │
       │                     │  No                                │
       │                     ▼                                   │
       │                  │  queryFn executes                    │
       │                  │─────────────────>                   │
       │                  │                   │                   │
       │                  │                   │  getTimeline()   │
       │                  │                   │─────────────────>│
       │                  │                   │                   │
       │                  │                   │   Response:       │
       │                  │                   │  { feed: [...],  │
       │                  │                   │    cursor: 'abc' }│
       │                  │                   │<─────────────────│
       │                  │                   │                   │
       │                  │  Normalize items  │                   │
       │                  │<─────────────────│                   │
       │                  │                   │                   │
       │          ┌─── Store in cache ───┐                      │
       │          │ staleTime refreshed  │                      │
       │          └──────────────────────┘                      │
       │                  │                   │                   │
       │   Return {       │                   │                   │
       │     pages: [...],│                   │                   │
       │     pageParams   │                   │                   │
       │   }              │                   │                   │
       │<─────────────────│                   │                   │
       │                  │                   │                   │
       │  Virtualizer renders only visible items                │
       │  (overscan: 5 items above/below viewport)              │
       │                  │                   │                   │
       │  User scrolls near bottom                              │
       │  fetchNextPage() with cursor 'abc'                     │
       │─────────────────>│                   │                   │
       │                  │─────────────────>│                   │
       │                  │                   │─────────────────>│
       │                  │                   │                   │
```

### 2.3 Post Creation Flow (Voice)

```
 ┌──────────┐    ┌──────────────┐    ┌────────────┐    ┌──────────────┐
 │  User     │    │  Composer    │    │  Service   │    │  Bluesky     │
 │  Browser  │    │  Component   │    │  Layer     │    │  PDS         │
 └─────┬─────┘    └──────┬───────┘    └─────┬──────┘    └──────┬───────┘
       │                 │                   │                   │
       │  1. Hold record  │                   │                   │
       │    button         │                   │                   │
       │─────────────────>│                   │                   │
       │                 │                   │                   │
       │  2. MediaRecorder.start() (in browser)                 │
       │    - echoCancellation: true                            │
       │    - noiseSuppression: true                            │
       │    - audioBitsPerSecond: 128000                        │
       │                 │                   │                   │
       │  3. Release button                                     │
       │─────────────────>│                   │                   │
       │                 │                   │                   │
       │  4. MediaRecorder.stop()                               │
       │     → ondataavailable chunks → Blob                    │
       │                 │                   │                   │
       │  5. FFmpeg.wasm: audio + bg → mp4                     │
       │     (runs in Web Worker, UI not blocked)               │
       │     - Progress callbacks update UI bar                 │
       │                 │                   │                   │
       │  6. Preview shown to user                              │
       │<────────────────│                   │                   │
       │                 │                   │                   │
       │  7. User adds caption, tags, clicks Post               │
       │─────────────────>│                   │                   │
       │                 │                   │                   │
       │                  │  8. Upload video blob               │
       │                  │─────────────────────────────────────>│
       │                  │                   │                   │
       │                  │                  │  uploadBlob()     │
       │                  │                  │──────────────────>│
       │                  │                  │                   │
       │                  │                  │  Response: blob    │
       │                  │                  │  { ref, mime,     │
       │                  │                  │    size }         │
       │                  │                  │<──────────────────│
       │                  │                   │                   │
       │                  │  9. Create custom record             │
       │                  │  putRecord({                          │
       │                  │    collection: 'voiceflow.voice.post',│
       │                  │    record: { videoBlob, duration,     │
       │                  │      transcript, text, tags, mood,    │
       │                  │      createdAt, facets }              │
       │                  │  })                                  │
       │                  │─────────────────────────────────────>│
       │                  │                   │                   │
       │                  │                  │  Record written     │
       │                  │                  │  to user's repo    │
       │                  │                  │<──────────────────│
       │                 │                   │                   │
       │  10. revalidatePath('/')                                │
       │<────────────────│                   │                   │
       │                 │                   │                   │
       │  11. Toast: "Posted!"                                   │
       │<────────────────│                   │                   │
       │                 │                   │                   │
```

### 2.4 Notification Polling Flow

```
 ┌──────────┐     ┌──────────────┐     ┌────────────┐     ┌──────────────┐
 │  UI       │     │  React Query │     │  Service   │     │  Bluesky     │
 │  Component│     │  (Cache)     │     │  Layer     │     │  API         │
 └─────┬─────┘     └──────┬───────┘     └─────┬──────┘     └──────┬───────┘
       │                  │                   │                   │
       │  useNotifications()                   │                   │
       │  refetchInterval: 30000               │                   │
       │  staleTime: 15000                     │                   │
       │─────────────────>│                   │                   │
       │                  │                   │                   │
       │                  │  queryFn executes  │                   │
       │                  │─────────────────>│                   │
       │                  │                   │                   │
       │                  │                   │  listNotifications│
       │                  │                   │  ({ limit: 50 })  │
       │                  │                   │─────────────────>│
       │                  │                   │                   │
       │                  │                   │  { notifications: │
       │                  │                   │    [...],         │
       │                  │                   │    cursor }       │
       │                  │                   │<─────────────────│
       │                  │                   │                   │
       │                  │  Return notifications                │
       │                  │<─────────────────│                   │
       │                  │                   │                   │
       │  Render list:    │                   │                   │
       │  - Unread items  │                   │                   │
       │    have tinted   │                   │                   │
       │    background    │                   │                   │
       │  - Group by      │                   │                   │
       │    time buckets  │                   │                   │
       │<─────────────────│                   │                   │
       │                  │                   │                   │
       │  User taps notification               │                   │
       │─────────────────>│                   │                   │
       │                  │                   │                   │
       │                  │  updateSeenNotifications(seenAt)      │
       │                  │─────────────────────────────────────>│
       │                  │                   │                   │
       │                  │  Navigate to target URI              │
       │<─────────────────│                   │                   │
       │                  │                   │                   │
       │  ─── 30 seconds later ───            │                   │
       │                  │                   │                   │
       │  Next poll cycle                     │                   │
       │─────────────────>│                   │                   │
```

### 2.5 Social Graph Traversal Flow

```
 ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
 │  Feature     │     │  Graph        │     │  Bluesky     │
 │  (People You │     │  Service     │     │  API         │
 │   May Know)  │     │              │     │              │
 └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
        │                    │                    │
        │  getPeopleYouMayKnow(20)                │
        │───────────────────>│                    │
        │                    │                    │
        │                    │  getFollows({       │
        │                    │    actor: self,     │
        │                    │    limit: 100       │
        │                    │  })                 │
        │                    │───────────────────>│
        │                    │                    │
        │                    │  Returns: { follows: │
        │                    │   [{ did, handle }] │
        │                    │<───────────────────│
        │                    │                    │
        │                    │  For each followed user (max 20):
        │                    │  getFollows({ actor: did2, limit: 100 })
        │                    │ (Promise.all with .catch for failures)
        │                    │───────────────────>│
        │                    │                    │
        │                    │<───────────────────│
        │                    │                    │
        │                    │  Compute 2nd-degree connections:
        │                    │  - Count how many times each DID appears
        │                    │  - Filter out self and existing follows
        │                    │  - Sort by frequency (descending)
        │                    │  - Return top 20
        │                    │                    │
        │  Return [{ did,    │                    │
        │    handle, count }]│                    │
        │<───────────────────│                    │
        │                    │                    │
        │  Cache in IndexedDB (30 min TTL)       │
        │  Show results with follow buttons      │
        │                    │                    │
```

### 2.6 Recommendation Computation Flow

```
 ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
 │  Discover     │     │  Recommenda- │     │  Bluesky     │
 │  Page        │     │  tion Engine │     │  API         │
 └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
        │                    │                    │
        │  getRecommendations()                   │
        │───────────────────>│                    │
        │                    │                    │
        │  STEP 1: Build MY content profile      │
        │                    │                    │
        │                    │  getAuthorFeed({    │
        │                    │    actor: self,     │
        │                    │    limit: 50        │
        │                    │  })                 │
        │                    │───────────────────>│
        │                    │                    │
        │                    │  Extract hashtags + word bigrams
        │                    │  Store in UserContentProfile {
        │                    │    hashtags: Map<tag, count>,
        │                    │    bigrams: Map<phrase, count>
        │                    │  }
        │                    │<───────────────────│
        │                    │                    │
        │  STEP 2: Build profiles for followed users (max 30)  │
        │                    │                    │
        │                    │  getFollows({ actor: self }) → get DIDs
        │                    │───────────────────>│
        │                    │<───────────────────│
        │                    │                    │
        │                    │  For each DID:
        │                    │  getAuthorFeed({ actor: did, limit: 50 })
        │                    │  (Promise.allSettled, skip failures)
        │                    │───────────────────>│
        │                    │<───────────────────│
        │                    │                    │
        │  STEP 3: Cosine similarity             │
        │                    │                    │
        │                    │  For each followed profile:
        │                    │  cosineSimilarity(myProfile, theirProfile)
        │                    │  = dotProduct / (√magA * √magB)
        │                    │                    │
        │  STEP 4: Find suggestions              │
        │                    │                    │
        │                    │  Take top 5 similar follows
        │                    │  For each: getFollows() → candidates
        │                    │───────────────────>│
        │                    │<───────────────────│
        │                    │                    │
        │                    │  Filter: exclude self + existing follows
        │                    │  Rank: count of appearances
        │                    │  Return: top 20 DIDs
        │                    │                    │
        │  Return [{ did, handle, score }]       │
        │<───────────────────│                    │
        │                    │                    │
        │  Store in IndexedDB (1 hour TTL)       │
        │  Render user cards with follow buttons │
        │                    │                    │
```

---

## 3. COMPONENT → API MAPPING

| Component | API Endpoint(s) | Frequency | Caching |
|-----------|----------------|-----------|---------|
| **FeedList** | `agent.getTimeline({ limit: 30, cursor })` | On mount + scroll | 60s stale, 5min GC |
| **VoicePlayer** | `agent.uploadBlob()` on post, `agent.com.atproto.repo.getRecord()` for custom data | On post creation | N/A (write once) |
| **PostComposer** | `agent.uploadBlob()` → `agent.com.atproto.repo.putRecord()` | On each post | N/A (write) |
| **PostDetail** | `agent.getPostThread({ uri, depth: 6 })` | On mount | 30s stale |
| **LikeButton** | `agent.like(uri, cid)` / `agent.deleteLike(uri)` | On click | Optimistic update |
| **FollowButton** | `agent.follow(did)` / `agent.deleteFollow(uri)` | On click | Optimistic update |
| **RepostButton** | `agent.repost(uri, cid)` / `agent.deleteRepost(uri)` | On click | Optimistic update |
| **ProfileHeader** | `agent.getProfile({ actor })` + `agent.getRecord({ collection: 'voiceflow.actor.bio' })` | On mount | 5min stale |
| **ProfileTabs** | `agent.getAuthorFeed()` (Posts), `getActorLikes()` (Likes) | On tab switch | 2min stale |
| **NotificationList** | `agent.listNotifications({ limit: 50 })` | Poll 30s | 15s stale |
| **SearchResults** | `agent.searchActors()` + `agent.searchPosts()` | On input (debounced 300ms) | No cache |
| **ConversationList** | No native AT Protocol DMs — custom backend needed | On mount | 30s |
| **SettingsAccount** | `agent.com.atproto.repo.putRecord()` for profile edits | On save | N/A (write) |
| **BlockList** | `agent.app.bsky.graph.getBlocks()` | On mount | 5min |
| **MuteList** | `agent.app.bsky.graph.getMutes()` | On mount | 5min |
| **MusicMatch** | `agent.com.atproto.repo.getRecord({ collection: 'voiceflow.music.preference' })` | On mount | 1 hour (IndexedDB) |
| **Discover** | Multiple `getAuthorFeed()` + cosine similarity (client-side) | On mount | 1 hour (IndexedDB) |

---

## 4. STATE MANAGEMENT & DATA FLOW

### 4.1 State Layers

```
 ┌──────────────────────────────────────────────────────┐
 │  Layer 1: Server State (React Query)                 │
 │  ──────────────────────────────────────────          │
 │  - Feed data, profiles, notifications, search        │
 │  - Automatically cached, deduplicated, refetched     │
 │  - staleTime controls freshness per query            │
 │  - Optimistic updates for likes/follows              │
 └──────────────────────────────────────────────────────┘
                          │
                          ▼
 ┌──────────────────────────────────────────────────────┐
 │  Layer 2: Application State (React Context)          │
 │  ──────────────────────────────────────────          │
 │  - BskyAgent instance (auth context)                 │
 │  - Current user's DID, handle, session               │
 │  - Theme preference (dark/light)                     │
 │  - UI state (active tab, composer open/closed)       │
 └──────────────────────────────────────────────────────┘
                          │
                          ▼
 ┌──────────────────────────────────────────────────────┐
 │  Layer 3: Persistent State (IndexedDB / localStorage)│
 │  ──────────────────────────────────────────          │
 │  - Recommendation cache (1 hour TTL)                 │
 │  - Social graph cache (30 min TTL)                   │
 │  - Draft voice recordings (temporary)                │
 │  - User preferences (settings, muted words)          │
 │  - Backup timestamps                                 │
 └──────────────────────────────────────────────────────┘
```

### 4.2 React Query Key Structure

```typescript
// Query key convention: [domain, ...identifiers, type]
// Examples:

['feed', 'following']                              // Main timeline
['feed', 'author', did]                            // User's feed
['feed', 'thread', uri]                            // Post thread

['profile', did]                                   // Profile data
['profile', did, 'voiceBio']                       // Voice bio
['profile', did, 'musicPrefs']                     // Music preferences

['graph', did, 'follows']                          // Who someone follows
['graph', did, 'followers']                        // Who follows someone
['graph', did, 'mutuals']                          // Mutual follows

['notifications', 'list']                          // Notification list
['search', 'actors', term]                         // Actor search
['search', 'posts', term]                          // Post search

['discover', 'recommendations']                    // Recomputed suggestions
['discover', 'musicMatches']                       // Music matches
```

---

## 5. ROUTE STRUCTURE

```typescript
// Next.js App Router Structure

/                              // Landing page / redirect to feed
/login                         // Login / sign up page
/oauth/callback                // OAuth callback handler

/(app)/                        // Authenticated layout group
  /feed                        // Main feed (home)
  /feed/[uri]                   // Post detail / thread view

  /search                       // Search page
  /search?q=term               // Search results

  /notifications                // Notifications

  /messages                     // DM conversation list
  /messages/[did]               // Individual conversation

  /profile/[handle]             // Public profile view
  /profile/[handle]/followers   // Follower list
  /profile/[handle]/following   // Following list

  /settings                     // Settings page
  /settings/blocked
  /settings/muted
  /settings/privacy

  /compose                      // Post composer (modal or page)

  /discover                     // Discover / explore
  /discover/music               // Music matching page

/api/
  /auth/login                   // Initiate OAuth login
  /auth/callback                // OAuth callback handler
  /auth/logout                  // Logout handler

  /realtime                     // SSE endpoint (post-launch)

(modal)                         // Intercepting routes for modals
  /feed/[uri]                    // Post detail as modal over feed
  /compose                       // Composer as modal
  /messages/[did]                // DM as sidebar panel (desktop)
```

---

*Plain wireframe document — no visual design elements, logos, waves, or decorative icons. Every screen specifies API calls, data flow, and component interactions. This is the structural blueprint for implementation.*
