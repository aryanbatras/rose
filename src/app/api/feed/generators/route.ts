import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/services/agent';
import { CURATED_FEEDS, getFeedGeneratorsInfo } from '@/services/feeds';

export async function GET(request: NextRequest) {
  try {
    const agent = await getAgentFromRequest(request);
    if (!agent) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const feedUrisParam = searchParams.get('uris');

    if (feedUrisParam) {
      // Specific feed URIs requested (comma-separated)
      const uris = feedUrisParam.split(',').map((u) => u.trim()).filter(Boolean);
      const feeds = await getFeedGeneratorsInfo(agent, uris);
      return NextResponse.json({ feeds });
    }

    // Return curated feeds with live metadata
    const curatedUris = CURATED_FEEDS.map((f) => f.uri);
    const liveFeeds = await getFeedGeneratorsInfo(agent, curatedUris);

    // Merge live metadata with our curated defaults as fallback
    const merged = CURATED_FEEDS.map((curated) => {
      const live = liveFeeds.find((f) => f.uri === curated.uri);
      return {
        uri: curated.uri,
        label: live?.label || curated.label,
        description: live?.description || curated.description,
        avatar: live?.avatar || curated.avatar,
      };
    });

    return NextResponse.json({ feeds: merged });
  } catch (error) {
    console.error('Feed generators API error:', error);
    return NextResponse.json({ error: 'Failed to fetch feeds' }, { status: 500 });
  }
}
