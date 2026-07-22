/**
 * Mock agent for demo mode.
 * Returns realistic seed data so users can explore the app without
 * connecting to a real Bluesky account.
 */

import { DEMO_SESSION, DEMO_PROFILE, MOCK_FEED, MOCK_NOTIFICATIONS, MOCK_SUGGESTIONS, DEMO_USERS, paginateItems } from '@/lib/mock-data';

export class MockBskyAgent {
  session = DEMO_SESSION;

  async resumeSession() { return this; }

  // ─── Timeline / Feed ─────────────────────────────────────

  async getTimeline({ limit = 30, cursor }: { limit?: number; cursor?: string }) {
    const result = paginateItems(MOCK_FEED, cursor, limit);
    return { data: { feed: result.items.map((item) => ({ post: item })), cursor: result.cursor } };
  }

  async getAuthorFeed({ actor, limit = 30, cursor }: { actor: string; limit?: number; cursor?: string }) {
    const authorPosts = MOCK_FEED.filter((p) => p.author.handle === actor || p.author.did === actor);
    const result = paginateItems(authorPosts, cursor, limit);
    return { data: { feed: result.items.map((item) => ({ post: item })), cursor: result.cursor } };
  }

  async getPostThread({ uri }: { uri: string }) {
    const match = MOCK_FEED.find((p) => p.uri === uri);
    if (!match) {
      // Try matching by partial URI
      const partial = MOCK_FEED.find((p) => uri.includes(p.uri.split('/').pop()!));
      if (partial) {
        return {
          data: {
            thread: {
              post: partial,
              replies: MOCK_FEED.slice(0, 3).map((r) => ({ post: r })),
            },
          },
        };
      }
      throw new Error('Post not found');
    }
    return {
      data: {
        thread: {
          post: match,
          replies: MOCK_FEED.slice(0, Math.min(3, MOCK_FEED.length)).map((r) => ({ post: r })),
        },
      },
    };
  }

  // ─── Profile ─────────────────────────────────────────────

  async getProfile({ actor }: { actor: string }) {
    const user = DEMO_USERS.find((u) => u.handle === actor || u.did === actor);
    return { data: user || DEMO_PROFILE };
  }

  async getFollows({ actor, limit = 100 }: { actor: string; limit?: number }) {
    const others = DEMO_USERS.filter((u) => u.did !== actor && u.handle !== actor);
    return { data: { follows: others.slice(0, limit), cursor: undefined } };
  }

  async getFollowers({ actor, limit = 100 }: { actor: string; limit?: number }) {
    const others = DEMO_USERS.filter((u) => u.did !== actor && u.handle !== actor);
    return { data: { followers: others.slice(0, limit), cursor: undefined } };
  }

  // ─── Social Graph ────────────────────────────────────────

  async follow() { return { uri: 'at://did:plc:demo05/app.bsky.graph.follow/mock' }; }
  async deleteFollow() {}
  async mute() {}
  async unmute() {}

  // ─── Feed Interactions ────────────────────────────────────

  async like() { return { uri: 'at://did:plc:demo05/app.bsky.feed.like/mock', cid: 'mock' }; }
  async deleteLike() {}
  async repost() { return { uri: 'at://did:plc:demo05/app.bsky.feed.repost/mock', cid: 'mock' }; }
  async deleteRepost() {}
  async deletePost() {}

  async post(record: any) {
    return { uri: `at://did:plc:demo05/app.bsky.feed.post/mock${Date.now()}`, cid: 'mock' };
  }

  // ─── Notifications ───────────────────────────────────────

  async listNotifications({ limit = 50, cursor }: { limit?: number; cursor?: string }) {
    const result = paginateItems(MOCK_NOTIFICATIONS, cursor, limit);
    return { data: { notifications: result.items, cursor: result.cursor } };
  }

  async getUnreadNotificationCount() {
    return { data: { count: MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length } };
  }

  async updateSeenNotifications() {
    MOCK_NOTIFICATIONS.forEach((n) => { n.isRead = true; });
    return { data: {} };
  }

  // ─── Search ──────────────────────────────────────────────

  async searchActors({ term, limit = 25 }: { term: string; limit?: number }) {
    const q = term.toLowerCase();
    const results = DEMO_USERS.filter(
      (u) => u.handle.toLowerCase().includes(q) || u.displayName?.toLowerCase().includes(q) || u.description?.toLowerCase().includes(q)
    );
    return { data: { actors: results.slice(0, limit) } };
  }

  // ─── Custom Records ──────────────────────────────────────

  app = {
    bsky: {
      feed: {
        getLikes: async () => ({ data: { likes: [], cursor: undefined } }),
        searchPosts: async ({ q, limit = 25, cursor }: { q: string; limit?: number; cursor?: string }) => {
          const qLower = q.toLowerCase();
          const results = MOCK_FEED.filter(
            (p) => {
              const text = 'text' in p.record ? (p.record as any).text || '' : '';
              return text.toLowerCase().includes(qLower)
                || (p.record.$type === 'voiceflow.voice.post' && ((p.record as any).transcript || '').toLowerCase().includes(qLower));
            }
          );
          const result = paginateItems(results, cursor, limit);
          return { data: { posts: result.items, cursor: result.cursor } };
        },
      },
      graph: {
        getBlocks: async () => ({ data: { blocked: [] } }),
        getMutes: async () => ({ data: { muted: [] } }),
        block: { create: async () => ({ uri: 'mock', cid: 'mock' }), delete: async () => {} },
      },
      actor: { searchActors: async () => ({ data: { actors: [] } }) },
      notification: { listNotifications: async () => ({ data: { notifications: [] } }) },
    },
    com: {
      atproto: {
        repo: {
          createRecord: async () => ({ data: { uri: 'mock', cid: 'mock' } }),
          putRecord: async () => ({ data: { uri: 'mock', cid: 'mock' } }),
          getRecord: async () => ({ data: { value: null } }),
          listRecords: async () => ({ data: { records: [] } }),
        },
      },
    },
  };

  uploadBlob = async () => ({ data: { blob: { $type: 'blob', ref: { $link: 'mock' }, mimeType: 'video/mp4', size: 500000 } } });
}

export const mockAgent = new MockBskyAgent();
