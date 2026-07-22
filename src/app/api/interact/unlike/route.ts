import { NextRequest, NextResponse } from 'next/server';
import { getAgentForSession } from '@/services/agent';
import { unlikePost } from '@/services/posts';
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

    const { likeUri } = await request.json();
    await unlikePost(agent, likeUri);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unlike API error:', error);
    return NextResponse.json({ error: 'Failed to unlike post' }, { status: 500 });
  }
}
