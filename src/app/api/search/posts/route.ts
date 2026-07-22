import { NextRequest, NextResponse } from 'next/server';
import { getAgentForSession } from '@/services/agent';
import { searchPosts } from '@/services/posts';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const agent = await getAgentForSession(session);
    if (!agent) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    if (!q) return NextResponse.json({ items: [], cursor: undefined });
    const cursor = searchParams.get('cursor') || undefined;

    const result = await searchPosts(agent, q, cursor);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Search posts API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
