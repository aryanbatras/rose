import { NextRequest, NextResponse } from 'next/server';
import { getAgentForSession } from '@/services/agent';
import { blockUser, unblockUser } from '@/services/graph';
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
    const uri = await blockUser(agent, did);
    return NextResponse.json({ uri });
  } catch (error) {
    console.error('Block API error:', error);
    return NextResponse.json({ error: 'Failed to block user' }, { status: 500 });
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

    const { blockUri } = await request.json();
    await unblockUser(agent, blockUri);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unblock API error:', error);
    return NextResponse.json({ error: 'Failed to unblock user' }, { status: 500 });
  }
}
