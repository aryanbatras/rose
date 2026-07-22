# Rose — Feature Specification

> **Date:** July 22, 2026  
> **Covers:** All pages/routes, interactions, and unique features

---

## 1. Routes Overview

| Route | Page | Type | Description |
|-------|------|------|-------------|
| `/` | Home | Redirect | Redirects to `/feed` (authenticated) or `/login` (guest) |
| `/feed` | Feed | Main | Main media feed with infinite scroll |
| `/feed/[uri]` | Thread | Detail | Single post with comments/replies |
| `/reels` | Reels | Main | Full-screen vertical video feed |
| `/search` | Search | Main | Search posts + people + Discover grid |
| `/discover` | Discover | Main | Browse 50k+ feeds, people suggestions, saved feeds |
| `/compose` | Compose | Main | Create post with image editor |
| `/profile/[handle]` | Profile | Detail | User profile with author feed |
| `/notifications` | Notifications | Main | Activity notifications |
| `/bookmarks` | Bookmarks | Main | Saved/bookmarked posts |
| `/spells` | Spells | Main | Digital wellness spells |
| `/groups` | Groups | Main | Chat groups list |
| `/groups/[id]` | Group Chat | Detail | Group conversation |
| `/groups/join` | Join Group | Detail | Join group via invite code |
| `/messages` | Messages | Main | Direct messages |
| `/settings` | Settings | Main | App settings |
| `/login` | Login | Auth | Sign in with Bluesky account |
| `/signup` | Signup | Auth | Create new Bluesky account |

---

## 2. Feed Page (`/feed`)

### Purpose
The main content consumption surface. Shows a single-column feed of media posts (images/videos only) from the selected source.

### Features
- **Feed source selector** — dropdown to switch between Following, Trending, Discover, or any saved custom feed
- **Infinite scroll** — IntersectionObserver triggers next page at 200px before the end
- **Post Cards** — icon-free design:
  - Avatar with Instagram-style gradient ring
  - Display name (clickable → profile)
  - Large image/video with generous border-radius (16px)
  - Time overlay (soft pill top-right of image)
  - Play button overlay for videos
  - Like count text (coral when liked, click to toggle)
  - Caption with display name (clickable → thread view)
- **Double-click to like** on images
- **Deduped posts** — removes duplicates by URI before rendering
- **Filtered to media only** — text-only posts are hidden

### States
| State | Behavior |
|-------|----------|
| Loading | 3 skeleton cards (pulsing avatar, image block) |
| Empty | "No posts to show" with "Follow some users or pick a feed" |
| Error | "Could not load this feed" with Try Again button |
| Loading more | 2 skeleton cards at bottom while paginating |
| NSFW content | Filtered server-side, never reaches client |

---

## 3. Reels (`/reels`)

### Purpose
Full-screen vertical video feed inspired by Instagram Reels / TikTok. Videos play automatically with snap-scroll.

### Features
- **Full-screen layout** — fixed inset, dark background (`oklch(0.04 0.003 80)`)
- **Snap scroll** — CSS `scroll-snap-type: y mandatory` on container
- **HLS video playback** — `hls.js` library with native HLS fallback for Safari
- **Auto play/pause** — detects which video is in view via scroll event + bounding rect
- **Feed source dropdown** — switch between All Sources, Following, Trending, or custom feeds
- **Multi-source aggregation** — "All Sources" fetches from BOTH discover + following simultaneously
- **Recursive pagination** — fetches up to 5 pages per source or until 15 videos found
- **Like button** — each reel has a like button that toggles via API
- **Author row** — avatar + display name at the bottom, clickable → profile
- **Caption** — truncated to 2 lines with gradient fade
- **Close button** — back arrow top-left
- **Empty state** — "No reels found" with prompt to try All Sources

### Pagination Strategy
- Fetches 50 items per page
- Filters client-side for video-only posts
- If first page has few videos, paginates recursively (up to 5 pages)
- Load-more triggers at 70% threshold (when user has scrolled through ~70% of loaded reels)
- Ref-based pagination prevents infinite loops and stale closures

---

## 4. Discover (`/discover`)

### Purpose
Browse 50,000+ Bluesky custom feed generators, discover new people, and manage saved feeds.

### Tabs
| Tab | Description |
|-----|-------------|
| **Search Feeds** | Search 50k+ feeds by name/description via Bluesky API + browse popular feeds |
| **People** | Suggested actors to follow (from Bluesky's own suggestions) |
| **Saved** | List of user's saved custom feeds with View/Remove |

### Feed Search Features
- **Popular feeds default** — 25 most popular feeds loaded on mount (cached between tab switches)
- **Infinite scroll** — IntersectionObserver loads more popular feeds (cursor-paginated)
- **Text search** — debounced (300ms) API search by name/description
- **Subscribe/Unsubscribe** — one-click add/remove of feeds from saved list
- **Feed list items** — show avatar (or fallback icon), label, description, like count, and Add/Added button

---

## 5. Search (`/search`)

### Purpose
Search for posts (media grid) and people across the Bluesky network.

### States
| State | Behavior |
|-------|----------|
| **No query** | Shows a **Discover grid** — 3-column media grid of photos/videos from the "what's hot" feed, with infinite scroll |
| **Has query** | Shows search results with tabs (Top, People, Posts) |
| **Posts tab** | 3-column media grid with hover overlays (like Instagram Explore) — infinite scroll with cursor pagination |
| **People tab** | List of matching actors with avatar, display name, handle |
| **Top tab** | Split view: People section + Posts grid |

### Infinite Scroll
- Search posts use `useInfiniteQuery` with cursor-based pagination
- IntersectionObserver with 400px rootMargin preloads results before user reaches the end
- Sentinel shows spinner during fetch, "No more results" when exhausted

---

## 6. Compose (`/compose`)

### Purpose
Create new posts (image required) with an optional caption and reply context.

### Features
- **Image required** — posts must include at least one photo (enforced by UI)
- **Image compression** — all images compressed via `browser-image-compression` to max 1200px width, quality adjusted to stay under 1MB
- **Image editor** (full-screen modal):
  - **Filters** — 14 CSS-based filters: Original, Clarendon, Gingham, Moon, Lark, Reyes, Juno, Slumber, Crema, Ludwig, Aden, Perpetua, Amaro, Mayfair
  - **Adjust** — Brightness, Contrast, Saturation, Blur (slider controls)
  - **Crop** — Draggable overlay with corner handles, preset aspect ratios (Free, 1:1, 4:5, 16:9)
  - **Rotate** — 90° clockwise rotation
  - **Text** — Click to add text overlay, draggable across canvas
  - **Stickers** — 12 emoji stickers (😊❤️🔥🎉✨🌟💪🎨💡🌈⭐🎯), drag-to-move
  - **Doodle** — Freehand drawing with brush size and color picker
  - **Collage** — Grid layouts (1, 2, 3, 4 images in various grid patterns)
  - **Reset** — Clears all edits
  - **Done** — Composited image created and compressed
- **Caption** — up to 300 characters, auto-resizing textarea
- **Reply context** — shows replying-to info when navigated from a post

---

## 7. Post Thread (`/feed/[uri]`)

### Purpose
View a single post with its replies in a threaded conversation view.

### Features
- **Header** — back button + "Post" title
- **Main post** — rendered via `FeedCard` component
- **Reply thread** — recursive component that renders replies with:
  - Shallow indentation (**16px per level**, like Instagram)
  - Single thin vertical thread connector line (not multiple lines)
  - Small colored dot at each connection point
  - Left accent border on each reply card
  - No opacity fade at deep levels (all replies equally readable)
  - Max depth: 10 levels (shows "… continued deeper" beyond that)
  - Colors cycle through 4 hues (brand, muted, accent, blue)
- **Reply composer** — sticky input at bottom, navigates to `/compose` with reply context

---

## 8. Profile (`/profile/[handle]`)

### Purpose
View a user's profile with their posts, bio, and social stats.

### Features
- **Profile header** — avatar, display name, handle, bio/description, follower/following/post counts
- **Author feed** — paginated feed of the user's posts (cursor-based infinite scroll)
- **Follow/Unfollow** — toggle button
- **Own profile** — shows Edit Profile option and Settings link

---

## 9. Notifications (`/notifications`)

### Purpose
View activity notifications (likes, reposts, follows, mentions, replies).

### Features
- **Polling** — unread count polled via `useUnreadCount` hook
- **Notification list** — grouped by type with icon, user info, and timestamp
- **Read/unread** — visual distinction with mark-as-read API
- **Badge** — unread count shown on sidebar and mobile nav bell icon

---

## 10. Bookmarks (`/bookmarks`)

### Purpose
Save posts for later reading.

### Features
- **Zustand store** persisted to localStorage (`rose-bookmarks`)
- **Add bookmark** — from FeedCard or post thread
- **Remove bookmark** — swipe or button
- **Bookmark count** — shown on sidebar bookmarks icon

---

## 11. Spells (`/spells`)

### Purpose
A unique digital wellness system. Spells are client-side "spells" that modify the app's behavior (hide UI elements, disable interactions, show reminders).

### Predefined Spells

| Spell | Effect | Condition |
|-------|--------|-----------|
| **Quiet Shadow** | Hides avatar, display name, handle, header | Always active |
| **Night Lantern** | Disables like, reply, repost; hides compose | Active 00:00–08:00 |
| **A Brief Detox** | Shows a mindful reminder after 15 min of browsing | Session duration >15 min |
| **Hydrate** | Shows hydration reminder every 30 min | Interval timer |
| **Quiet After Storm** | Disables reply after 10+ replies sent | Daily reply count >10 |
| **Zen Feed** | Hides engagement metrics (like counts) | Always active |
| **Lurker Mode** | Hides all interaction buttons | Always active |
| **Distraction Free** | Hides Feeds, Search, Profile nav items | Always active |

### Implementation
- Spells are evaluated client-side via `useSpells()` hook
- Effects are applied via conditional rendering in components
- Each spell has a condition (time, count, duration, interval, or always)
- Spell state persisted in Zustand (`rose-spells`)
- Spell effects are pure React state (no API calls needed since they're client-side)

---

## 12. Groups & Messages (`/groups`, `/messages`)

### Purpose
Chat groups and direct messages built on Bluesky's Chat (Convo) API.

### Features
- **Group list** — shows joined groups with name, member count, unread count
- **Group chat** — real-time message list, message composer
- **Message polling** — polls every 8s for new messages (since AT Protocol lacks WebSocket chat)
- **Create group** — form with name, description, member selection
- **Join links** — invite code system with approval toggle
- **Group settings** — edit name, mute/unmute, approval toggle
- **Direct messages** — 1-on-1 conversations

---

## 13. Authentication Pages

### Login (`/login`)
- Bluesky account credentials (identifier + password)
- Validation error handling
- Redirect to `/feed` on success

### Signup (`/signup`)
- Create new Bluesky account
- Fields: handle, email, password (optional invite code)
- Server-side validation with friendly error messages
- Note: Direct signup may be blocked on bsky.social — graceful fallback

---

## 14. Settings (`/settings`)
- Theme toggle (light/dark)
- Logout button
- App version info
- "Powered by AT Protocol" branding
