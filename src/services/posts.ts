'use server';

import { BskyAgent } from '@atproto/api';
import { revalidatePath } from 'next/cache';
import type { FeedItem, PaginatedResponse } from '@/types/atproto';

// ─── NSFW Content Filtering ────────────────────────
// Bluesky moderation labels for adult content (from com.atproto.label.defs)
const NSFW_LABELS = new Set(['porn', 'sexual', 'nudity', 'graphic-media']);

/**
 * Check if a post has any NSFW labels attached to it.
 * Looks at both the post-level labels and the author-level labels.
 */
function isNsfwPost(item: any): boolean {
  const post = item.post || item;
  // Check post-level labels
  const postLabels = post.labels || [];
  if (postLabels.some((l: any) => NSFW_LABELS.has(l.val))) return true;
  // Check author-level labels
  const authorLabels = post.author?.labels || [];
  if (authorLabels.some((l: any) => NSFW_LABELS.has(l.val))) return true;
  return false;
}

/**
 * Filter out NSFW posts from an array of feed items.
 * Returns only safe-for-work items.
 */
function filterNsfwItems<T>(items: T[]): T[] {
  return items.filter((item: any) => !isNsfwPost(item));
}

export async function getTimeline(
  agent: BskyAgent,
  cursor?: string,
  limit = 30
): Promise<PaginatedResponse<FeedItem>> {
  const response = await agent.getTimeline({ limit, cursor });
  const items = response.data.feed.map((item: any) => normalizeFeedItem(item));
  return {
    items: filterNsfwItems(items),
    cursor: response.data.cursor,
  };
}

export async function getAuthorFeed(
  agent: BskyAgent,
  actor: string,
  cursor?: string,
  limit = 30
): Promise<PaginatedResponse<FeedItem>> {
  const response = await agent.getAuthorFeed({ actor, limit, cursor });
  const items = response.data.feed.map((item: any) => normalizeFeedItem(item));
  return {
    items: filterNsfwItems(items),
    cursor: response.data.cursor,
  };
}

export async function getPostThread(
  agent: BskyAgent,
  uri: string,
  depth = 6
): Promise<any> {
  const response = await agent.getPostThread({ uri, depth });
  const thread = response.data.thread;
  return normalizeThreadNode(thread);
}

/**
 * Recursively normalize a thread node so every reply follows the
 * same shape as a FeedItem with a nested `replies` array.
 */
function normalizeThreadNode(node: any): any {
  if (!node) return null;

  // The AT Protocol returns the thread as:
  // { post: FeedItem, replies?: [threadNode, ...], parent?: threadNode }
  // We flatten this so every node has a `post` and `replies` array.

  const post = node.post || node;
  const normalized: any = {
    post: normalizeFeedItem(post),
    replies: [],
    depth: node.depth || 0,
  };

  if (node.replies && Array.isArray(node.replies)) {
    normalized.replies = node.replies
      .map((reply: any) => normalizeThreadNode(reply))
      .filter(Boolean);
    // Filter NSFW replies from thread view
    if (normalized.replies.length > 0) {
      normalized.replies = filterNsfwItems(normalized.replies);
    }
  }

  return normalized;
}

export async function createPost(
  agent: BskyAgent,
  text: string,
  options?: {
    replyTo?: { uri: string; cid: string };
    embed?: any;
    facets?: any[];
  }
): Promise<any> {
  const post: any = {
    text,
    createdAt: new Date().toISOString(),
  };

  if (options?.replyTo) {
    post.reply = {
      root: options.replyTo,
      parent: options.replyTo,
    };
  }

  if (options?.embed) {
    post.embed = options.embed;
  }

  if (options?.facets) {
    post.facets = options.facets;
  }

  const response = await agent.post(post);
  revalidatePath('/feed');
  return response;
}

export async function deletePost(agent: BskyAgent, uri: string): Promise<void> {
  await agent.deletePost(uri);
  revalidatePath('/feed');
}

export async function likePost(
  agent: BskyAgent,
  uri: string,
  cid: string
): Promise<string> {
  const response = await agent.like(uri, cid);
  return response.uri;
}

export async function unlikePost(
  agent: BskyAgent,
  likeUri: string
): Promise<void> {
  await agent.deleteLike(likeUri);
}

export async function repostPost(
  agent: BskyAgent,
  uri: string,
  cid: string
): Promise<string> {
  const response = await agent.repost(uri, cid);
  return response.uri;
}

export async function unrepostPost(
  agent: BskyAgent,
  repostUri: string
): Promise<void> {
  await agent.deleteRepost(repostUri);
}

export async function getLikes(
  agent: BskyAgent,
  uri: string,
  cursor?: string,
  limit = 50
): Promise<PaginatedResponse<any>> {
  const response = await agent.app.bsky.feed.getLikes({ uri, limit, cursor });
  return {
    items: response.data.likes,
    cursor: response.data.cursor,
  };
}

/**
 * Fetch posts from a custom feed generator.
 */
export async function getCustomFeed(
  agent: BskyAgent,
  feedUri: string,
  cursor?: string,
  limit = 30
): Promise<PaginatedResponse<FeedItem>> {
  const response = await agent.app.bsky.feed.getFeed({ feed: feedUri, limit, cursor });
  const items = response.data.feed.map((item: any) => normalizeFeedItem(item));
  return {
    items: filterNsfwItems(items),
    cursor: response.data.cursor,
  };
}

export async function searchPosts(
  agent: BskyAgent,
  query: string,
  cursor?: string,
  limit = 25
): Promise<PaginatedResponse<FeedItem>> {
  const response = await agent.app.bsky.feed.searchPosts({
    q: query,
    limit,
    cursor,
  });
  const items = (response.data.posts || []).map((item: any) => normalizeFeedItem(item));
  return {
    items: filterNsfwItems(items),
    cursor: response.data.cursor,
  };
}

// ─── Bookmarks ──────────────────────────────────────────────

/**
 * Create a bookmark for a post.
 * Calls app.bsky.bookmark.createBookmark.
 */
/**
 * Create a bookmark for a post.
 * Calls app.bsky.bookmark.createBookmark.
 * NOTE: The API returns {} on success — no bookmark URI is returned.
 * To get the bookmark URI for deletion, use getBookmarks() after creating.
 */
export async function createBookmark(
  agent: BskyAgent,
  uri: string,
  cid: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    // The API expects { uri, cid } directly at the root level
    await agent.api.xrpc.call(
      'app.bsky.bookmark.createBookmark',
      {},
      { uri, cid },
      { encoding: 'application/json' }
    );
    return { success: true };
  } catch (error: any) {
    return { error: error?.message || 'Failed to bookmark' };
  }
}

/**
 * Delete a bookmark by its URI.
 * Calls app.bsky.bookmark.deleteBookmark.
 */
export async function deleteBookmark(
  agent: BskyAgent,
  bookmarkUri: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    await agent.api.xrpc.call(
      'app.bsky.bookmark.deleteBookmark',
      {},
      { uri: bookmarkUri },
      { encoding: 'application/json' }
    );
    return { success: true };
  } catch (error: any) {
    return { error: error?.message || 'Failed to remove bookmark' };
  }
}

/**
 * Fetch bookmarks for the current user.
 * Calls app.bsky.bookmark.getBookmarks.
 */
export async function getBookmarks(
  agent: BskyAgent,
  cursor?: string,
  limit = 30
): Promise<{ bookmarks: any[]; cursor?: string; error?: string }> {
  try {
    const response = await agent.api.xrpc.call(
      'app.bsky.bookmark.getBookmarks',
      { limit, cursor },
      {},
      { encoding: 'application/json' }
    );
    const data = (response as any).data || {};
    return {
      bookmarks: data.bookmarks || [],
      cursor: data.cursor,
    };
  } catch (error: any) {
    return { error: error?.message || 'Failed to fetch bookmarks', bookmarks: [] };
  }
}

export async function uploadBlob(
  agent: BskyAgent,
  data: Blob | ArrayBuffer | Uint8Array,
  encoding: string
): Promise<any> {
  const bytes = data instanceof Blob
    ? new Uint8Array(await data.arrayBuffer())
    : data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : data;
  const response = await agent.uploadBlob(bytes, { encoding });
  return response.data.blob;
}

function normalizeFeedItem(item: any): FeedItem {
  const post = item.post || item;
  const record = post.record || {};

  // Bluesky API returns TWO embed locations:
  //   post.embed       = the hydrated VIEW form (actual image/video URLs, thumbnails)
  //   record.embed     = the raw INPUT form (BlobRef references)
  // We always prefer post.embed for display data.
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
  };
}
