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
  '💻 Tech & Dev',
  '🎵 Music & Audio',
  '🎬 Video & Media',
  '📚 Books & Writing',
  '🌍 Science & Nature',
  '🏛️ History & Culture',
  '💡 Philosophy & Ideas',
  '🎮 Gaming',
  '🏳️‍🌈 LGBTQ+',
  '🐱 Pets & Animals',
  '✈️ Travel',
  '🍔 Food & Cooking',
  '🧘 Wellness & Mental Health',
  '🏃 Sports & Fitness',
  '🗞️ News & Politics',
  '💰 Finance & Economics',
  '🎓 Education',
  '🎭 Comedy & Memes',
  '📱 Design & UX',
  '🌿 Environment',
  '🔮 Niche & Fun',
] as const;

/**
 * Known popular Bluesky feeds that work out of the box — curated into categories.
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
    uri: 'at://did:plc:tenurhgjptv3lcaqergxe2cj/app.bsky.feed.generator/whats-hot',
    label: "What's Hot",
    description: 'Trending posts across the whole network right now',
    category: '🔥 Trending',
  },
  {
    uri: 'at://did:plc:tenurhgjptv3lcaqergxe2cj/app.bsky.feed.generator/divergent',
    label: 'Popular With Friends',
    description: 'Posts liked by people you follow',
    category: '🔥 Trending',
  },
  {
    uri: 'at://did:plc:tenurhgjptv3lcaqergxe2cj/app.bsky.feed.generator/mutuals',
    label: 'Mutuals Only',
    description: 'Posts from people you follow who also follow you',
    category: '🔥 Trending',
  },
  {
    uri: 'at://did:plc:tenurhgjptv3lcaqergxe2cj/app.bsky.feed.generator/only-posts',
    label: 'Posts Only',
    description: 'A clean timeline without any reposts',
    category: '🔥 Trending',
  },

  // ── Art & Design ────────────────────────────────────────────────
  {
    uri: 'at://did:plc:vpkhqoltc6mcef7kixq2nqjr/app.bsky.feed.generator/art',
    label: 'Art & Design',
    description: 'Creative and artistic posts from the community',
    category: '🎨 Art & Design',
  },
  {
    uri: 'at://did:plc:ewvi7nxr4s3w3czlcdge2kce/app.bsky.feed.generator/art',
    label: 'Artists & Illustrators',
    description: 'Original artwork and illustrations',
    category: '🎨 Art & Design',
  },
  {
    uri: 'at://did:plc:z72i7hd6qxsalby5gc5z6l6c/app.bsky.feed.generator/art',
    label: 'Digital Art',
    description: 'Digital paintings, pixel art, and 3D renders',
    category: '🎨 Art & Design',
  },
  {
    uri: 'at://did:plc:oio4ral3i2pqhqbf7v2n7loq/app.bsky.feed.generator/traditional-art',
    label: 'Traditional Art',
    description: 'Watercolor, oil, pencil, and other traditional mediums',
    category: '🎨 Art & Design',
  },
  {
    uri: 'at://did:plc:vpkhqoltc6mcef7kixq2nqjr/app.bsky.feed.generator/design',
    label: 'Design',
    description: 'UI/UX, graphic design, typography, and branding',
    category: '🎨 Art & Design',
  },
  {
    uri: 'at://did:plc:z72i7hd6qxsalby5gc5z6l6c/app.bsky.feed.generator/design',
    label: 'Design Inspiration',
    description: 'Curated design inspiration and case studies',
    category: '🎨 Art & Design',
  },

  // ── Photography ─────────────────────────────────────────────────
  {
    uri: 'at://did:plc:vpkhqoltc6mcef7kixq2nqjr/app.bsky.feed.generator/photography',
    label: 'Photography',
    description: 'Photo-focused posts from the community',
    category: '📸 Photography',
  },
  {
    uri: 'at://did:plc:z72i7hd6qxsalby5gc5z6l6c/app.bsky.feed.generator/photography',
    label: 'Street Photography',
    description: 'Urban and street photography from around the world',
    category: '📸 Photography',
  },
  {
    uri: 'at://did:plc:ewvi7nxr4s3w3czlcdge2kce/app.bsky.feed.generator/nature-photography',
    label: 'Nature & Landscapes',
    description: 'Beautiful landscapes, wildlife, and nature shots',
    category: '📸 Photography',
  },
  {
    uri: 'at://did:plc:oio4ral3i2pqhqbf7v2n7loq/app.bsky.feed.generator/portrait-photography',
    label: 'Portrait Photography',
    description: 'Portraits, lifestyle, and fashion photography',
    category: '📸 Photography',
  },
  {
    uri: 'at://did:plc:z72i7hd6qxsalby5gc5z6l6c/app.bsky.feed.generator/film-photography',
    label: 'Film Photography',
    description: 'Analog and film photography enthusiasts',
    category: '📸 Photography',
  },

  // ── Tech & Dev ──────────────────────────────────────────────────
  {
    uri: 'at://did:plc:vpkhqoltc6mcef7kixq2nqjr/app.bsky.feed.generator/tech',
    label: 'Tech & Dev',
    description: 'Technology and development discussions',
    category: '💻 Tech & Dev',
  },
  {
    uri: 'at://did:plc:z72i7hd6qxsalby5gc5z6l6c/app.bsky.feed.generator/tech',
    label: 'Tech News',
    description: 'Latest tech news, releases, and announcements',
    category: '💻 Tech & Dev',
  },
  {
    uri: 'at://did:plc:ewvi7nxr4s3w3czlcdge2kce/app.bsky.feed.generator/webdev',
    label: 'Web Development',
    description: 'HTML, CSS, JavaScript, frameworks, and web standards',
    category: '💻 Tech & Dev',
  },
  {
    uri: 'at://did:plc:oio4ral3i2pqhqbf7v2n7loq/app.bsky.feed.generator/programming',
    label: 'Programming',
    description: 'General programming discussions across all languages',
    category: '💻 Tech & Dev',
  },
  {
    uri: 'at://did:plc:z72i7hd6qxsalby5gc5z6l6c/app.bsky.feed.generator/opensource',
    label: 'Open Source',
    description: 'Open source projects, contributions, and discussions',
    category: '💻 Tech & Dev',
  },
  {
    uri: 'at://did:plc:vpkhqoltc6mcef7kixq2nqjr/app.bsky.feed.generator/ai',
    label: 'AI & Machine Learning',
    description: 'AI research, LLMs, tools, and discussions',
    category: '💻 Tech & Dev',
  },
  {
    uri: 'at://did:plc:ewvi7nxr4s3w3czlcdge2kce/app.bsky.feed.generator/cybersecurity',
    label: 'Cybersecurity',
    description: 'Infosec, hacking, privacy, and security research',
    category: '💻 Tech & Dev',
  },

  // ── Music & Audio ───────────────────────────────────────────────
  {
    uri: 'at://did:plc:z72i7hd6qxsalby5gc5z6l6c/app.bsky.feed.generator/music',
    label: 'Music Lovers',
    description: 'Music discussions, recommendations, and sharing',
    category: '🎵 Music & Audio',
  },
  {
    uri: 'at://did:plc:ewvi7nxr4s3w3czlcdge2kce/app.bsky.feed.generator/electronic-music',
    label: 'Electronic Music',
    description: 'EDM, house, techno, ambient, and electronic genres',
    category: '🎵 Music & Audio',
  },
  {
    uri: 'at://did:plc:oio4ral3i2pqhqbf7v2n7loq/app.bsky.feed.generator/indie-music',
    label: 'Indie & Alternative',
    description: 'Independent artists, alternative, and underground music',
    category: '🎵 Music & Audio',
  },
  {
    uri: 'at://did:plc:vpkhqoltc6mcef7kixq2nqjr/app.bsky.feed.generator/jazz',
    label: 'Jazz & Blues',
    description: 'Jazz, blues, soul, and R&B',
    category: '🎵 Music & Audio',
  },
  {
    uri: 'at://did:plc:z72i7hd6qxsalby5gc5z6l6c/app.bsky.feed.generator/classical-music',
    label: 'Classical Music',
    description: 'Orchestral, chamber, and contemporary classical',
    category: '🎵 Music & Audio',
  },

  // ── Video & Media ───────────────────────────────────────────────
  {
    uri: 'at://did:plc:vpkhqoltc6mcef7kixq2nqjr/app.bsky.feed.generator/video',
    label: 'Video Feeds',
    description: 'Videos from across Bluesky',
    category: '🎬 Video & Media',
  },
  {
    uri: 'at://did:plc:z72i7hd6qxsalby5gc5z6l6c/app.bsky.feed.generator/filmmaking',
    label: 'Filmmaking',
    description: 'Film, video production, and cinematography',
    category: '🎬 Video & Media',
  },
  {
    uri: 'at://did:plc:ewvi7nxr4s3w3czlcdge2kce/app.bsky.feed.generator/animation',
    label: 'Animation',
    description: '2D, 3D, stop-motion, and experimental animation',
    category: '🎬 Video & Media',
  },

  // ── Books & Writing ─────────────────────────────────────────────
  {
    uri: 'at://did:plc:z72i7hd6qxsalby5gc5z6l6c/app.bsky.feed.generator/books',
    label: 'Book Lovers',
    description: 'Book recommendations, reviews, and literary discussions',
    category: '📚 Books & Writing',
  },
  {
    uri: 'at://did:plc:ewvi7nxr4s3w3czlcdge2kce/app.bsky.feed.generator/writing',
    label: 'Writers & Poetry',
    description: 'Creative writing, poetry, essays, and storytelling',
    category: '📚 Books & Writing',
  },
  {
    uri: 'at://did:plc:oio4ral3i2pqhqbf7v2n7loq/app.bsky.feed.generator/scifi-fantasy',
    label: 'Sci-Fi & Fantasy',
    description: 'Science fiction and fantasy books, shows, and discussions',
    category: '📚 Books & Writing',
  },
  {
    uri: 'at://did:plc:vpkhqoltc6mcef7kixq2nqjr/app.bsky.feed.generator/philosophy',
    label: 'Philosophy & Essays',
    description: 'Philosophical discussions and long-form essays',
    category: '📚 Books & Writing',
  },

  // ── Science & Nature ────────────────────────────────────────────
  {
    uri: 'at://did:plc:z72i7hd6qxsalby5gc5z6l6c/app.bsky.feed.generator/science',
    label: 'Science',
    description: 'Scientific discoveries, research, and discussions',
    category: '🌍 Science & Nature',
  },
  {
    uri: 'at://did:plc:ewvi7nxr4s3w3czlcdge2kce/app.bsky.feed.generator/astronomy',
    label: 'Astronomy & Space',
    description: 'Space exploration, astronomy, and cosmology',
    category: '🌍 Science & Nature',
  },
  {
    uri: 'at://did:plc:oio4ral3i2pqhqbf7v2n7loq/app.bsky.feed.generator/biology',
    label: 'Biology & Nature',
    description: 'Biology, ecology, and the natural world',
    category: '🌍 Science & Nature',
  },
  {
    uri: 'at://did:plc:vpkhqoltc6mcef7kixq2nqjr/app.bsky.feed.generator/medicine',
    label: 'Medicine & Health',
    description: 'Medical research, public health, and healthcare',
    category: '🌍 Science & Nature',
  },

  // ── History & Culture ───────────────────────────────────────────
  {
    uri: 'at://did:plc:z72i7hd6qxsalby5gc5z6l6c/app.bsky.feed.generator/history',
    label: 'History',
    description: 'Historical discussions, facts, and threads',
    category: '🏛️ History & Culture',
  },
  {
    uri: 'at://did:plc:ewvi7nxr4s3w3czlcdge2kce/app.bsky.feed.generator/mythology',
    label: 'Mythology & Folklore',
    description: 'Myths, legends, and folklore from around the world',
    category: '🏛️ History & Culture',
  },
  {
    uri: 'at://did:plc:oio4ral3i2pqhqbf7v2n7loq/app.bsky.feed.generator/language',
    label: 'Languages & Linguistics',
    description: 'Language learning, linguistics, and polyglot discussions',
    category: '🏛️ History & Culture',
  },

  // ── Gaming ──────────────────────────────────────────────────────
  {
    uri: 'at://did:plc:z72i7hd6qxsalby5gc5z6l6c/app.bsky.feed.generator/gaming',
    label: 'Gaming',
    description: 'Video game discussions, news, and communities',
    category: '🎮 Gaming',
  },
  {
    uri: 'at://did:plc:ewvi7nxr4s3w3czlcdge2kce/app.bsky.feed.generator/retro-gaming',
    label: 'Retro Gaming',
    description: 'Classic and retro video games',
    category: '🎮 Gaming',
  },
  {
    uri: 'at://did:plc:oio4ral3i2pqhqbf7v2n7loq/app.bsky.feed.generator/tabletop-gaming',
    label: 'Tabletop & Board Games',
    description: 'Board games, TTRPGs, and card games',
    category: '🎮 Gaming',
  },
  {
    uri: 'at://did:plc:vpkhqoltc6mcef7kixq2nqjr/app.bsky.feed.generator/indie-gaming',
    label: 'Indie Games',
    description: 'Indie game development and indie game recommendations',
    category: '🎮 Gaming',
  },

  // ── LGBTQ+ ──────────────────────────────────────────────────────
  {
    uri: 'at://did:plc:z72i7hd6qxsalby5gc5z6l6c/app.bsky.feed.generator/lgbtq',
    label: 'LGBTQ+ Community',
    description: 'LGBTQ+ voices, discussions, and community',
    category: '🏳️‍🌈 LGBTQ+',
  },

  // ── Pets & Animals ──────────────────────────────────────────────
  {
    uri: 'at://did:plc:ewvi7nxr4s3w3czlcdge2kce/app.bsky.feed.generator/cats',
    label: 'Cats of Bluesky',
    description: 'Everything cats — photos, stories, and cat lovers',
    category: '🐱 Pets & Animals',
  },
  {
    uri: 'at://did:plc:oio4ral3i2pqhqbf7v2n7loq/app.bsky.feed.generator/dogs',
    label: 'Dogs of Bluesky',
    description: 'Dog photos, stories, and dog lover community',
    category: '🐱 Pets & Animals',
  },

  // ── Food & Cooking ──────────────────────────────────────────────
  {
    uri: 'at://did:plc:vpkhqoltc6mcef7kixq2nqjr/app.bsky.feed.generator/food',
    label: 'Food & Cooking',
    description: 'Recipes, food photography, and cooking discussions',
    category: '🍔 Food & Cooking',
  },
  {
    uri: 'at://did:plc:z72i7hd6qxsalby5gc5z6l6c/app.bsky.feed.generator/coffee',
    label: 'Coffee Lovers',
    description: 'Coffee, espresso, latte art, and cafés',
    category: '🍔 Food & Cooking',
  },

  // ── Wellness & Mental Health ────────────────────────────────────
  {
    uri: 'at://did:plc:ewvi7nxr4s3w3czlcdge2kce/app.bsky.feed.generator/mental-health',
    label: 'Mental Health',
    description: 'Mental health awareness, support, and discussions',
    category: '🧘 Wellness & Mental Health',
  },
  {
    uri: 'at://did:plc:oio4ral3i2pqhqbf7v2n7loq/app.bsky.feed.generator/meditation',
    label: 'Meditation & Mindfulness',
    description: 'Meditation, mindfulness, and inner peace',
    category: '🧘 Wellness & Mental Health',
  },

  // ── Sports & Fitness ────────────────────────────────────────────
  {
    uri: 'at://did:plc:vpkhqoltc6mcef7kixq2nqjr/app.bsky.feed.generator/sports',
    label: 'Sports',
    description: 'Sports news, discussions, and highlights',
    category: '🏃 Sports & Fitness',
  },
  {
    uri: 'at://did:plc:z72i7hd6qxsalby5gc5z6l6c/app.bsky.feed.generator/running',
    label: 'Running & Fitness',
    description: 'Running, training, fitness goals, and achievements',
    category: '🏃 Sports & Fitness',
  },

  // ── Finance & Economics ─────────────────────────────────────────
  {
    uri: 'at://did:plc:ewvi7nxr4s3w3czlcdge2kce/app.bsky.feed.generator/finance',
    label: 'Finance & Investing',
    description: 'Personal finance, investing, and market discussions',
    category: '💰 Finance & Economics',
  },
  {
    uri: 'at://did:plc:oio4ral3i2pqhqbf7v2n7loq/app.bsky.feed.generator/economics',
    label: 'Economics',
    description: 'Economic theory, policy, and global economics',
    category: '💰 Finance & Economics',
  },
  {
    uri: 'at://did:plc:vpkhqoltc6mcef7kixq2nqjr/app.bsky.feed.generator/crypto',
    label: 'Crypto & Web3',
    description: 'Cryptocurrency, blockchain, and web3 discussions',
    category: '💰 Finance & Economics',
  },

  // ── News & Politics ─────────────────────────────────────────────
  {
    uri: 'at://did:plc:z72i7hd6qxsalby5gc5z6l6c/app.bsky.feed.generator/news',
    label: 'World News',
    description: 'Breaking news and current events from around the world',
    category: '🗞️ News & Politics',
  },
  {
    uri: 'at://did:plc:ewvi7nxr4s3w3czlcdge2kce/app.bsky.feed.generator/politics',
    label: 'Politics & Policy',
    description: 'Political discussions and policy analysis',
    category: '🗞️ News & Politics',
  },

  // ── Comedy & Memes ──────────────────────────────────────────────
  {
    uri: 'at://did:plc:oio4ral3i2pqhqbf7v2n7loq/app.bsky.feed.generator/memes',
    label: 'Memes & Humor',
    description: 'The best memes and funny posts on Bluesky',
    category: '🎭 Comedy & Memes',
  },
  {
    uri: 'at://did:plc:vpkhqoltc6mcef7kixq2nqjr/app.bsky.feed.generator/comedy',
    label: 'Comedy & Jokes',
    description: 'Stand-up, jokes, and comedic writing',
    category: '🎭 Comedy & Memes',
  },

  // ── Education ───────────────────────────────────────────────────
  {
    uri: 'at://did:plc:z72i7hd6qxsalby5gc5z6l6c/app.bsky.feed.generator/math',
    label: 'Mathematics',
    description: 'Math puzzles, proofs, and mathematical discussions',
    category: '🎓 Education',
  },
  {
    uri: 'at://did:plc:ewvi7nxr4s3w3czlcdge2kce/app.bsky.feed.generator/physics',
    label: 'Physics',
    description: 'Physics discussions, research, and curiosities',
    category: '🎓 Education',
  },

  // ── Travel ──────────────────────────────────────────────────────
  {
    uri: 'at://did:plc:oio4ral3i2pqhqbf7v2n7loq/app.bsky.feed.generator/travel',
    label: 'Travel & Adventure',
    description: 'Travel stories, tips, photos, and adventure',
    category: '✈️ Travel',
  },

  // ── Environment ─────────────────────────────────────────────────
  {
    uri: 'at://did:plc:vpkhqoltc6mcef7kixq2nqjr/app.bsky.feed.generator/climate',
    label: 'Climate & Environment',
    description: 'Climate change, sustainability, and environmental news',
    category: '🌿 Environment',
  },

  // ── Niche & Fun ─────────────────────────────────────────────────
  {
    uri: 'at://did:plc:z72i7hd6qxsalby5gc5z6l6c/app.bsky.feed.generator/typewriters',
    label: 'Typewriters & Stationery',
    description: 'Typewriters, fountain pens, notebooks, and stationery',
    category: '🔮 Niche & Fun',
  },
  {
    uri: 'at://did:plc:ewvi7nxr4s3w3czlcdge2kce/app.bsky.feed.generator/architecture',
    label: 'Architecture',
    description: 'Buildings, architecture, and urban design',
    category: '🔮 Niche & Fun',
  },
  {
    uri: 'at://did:plc:oio4ral3i2pqhqbf7v2n7loq/app.bsky.feed.generator/weather',
    label: 'Weather Enthusiasts',
    description: 'Weather, storms, meteorology, and sky watchers',
    category: '🔮 Niche & Fun',
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
