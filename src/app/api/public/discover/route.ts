import { NextRequest, NextResponse } from 'next/server';
import { publicGetFeedGenerators, publicGetPopularFeedGenerators } from '@/services/public-api';
import { CURATED_FEEDS } from '@/services/feeds';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'curated';
    const cursor = searchParams.get('cursor') || undefined;
    const limit = parseInt(searchParams.get('limit') || '25');

    if (mode === 'popular') {
      const data = await publicGetPopularFeedGenerators(cursor, limit);
      return NextResponse.json({
        feeds: data.feeds || [],
        cursor: data.cursor,
      });
    }

    // Default: curated feeds with live metadata
    const curatedUris = CURATED_FEEDS.map((f) => f.uri);
    const liveData = await publicGetFeedGenerators(curatedUris);
    const liveFeeds = liveData.feeds || [];

    const merged = CURATED_FEEDS.map((curated) => {
      const live = liveFeeds.find((f: any) => f.uri === curated.uri);
      return {
        uri: curated.uri,
        label: live?.displayName || curated.label,
        description: live?.description || curated.description,
        avatar: live?.avatar || curated.avatar,
        category: curated.category,
        likeCount: (live as any)?.likeCount ?? 0,
      };
    });

    return NextResponse.json({ feeds: merged, total: CURATED_FEEDS.length });
  } catch (error) {
    console.error('Public discover API error:', error);
    return NextResponse.json({ feeds: [], cursor: undefined });
  }
}
