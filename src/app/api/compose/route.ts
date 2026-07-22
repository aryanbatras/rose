import { NextRequest, NextResponse } from 'next/server';
import { getAgentForSession } from '@/services/agent';
import { createPost } from '@/services/posts';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session') || cookieStore.get('voiceflow_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const agent = await getAgentForSession(session);
    if (!agent) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const { text } = await request.json();
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }
    if (text.trim().length > 300) {
      return NextResponse.json({ error: 'Post must be 300 characters or less' }, { status: 400 });
    }

    await createPost(agent, text.trim());
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Compose API error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
