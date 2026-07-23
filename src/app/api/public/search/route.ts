import { NextRequest, NextResponse } from 'next/server';
import { publicSearchPosts } from '@/services/public-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const cursor = searchParams.get('cursor') || undefined;
    const limit = parseInt(searchParams.get('limit') || '25');

    if (!q) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const data = await publicSearchPosts(q, cursor, limit);
    return NextResponse.json({ items: data.posts || [], cursor: data.cursor });
  } catch (error) {
    console.error('Public search API error:', error);
    return NextResponse.json({ items: [], cursor: undefined });
  }
}
