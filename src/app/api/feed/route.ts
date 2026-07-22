import { NextRequest, NextResponse } from 'next/server';
import { getAgentForSession, getAgentFromRequest } from '@/services/agent';
import { getTimeline } from '@/services/posts';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('voiceflow_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const agent = await getAgentForSession(session);
    if (!agent) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(Number(searchParams.get('limit')) || 30, 100);

    const result = await getTimeline(agent, cursor, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Feed API error:', error);
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
  }
}
