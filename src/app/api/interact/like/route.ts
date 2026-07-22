import { NextRequest, NextResponse } from 'next/server';
import { getAgentForSession } from '@/services/agent';
import { likePost } from '@/services/posts';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
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

    const { uri, cid } = await request.json();
    const result = await likePost(agent, uri, cid);
    return NextResponse.json({ uri: result });
  } catch (error) {
    console.error('Like API error:', error);
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}
