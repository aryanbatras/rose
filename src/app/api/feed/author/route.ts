import { NextRequest, NextResponse } from 'next/server';
import { getAgentForSession } from '@/services/agent';
import { getAuthorFeed } from '@/services/posts';
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
    const actor = searchParams.get('actor');
    if (!actor) return NextResponse.json({ error: 'Missing actor' }, { status: 400 });
    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(Number(searchParams.get('limit')) || 30, 100);

    const result = await getAuthorFeed(agent, actor, cursor, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Author feed API error:', error);
    return NextResponse.json({ error: 'Failed to fetch author feed' }, { status: 500 });
  }
}
