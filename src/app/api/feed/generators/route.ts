import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/services/agent';
import {
  CURATED_FEEDS,
  getFeedGeneratorsInfo,
  getSuggestedFeeds,
  getPopularFeedGenerators,
} from '@/services/feeds';

export async function GET(request: NextRequest) {
  try {
    const agent = await getAgentFromRequest(request);
    if (!agent) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'curated';
    const feedUrisParam = searchParams.get('uris');
    const query = searchParams.get('query');
    const cursor = searchParams.get('cursor');
    const limit = Math.min(Number(searchParams.get('limit')) || 30, 100);

    // ─── Mode: Lookup specific feed URIs ──────────────────────────
    if (feedUrisParam) {
      const uris = feedUrisParam.split(',').map((u) => u.trim()).filter(Boolean);
      const feeds = await getFeedGeneratorsInfo(agent, uris);
      return NextResponse.json({ feeds });
    }

    // ─── Mode: Suggested feeds ────────────────────────────────────
    if (mode === 'suggested') {
      const result = await getSuggestedFeeds(agent, limit, cursor || undefined);
      return NextResponse.json({
        feeds: result.feeds,
        cursor: result.cursor,
      });
    }

    // ─── Mode: Popular / search feeds ─────────────────────────────
    if (mode === 'popular') {
      const result = await getPopularFeedGenerators(agent, {
        limit,
        cursor: cursor || undefined,
        query: query || undefined,
      });
      return NextResponse.json({
        feeds: result.feeds,
        cursor: result.cursor,
      });
    }

    // ─── Default mode: Curated feeds with live metadata ───────────
    const curatedUris = CURATED_FEEDS.map((f) => f.uri);
    const liveFeeds = await getFeedGeneratorsInfo(agent, curatedUris);

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
