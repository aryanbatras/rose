// AT Protocol type definitions for Rose
// Only includes types supported by Bluesky/AT Protocol infrastructure

export type DID = string & { __brand: 'did' };
export type CID = string & { __brand: 'cid' };
export type Handle = string;

export interface SessionData {
  did: DID;
  handle: Handle;
  accessJwt: string;
  refreshJwt: string;
  active?: boolean;
}

export interface PostRecord {
  $type: string;
  text: string;
  createdAt: string;
  facets?: Facet[];
  embed?: Embed;
  reply?: ReplyRef;
}

export interface BlobRef {
  $type: 'blob';
  ref: { $link: string };
  mimeType: string;
  size: number;
}

export interface Facet {
  index: { byteStart: number; byteEnd: number };
  features: Array<{
    $type: string;
    uri?: string;
    did?: string;
    tag?: string;
  }>;
}

export interface Embed {
  $type: string;
  images?: Array<{
    thumb: string;
    fullsize: string;
    alt: string;
    aspectRatio?: { width: number; height: number };
  }>;
  external?: {
    uri: string;
    title: string;
    description: string;
    thumb?: string;
  };
  record?: {
    uri: string;
    cid: string;
    author?: ActorView;
  };
  // Hydrated View form: embed.playlist, embed.thumbnail
  playlist?: string;
  thumbnail?: string;
  // Raw Main form: embed.video.playlist, embed.video.thumbnail
  video?: {
    cid: string;
    playlist?: string;
    thumbnail?: string;
  };
}

export interface ReplyRef {
  root: { uri: string; cid: string };
  parent: { uri: string; cid: string };
}

export interface FeedItem {
  uri: string;
  cid: string;
  author: ActorView;
  record: PostRecord;
  indexedAt: string;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  viewer?: {
    like?: string;
    repost?: string;
  };
  labels?: Label[];
  reason?: {
    $type: string;
    by: { handle: string; displayName?: string; avatar?: string };
  };
  reply?: {
    root: FeedItem;
    parent: FeedItem;
  };
}

export interface ActorView {
  did: DID;
  handle: Handle;
  displayName?: string;
  avatar?: string;
  banner?: string;
  description?: string;
  followersCount?: number;
  followsCount?: number;
  postsCount?: number;
  viewer?: {
    muted?: boolean;
    blockedBy?: boolean;
    following?: string;
    followedBy?: string;
  };
  labels?: Label[];
  createdAt?: string;
}

export interface Label {
  src: DID;
  uri: string;
  val: string;
  cid?: string;
  cts: string;
}

export interface NotificationItem {
  uri: string;
  cid: string;
  author: ActorView;
  reason: 'like' | 'repost' | 'follow' | 'mention' | 'reply' | 'quote';
  reasonSubject?: string;
  record: PostRecord;
  isRead: boolean;
  indexedAt: string;
  labels?: Label[];
}

export interface ProfileViewDetailed {
  did: DID;
  handle: Handle;
  displayName?: string;
  avatar?: string;
  banner?: string;
  description?: string;
  followersCount: number;
  followsCount: number;
  postsCount: number;
  viewer?: {
    muted?: boolean;
    blockedBy?: boolean;
    following?: string;
    followedBy?: string;
  };
  labels?: Label[];
  joinedViaStarterPack?: string;
  createdAt: string;
}

export interface FeedViewPost {
  post: FeedItem;
  reply?: {
    root: FeedItem;
    parent: FeedItem;
  };
  reason?: {
    $type: string;
    by: ActorView;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  cursor?: string;
}

export type FeedType = 'following' | 'trending' | 'discover';
export type NotificationFilter = 'all' | 'likes' | 'replies' | 'follows' | 'mentions';

// ─── View Modes ────────────────────────────────────
export type ViewMode = 'grid' | 'classic';

// ─── Filter Types ───────────────────────────────────
export interface ContentFilters {
  hideReposts: boolean;
  hideReplies: boolean;
  hideQuotePosts: boolean;
  mediaOnly: boolean;
  videoOnly: boolean;
  textOnly: boolean;
}

export interface MuteFilters {
  mutedWords: string[];
  mutedUsers: string[];
  mutedTags: string[];
}

export interface DisplayFilters {
  hideEngagementMetrics: boolean;
  feedDensity: 'comfortable' | 'compact';
}

export interface AllFilters {
  content: ContentFilters;
  mute: MuteFilters;
  display: DisplayFilters;
}

export interface Bookmark {
  uri: string;
  cid: string;
  author: { handle: string; displayName?: string; avatar?: string };
  text: string;
  savedAt: string;
}

export interface FeedSource {
  type: 'following' | 'discover' | 'trending' | 'custom' | 'list';
  uri?: string;
  label: string;
  icon?: string;
}

// ─── Keyboard Shortcut ────────────────────────────
export interface Shortcut {
  key: string;
  label: string;
  description: string;
  ctrl?: boolean;
  shift?: boolean;
}
