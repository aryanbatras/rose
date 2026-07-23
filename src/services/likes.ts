'use server';

import { BskyAgent } from '@atproto/api';
import type { FeedItem, PaginatedResponse } from '@/types/atproto';

export async function getActorLikes(
  agent: BskyAgent,
  actor: string,
  cursor?: string,
  limit = 30
): Promise<PaginatedResponse<FeedItem>> {
  const response = await agent.app.bsky.feed.getActorLikes({ actor, limit, cursor });
  const data = response.data as any;
  const items = (data.likes || data.feed || []).map((like: any) => {
    const post = like.post || like;
    return {
      uri: post.uri,
      cid: post.cid,
      author: {
        did: post.author?.did || '',
        handle: post.author?.handle || '',
        displayName: post.author?.displayName,
        avatar: post.author?.avatar,
      },
      record: {
        $type: post.record?.$type || 'app.bsky.feed.post',
        text: post.record?.text || '',
        createdAt: post.record?.createdAt || post.indexedAt,
        facets: post.record?.facets,
        embed: post.embed || post.record?.embed,
      },
      indexedAt: post.indexedAt || like.indexedAt,
      likeCount: post.likeCount || 0,
      replyCount: post.replyCount || 0,
      repostCount: post.repostCount || 0,
      viewer: post.viewer,
      labels: post.labels,
    } as FeedItem;
  });
  return {
    items,
    cursor: data.cursor,
  };
}
