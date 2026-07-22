import { BskyAgent } from '@atproto/api';

/**
 * Normalize a feed item from a custom feed to match our FeedItem structure.
 */
function normalizeFeedItem(item: any): any {
  const post = item.post || item;
  const record = post.record || {};
  const embed = post.embed || record.embed;

  return {
    uri: post.uri,
    cid: post.cid,
    author: {
      did: post.author.did,
      handle: post.author.handle,
      displayName: post.author.displayName,
      avatar: post.author.avatar,
    },
    record: {
      $type: record.$type || 'app.bsky.feed.post',
      text: record.text || '',
      createdAt: record.createdAt || post.indexedAt,
      facets: record.facets,
      embed,
    },
    indexedAt: post.indexedAt,
    likeCount: post.likeCount || 0,
    replyCount: post.replyCount || 0,
    repostCount: post.repostCount || 0,
    viewer: post.viewer,
    labels: post.labels,
    reason: item.reason,
  };
}

/**
 * Feed categories for browsing.
 */
export const FEED_CATEGORIES = [
  '🔥 Trending',
  '🎨 Art & Design',
  '📸 Photography',
  '📚 Books & Writing',
  '🌍 Science & Nature',
  '🎮 Gaming',
  '🐱 Pets & Animals',
  '✈️ Travel',
  '🗞️ News & Politics',
] as const;

/**
 * Known popular Bluesky feeds that work out of the box — curated into categories.
 * All URIs have been verified via curl against the Bluesky AT Protocol API.
 * URI format: at://did:plc:xxx/app.bsky.feed.generator/name
 */
export const CURATED_FEEDS: Array<{
  uri: string;
  label: string;
  description: string;
  avatar?: string;
  category: string;
}> = [
  // ── Trending ────────────────────────────────────────────────────
  {
    uri: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot',
    label: 'Discover',
    description: 'Trending posts across the whole network right now',
    category: '🔥 Trending',
  },
  {
    uri: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/with-friends',
    label: 'Popular With Friends',
    description: 'Posts liked by people you follow',
    category: '🔥 Trending',
  },
  {
    uri: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/hot-classic',
    label: "What's Hot Classic",
    description: 'The original What\'s Hot feed',
    category: '🔥 Trending',
  },
  {
    uri: 'at://did:plc:3guzzweuqraryl3rdkimjamk/app.bsky.feed.generator/for-you',
    label: 'For You',
    description: 'Personalized feed based on your interests',
    category: '🔥 Trending',
  },

  // ── Art & Design ────────────────────────────────────────────────
  {
    uri: 'at://did:plc:odqmsar3ikz5ubokya4sempk/app.bsky.feed.generator/aaabfn4o34jdi',
    label: 'Art: What\'s Hot',
    description: 'Trending artwork and creative posts',
    category: '🎨 Art & Design',
  },
  {
    uri: 'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/art-new',
    label: 'Artists: Trending',
    description: 'Trending artists and illustrators',
    category: '🎨 Art & Design',
  },

  // ── Photography ─────────────────────────────────────────────────
  {
    uri: 'at://did:plc:y7crv2yh74s7qhmtx3mvbgv5/app.bsky.feed.generator/photography',
    label: 'Photography',
    description: 'Photo-focused posts from the community',
    category: '📸 Photography',
  },
  {
    uri: 'at://did:plc:ojisdwhv5b7tzitkipo3yx3f/app.bsky.feed.generator/aaao3rw3oxwku',
    label: 'Photography 📷',
    description: 'Curated photography from around Bluesky',
    category: '📸 Photography',
  },

  // ── Books & Writing ─────────────────────────────────────────────
  {
    uri: 'at://did:plc:geoqe3qls5mwezckxxsewys2/app.bsky.feed.generator/aaabrbjcg4hmk',
    label: 'BookSky 💙📚',
    description: 'Book lovers and literary discussions (#booksky)',
    category: '📚 Books & Writing',
  },

  // ── Science & Nature ────────────────────────────────────────────
  {
    uri: 'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/for-science',
    label: 'Science',
    description: 'Scientific discoveries, research, and discussions',
    category: '🌍 Science & Nature',
  },

  // ── Gaming ──────────────────────────────────────────────────────
  {
    uri: 'at://did:plc:lcytlkvzs3wslcgbk7i3ygak/app.bsky.feed.generator/aaagupc7dl6se',
    label: 'Gaming',
    description: 'Video game discussions, news, and communities',
    category: '🎮 Gaming',
  },

  // ── Pets & Animals ──────────────────────────────────────────────
  {
    uri: 'at://did:plc:jfhpnnst6flqway4eaeqzj2a/app.bsky.feed.generator/cats',
    label: 'Cats!',
    description: 'Everything cats — photos, stories, and cat lovers',
    category: '🐱 Pets & Animals',
  },

  // ── Travel ──────────────────────────────────────────────────────
  {
    uri: 'at://did:plc:ox3zyhuvac4uhodyxjxc7hd5/app.bsky.feed.generator/aaaa3qe7reghy',
    label: 'Travel Lovers',
    description: 'Travel stories, tips, photos, and adventure',
    category: '✈️ Travel',
  },

  // ── News & Politics ─────────────────────────────────────────────
  {
    uri: 'at://did:plc:kkf4naxqmweop7dv4l2iqqf5/app.bsky.feed.generator/verified-news',
    label: '📰 News',
    description: 'Verified news sources and updates',
    category: '🗞️ News & Politics',
  },
];

/**
 * Normalize a GeneratorView object from Bluesky into a uniform FeedInfo shape.
 */
function normalizeGeneratorView(view: any) {
  return {
    uri: view.uri,
    label: view.displayName || view.uri.split('/').pop() || 'Custom Feed',
    description: view.description || '',
    avatar: view.avatar,
    creatorDid: view.creator?.did,
    creatorHandle: view.creator?.handle,
    creatorDisplayName: view.creator?.displayName,
    likeCount: view.likeCount ?? 0,
  };
}

/**
 * Fetch metadata for multiple feed generators at once.
 */
export async function getFeedGeneratorsInfo(
  agent: BskyAgent,
  feedUris: string[]
): Promise<Array<{ uri: string; label: string; description: string; avatar?: string }>> {
  try {
    const response = await agent.app.bsky.feed.getFeedGenerators({ feeds: feedUris });
    return response.data.feeds.map((view: any) => normalizeGeneratorView(view));
  } catch {
    return [];
  }
}

/**
 * Fetch suggested feeds for the current user.
 * Uses app.bsky.feed.getSuggestedFeeds — no search, returns Bluesky's own recommendations.
 */
export async function getSuggestedFeeds(
  agent: BskyAgent,
  limit = 30,
  cursor?: string
): Promise<{
  feeds: Array<{
    uri: string;
    label: string;
    description: string;
    avatar?: string;
    creatorDid?: string;
    creatorHandle?: string;
    creatorDisplayName?: string;
    likeCount: number;
  }>;
  cursor?: string;
}> {
  try {
    const response = await agent.app.bsky.feed.getSuggestedFeeds({ limit, cursor });
    return {
      feeds: response.data.feeds.map((view: any) => normalizeGeneratorView(view)),
      cursor: response.data.cursor,
    };
  } catch (error) {
    console.error('getSuggestedFeeds error:', error);
    return { feeds: [] };
  }
}

/**
 * Fetch popular/trending feed generators.
 * Uses app.bsky.unspecced.getPopularFeedGenerators which supports an optional `query` param for search.
 * This is the main endpoint for discovering 50,000+ custom feeds on Bluesky.
 */
export async function getPopularFeedGenerators(
  agent: BskyAgent,
  options?: {
    limit?: number;
    cursor?: string;
    query?: string; // Optional search term to filter feeds by name/description
  }
): Promise<{
  feeds: Array<{
    uri: string;
    label: string;
    description: string;
    avatar?: string;
    creatorDid?: string;
    creatorHandle?: string;
    creatorDisplayName?: string;
    likeCount: number;
  }>;
  cursor?: string;
}> {
  try {
    const params: Record<string, any> = {};
    if (options?.limit) params.limit = options.limit;
    if (options?.cursor) params.cursor = options.cursor;
    if (options?.query) params.query = options.query;

    const response = await (agent.app.bsky.unspecced as any).getPopularFeedGenerators(params);
    return {
      feeds: response.data.feeds.map((view: any) => normalizeGeneratorView(view)),
      cursor: response.data.cursor,
    };
  } catch (error) {
    console.error('getPopularFeedGenerators error:', error);
    return { feeds: [] };
  }
}

/**
 * Get posts from a specific custom feed.
 * Used to view a feed's content from the feed page.
 */
export async function getFeedPosts(
  agent: BskyAgent,
  feedUri: string,
  cursor?: string,
  limit = 30
): Promise<{ items: any[]; cursor?: string }> {
  const response = await agent.app.bsky.feed.getFeed({
    feed: feedUri,
    limit,
    cursor,
  });
  return {
    items: response.data.feed.map((item: any) => normalizeFeedItem(item)),
    cursor: response.data.cursor,
  };
}
