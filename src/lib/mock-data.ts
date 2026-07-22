/**
 * Mock seed data for VoiceFlow demo mode.
 * Provides realistic social media content for testing all features
 * including infinite scroll, notifications, profiles, and voice posts.
 */

import type { FeedItem, ActorView, NotificationItem } from '@/types/atproto';

// ─── Demo Users ───────────────────────────────────────────────

export const DEMO_USERS: ActorView[] = [
  {
    did: 'did:plc:demo01',
    handle: 'alice.voiceflow.demo',
    displayName: 'Alice Chen',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alice&backgroundColor=c0aede',
    banner: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=300&fit=crop',
    description: 'Music producer & sound designer. Making the world hear in color. 🎵',
    followersCount: 1423,
    followsCount: 456,
    postsCount: 89,
    viewer: { following: 'at://did:plc:demo02/app.bsky.graph.follow/demo', followedBy: undefined },
    createdAt: '2024-03-15T10:30:00Z',
  },
  {
    did: 'did:plc:demo02',
    handle: 'marcus.voiceflow.demo',
    displayName: 'Marcus Rivera',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Marcus&backgroundColor=b6e3f4',
    banner: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=300&fit=crop',
    description: 'Full-stack dev | Jazz pianist | Building the future of social audio',
    followersCount: 2341,
    followsCount: 723,
    postsCount: 156,
    viewer: { following: undefined, followedBy: 'at://did:plc:demo01/app.bsky.graph.follow/demo' },
    createdAt: '2024-01-20T08:00:00Z',
  },
  {
    did: 'did:plc:demo03',
    handle: 'sarah.voiceflow.demo',
    displayName: 'Sarah Kim',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah&backgroundColor=d1d4f9',
    description: 'Podcaster 🎙️ | Voice actor | Storyteller. Every voice tells a story.',
    followersCount: 3890,
    followsCount: 1024,
    postsCount: 234,
    viewer: { following: undefined, followedBy: undefined },
    createdAt: '2024-06-01T14:00:00Z',
  },
  {
    did: 'did:plc:demo04',
    handle: 'techpulse.voiceflow.demo',
    displayName: 'TechPulse Podcast',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Tech&backgroundColor=ffd5dc',
    description: 'Weekly tech deep-dives. New episodes every Monday.',
    followersCount: 5678,
    followsCount: 89,
    postsCount: 312,
    viewer: { following: undefined, followedBy: undefined },
    createdAt: '2023-11-10T09:00:00Z',
  },
  {
    did: 'did:plc:demo05',
    handle: 'demo.user.voiceflow',
    displayName: 'Demo User',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Demo&backgroundColor=ffd5dc',
    description: '👋 Welcome to VoiceFlow! This is a demo account.',
    followersCount: 42,
    followsCount: 5,
    postsCount: 7,
    createdAt: '2025-01-01T00:00:00Z',
  },
];

// ─── Voice Moods & Tags ──────────────────────────────────────

const MOODS = ['Chill', 'Energetic', 'Thoughtful', 'Happy', 'Melancholy', 'Excited', 'Grateful', 'Curious'];
const TAGS = ['music', 'tech', 'podcast', 'storytelling', 'dev', 'design', 'productivity', 'wellness', 'creative', 'education'];

// ─── Transcripts for Voice Posts ─────────────────────────────

const VOICE_TRANSCRIPTS = [
  'Just finished mixing my new track. The bass line came together in the last hour — those happy accidents are what make music magic.',
  'Recording a quick thought on distributed systems. After years of working with microservices, I think the real magic is in how services communicate, not in the services themselves.',
  'Had the most amazing conversation today about the future of voice in social media. We\'re just scratching the surface of what\'s possible.',
  'Morning reflection: creativity isn\'t about waiting for inspiration. It\'s about showing up every day and doing the work.',
  'Trying out a new vocal technique for the upcoming episode. The trick is breath support — sounds simple but takes years to master.',
  'Quick update on the open-source project: we hit 1000 stars! The community contributions have been incredible.',
  'Reading a fascinating paper on audio compression algorithms. The human ear is remarkably good at picking up artifacts we thought were imperceptible.',
  'Weekend vibes: spent the afternoon at a jazz club. There\'s something about live music that recordings can never capture.',
];

// ─── Generate Voice Posts ────────────────────────────────────

function generateVoicePosts(): any[] {
  return Array.from({ length: 15 }, (_, i) => {
    const author = DEMO_USERS[i % (DEMO_USERS.length - 1)]; // exclude demo user
    const moodIdx = (i * 3 + 7) % MOODS.length;
    const tagCount = (i % 3) + 1;
    const duration = 30000 + (i * 15000) + Math.floor(Math.random() * 30000);
    const now = Date.now() - (i * 3600000 * (2 + Math.floor(Math.random() * 4)));

    return {
      uri: `at://${author.did}/voiceflow.voice.post/${String(i + 1).padStart(3, '0')}`,
      cid: `bafyrei${Array.from({ length: 50 }, () => 'abcdefghijklmnopqrstuvwxyz234567'[Math.floor(Math.random() * 32)]).join('')}`,
      author,
      record: {
        $type: 'voiceflow.voice.post',
        videoBlob: { $type: 'blob', ref: { $link: 'mock' }, mimeType: 'video/mp4', size: 500000 },
        duration,
        transcript: VOICE_TRANSCRIPTS[i % VOICE_TRANSCRIPTS.length],
        text: VOICE_TRANSCRIPTS[i % VOICE_TRANSCRIPTS.length].slice(0, 80) + '...',
        tags: Array.from({ length: tagCount }, (_, j) => TAGS[(i + j * 5) % TAGS.length]),
        mood: MOODS[moodIdx],
        createdAt: new Date(now).toISOString(),
      },
      indexedAt: new Date(now).toISOString(),
      likeCount: Math.floor(Math.random() * 150),
      replyCount: Math.floor(Math.random() * 25),
      repostCount: Math.floor(Math.random() * 30),
      viewer: { like: Math.random() > 0.7 ? `at://${author.did}/app.bsky.feed.like/mock` : undefined },
    };
  });
}

// ─── Generate Text Posts ─────────────────────────────────────

const TEXT_POSTS = [
  { text: 'Just shipped a new feature! The feeling of seeing your code go live never gets old. 🚀', embed: null },
  { text: 'Hot take: the best UI is invisible. Great design isn\'t noticed — it\'s felt.', embed: null },
  { text: 'Working on a new album. Here\'s a sneak peek of the cover art concept.', embed: { $type: 'app.bsky.embed.external#view', external: { title: 'Album Art Preview', description: 'Early concept art for the upcoming album release', uri: 'https://example.com/art', thumb: 'https://images.unsplash.com/photo-1614613535308-eb5fbd52d716?w=400&h=300&fit=crop' } } },
  { text: 'Today\'s deep dive: understanding the Web Audio API. The power of real-time audio processing in the browser is incredible.', embed: null },
  { text: 'Shoutout to everyone who joined the listening party last night! The energy was unreal. Same time next week?', embed: null },
  { text: 'New blog post: "Why I\'m building on the AT Protocol." The decentralized web isn\'t just a trend — it\'s the future.', embed: { $type: 'app.bsky.embed.external#view', external: { title: 'Building on AT Protocol', description: 'Why decentralized social is the future', uri: 'https://example.com/blog', thumb: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=300&fit=crop' } } },
  { text: 'Found this amazing sample pack. The drum textures are phenomenal. Link in bio!', embed: null },
  { text: 'Reminder: your voice matters. Literally. Go record something today.', embed: null },
  { text: 'Behind the scenes of this week\'s podcast episode. Three hours of raw material for 20 minutes of final content. The editing grind is real.', embed: null },
  { text: 'Question for the timeline: what\'s your go-to karaoke song? Mine\'s "Bohemian Rhapsody" — always.', embed: null },
  { text: 'Visualizing audio data in real-time with Canvas API. The waveform patterns are mesmerizing.', embed: { $type: 'app.bsky.embed.images#view', images: [{ alt: 'Audio waveform visualization', thumb: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&h=300&fit=crop' }] } },
  { text: 'Weekend project: building a collaborative music room. People join, jam together, create magic.', embed: null },
  { text: 'Incredible live session today. The acoustics in that venue were perfect. Recorded the whole thing.', embed: null },
  { text: '5 AM thoughts: is voice the most intimate form of social media? A text post feels like a broadcast. A voice note feels like a conversation.', embed: null },
  { text: 'Throwback to my first podcast episode. The audio quality was terrible but the passion was real. We all start somewhere.', embed: null },
  { text: 'Debugging at 2 AM. The culprit: a missing semicolon. Always the semicolon.', embed: null },
  { text: 'New collaboration dropped! Check out the link. @marcus made the beat, I handled the vocals.', embed: null },
  { text: 'The AT Protocol firehose is fascinating. So much data flowing through the network every second. Building something cool with it.', embed: null },
  { text: 'Grateful for this community. The support on my last voice post was overwhelming. Thank you all.', embed: null },
  { text: 'Pro tip: record your voice memos in a quiet room with a closet full of clothes. The natural reverb absorption makes a huge difference.', embed: null },
];

let textPostCounter = 0;

function generateTextPosts(): FeedItem[] {
  return TEXT_POSTS.map((post, i) => {
    const author = DEMO_USERS[(i + 1) % (DEMO_USERS.length - 1)];
    const now = Date.now() - (i * 3600000) - (i * 60000 * Math.floor(Math.random() * 45));
    const idx = textPostCounter++;

    return {
      uri: `at://${author.did}/app.bsky.feed.post/${String(idx).padStart(3, '0')}`,
      cid: `bafyrei${Array.from({ length: 50 }, () => 'abcdefghijklmnopqrstuvwxyz234567'[Math.floor(Math.random() * 32)]).join('')}`,
      author,
      record: {
        $type: 'app.bsky.feed.post',
        text: post.text,
        createdAt: new Date(now).toISOString(),
        embed: post.embed || undefined,
      },
      indexedAt: new Date(now).toISOString(),
      likeCount: Math.floor(Math.random() * 200),
      replyCount: Math.floor(Math.random() * 40),
      repostCount: Math.floor(Math.random() * 50),
      viewer: {
        like: Math.random() > 0.8 ? `at://${author.did}/app.bsky.feed.like/mock` : undefined,
        repost: Math.random() > 0.9 ? `at://${author.did}/app.bsky.feed.repost/mock` : undefined,
      },
    };
  });
}

// ─── Feed Generation (mixed voice + text) ────────────────────

const voicePosts = generateVoicePosts();
const textFeedItems = generateTextPosts();

function generateFeed(): FeedItem[] {
  const all: FeedItem[] = [];
  let vi = 0;
  let ti = 0;
  // Interleave voice and text posts
  while (vi < voicePosts.length || ti < textFeedItems.length) {
    if (vi < voicePosts.length && (ti >= textFeedItems.length || Math.random() > 0.4)) {
      all.push(voicePosts[vi++]);
    }
    if (ti < textFeedItems.length) {
      all.push(textFeedItems[ti++]);
    }
  }
  // Sort by indexedAt descending
  all.sort((a, b) => new Date(b.indexedAt).getTime() - new Date(a.indexedAt).getTime());
  return all;
}

export const MOCK_FEED = generateFeed();

// ─── Notifications ───────────────────────────────────────────

const NOTIF_REASONS: Array<'like' | 'repost' | 'follow' | 'mention' | 'reply'> = ['like', 'repost', 'follow', 'mention', 'reply'];
const NOTIF_TEXTS = ['Great post!', 'Love this 🎵', 'So true!', 'Agreed 100%', 'This is incredible', 'Keep it up!', '🔥🔥🔥', 'Beautifully said'];

export const MOCK_NOTIFICATIONS: NotificationItem[] = Array.from({ length: 20 }, (_, i) => {
  const author = DEMO_USERS[(i + 2) % (DEMO_USERS.length - 1)];
  const reason = NOTIF_REASONS[i % NOTIF_REASONS.length];
  const now = Date.now() - (i * 7200000) - Math.floor(Math.random() * 3600000);

  return {
    uri: `at://${author.did}/app.bsky.notification/${i}`,
    cid: `bafyrei${i}${Array.from({ length: 45 }, () => 'abc123').join('')}`,
    author,
    reason: reason as any,
    reasonSubject: reason === 'reply' ? `at://did:plc:demo05/app.bsky.feed.post/mock${i % 5}` : undefined,
    record: {
      $type: 'app.bsky.feed.post',
      text: reason === 'follow' ? '' : NOTIF_TEXTS[i % NOTIF_TEXTS.length],
      createdAt: new Date(now).toISOString(),
    },
    isRead: i >= 5,
    indexedAt: new Date(now).toISOString(),
  };
});

// ─── Suggestions ──────────────────────────────────────────────

export const MOCK_SUGGESTIONS = DEMO_USERS.slice(0, 4).map((u) => ({
  did: u.did,
  handle: u.handle,
  displayName: u.displayName,
  avatar: u.avatar,
  count: Math.floor(Math.random() * 12) + 1,
}));

// ─── Pagination Helper ────────────────────────────────────────

export function paginateItems<T>(
  items: T[],
  cursor?: string,
  limit = 30
): { items: T[]; cursor?: string } {
  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const endIndex = startIndex + limit;
  const page = items.slice(startIndex, endIndex);
  const nextCursor = endIndex < items.length ? String(endIndex) : undefined;
  return { items: page, cursor: nextCursor };
}

// ─── Demo Session ─────────────────────────────────────────────

export const DEMO_SESSION = {
  did: 'did:plc:demo05',
  handle: 'demo.user.voiceflow',
  accessJwt: 'demo-access-token',
  refreshJwt: 'demo-refresh-token',
  active: true,
};

export const DEMO_PROFILE = DEMO_USERS[4];
