import { NextRequest, NextResponse } from 'next/server';
import { getAgentForSession, getAgentFromRequest } from '@/services/agent';
import { repostPost, unrepostPost } from '@/services/posts';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('rose_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const agent = await getAgentForSession(session);
    if (!agent) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const { uri, cid } = await request.json();
    const result = await repostPost(agent, uri, cid);
    return NextResponse.json({ uri: result });
  } catch (error) {
    console.error('Repost API error:', error);
    return NextResponse.json({ error: 'Failed to repost' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('rose_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const agent = await getAgentForSession(session);
    if (!agent) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const { repostUri } = await request.json();
    await unrepostPost(agent, repostUri);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unrepost API error:', error);
    return NextResponse.json({ error: 'Failed to unrepost' }, { status: 500 });
  }
}
