import { NextRequest, NextResponse } from 'next/server';
import { getAgentForSession } from '@/services/agent';
import { getTimeline, getCustomFeed } from '@/services/posts';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('voiceflow_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const agent = await getAgentForSession(session);
    if (!agent) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(Number(searchParams.get('limit')) || 30, 100);
    const sourceType = searchParams.get('sourceType') || 'following';
    const feedUri = searchParams.get('feedUri') || undefined;

    let result;

    switch (sourceType) {
      case 'custom':
        if (!feedUri) {
          return NextResponse.json({ error: 'feedUri is required for custom feed' }, { status: 400 });
        }
        result = await getCustomFeed(agent, feedUri, cursor, limit);
        break;
      case 'discover':
        // Discover uses the "What's Hot" feed generator URI (Bluesky's equivalent of trending)
        result = await getCustomFeed(
          agent,
          'at://did:plc:tenurhgjptv3lcaqergxe2cj/app.bsky.feed.generator/whats-hot',
          cursor,
          limit
        );
        break;
      case 'following':
      default:
        result = await getTimeline(agent, cursor, limit);
        break;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Feed API error:', error);
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
  }
}
