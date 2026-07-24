import { NextRequest, NextResponse } from 'next/server';
import { publicGetPostThread } from '@/services/public-api';
import { isNsfwPost } from '@/lib/nsfw';

function filterThreadNsFW(node: any): any {
  if (!node) return null;
  if (node.post && isNsfwPost(node.post)) return null;
  return {
    ...node,
    replies: (node.replies || [])
      .map(filterThreadNsFW)
      .filter(Boolean),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uri = searchParams.get('uri');
    if (!uri) {
      return NextResponse.json({ error: 'URI required' }, { status: 400 });
    }
    const data = await publicGetPostThread(uri);
    // Filter NSFW from thread
    if (data.thread) {
      data.thread = filterThreadNsFW(data.thread);
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Public thread API error:', error);
    return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 });
  }
}
