import { NextRequest, NextResponse } from 'next/server';
import { getAgentForSession } from '@/services/agent';
import { getTimeline, getCustomFeed } from '@/services/posts';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('rose_session');
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

  try {
    switch (sourceType) {
      case 'custom':
        if (!feedUri) {
          return NextResponse.json({ error: 'feedUri is required for custom feed' }, { status: 400 });
        }
        result = await getCustomFeed(agent, feedUri, cursor, limit);
        break;
      case 'discover':
        result = await getCustomFeed(
          agent,
          'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot',
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
  } catch (error: any) {
    console.error('Feed API error for source', sourceType, feedUri, ':', error?.message || error);
    // Return empty feed instead of 500 so the UI doesn't break
    return NextResponse.json({ items: [], cursor: undefined });
  }
}
