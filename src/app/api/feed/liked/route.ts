import { NextRequest, NextResponse } from 'next/server';
import { getAgentForSession } from '@/services/agent';
import { getActorLikes } from '@/services/likes';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
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
    const actor = searchParams.get('actor');
    const cursor = searchParams.get('cursor') || undefined;
    const limit = parseInt(searchParams.get('limit') || '30');

    if (!actor) {
      return NextResponse.json({ error: 'Actor parameter required' }, { status: 400 });
    }

    const result = await getActorLikes(agent, actor, cursor, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Liked posts API error:', error);
    return NextResponse.json({ error: 'Failed to fetch liked posts' }, { status: 500 });
  }
}
