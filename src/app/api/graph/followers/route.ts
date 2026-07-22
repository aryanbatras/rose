import { NextRequest, NextResponse } from 'next/server';
import { getAgentForSession } from '@/services/agent';
import { getFollowers, getFollows } from '@/services/graph';
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
    const cursor = searchParams.get('cursor');

    const result = await getFollowers(agent, actor, cursor || undefined);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Followers API error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
