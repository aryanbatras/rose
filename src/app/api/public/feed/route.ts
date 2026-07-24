import { NextRequest, NextResponse } from 'next/server';
import { publicGetAuthorFeed, publicGetFeed } from '@/services/public-api';
import { filterNsfw } from '@/lib/nsfw';
import type { FeedItem } from '@/types/atproto';

const DISCOVER_FEED = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot';

function normalizeFeedItem(item: any): FeedItem {
  const post = item.post || item;
  const record = post.record || {};
  const embed = post.embed || record.embed;

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actor = searchParams.get('actor');
    const feedUri = searchParams.get('feedUri');
    const cursor = searchParams.get('cursor') || undefined;
    const limit = parseInt(searchParams.get('limit') || '30');

    let rawItems: any[];
    let nextCursor: string | undefined;

    if (actor) {
      const data = await publicGetAuthorFeed(actor, cursor, limit);
      rawItems = data.feed || [];
      nextCursor = data.cursor;
    } else {
      const uri = feedUri || DISCOVER_FEED;
      const data = await publicGetFeed(uri, cursor, limit);
      rawItems = data.feed || [];
      nextCursor = data.cursor;
    }

    const items = filterNsfw(rawItems.map(normalizeFeedItem));
    return NextResponse.json({ items, cursor: nextCursor });
  } catch (error) {
    console.error('Public feed API error:', error);
    return NextResponse.json({ items: [], cursor: undefined });
  }
}
