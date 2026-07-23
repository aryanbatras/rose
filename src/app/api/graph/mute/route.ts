import { NextRequest, NextResponse } from 'next/server';
import { getAgentForSession } from '@/services/agent';
import { muteUser, unmuteUser } from '@/services/graph';
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
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const { did } = await request.json();
    await muteUser(agent, did);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mute API error:', error);
    return NextResponse.json({ error: 'Failed to mute user' }, { status: 500 });
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
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const { did } = await request.json();
    await unmuteUser(agent, did);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unmute API error:', error);
    return NextResponse.json({ error: 'Failed to unmute user' }, { status: 500 });
  }
}
