import { NextResponse } from 'next/server';
import { getAgentForSession, getAgentFromRequest } from '@/services/agent';
import { markNotificationsRead } from '@/services/notifications';
import { cookies } from 'next/headers';

export async function POST() {
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

    await markNotificationsRead(agent);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark read API error:', error);
    return NextResponse.json({ error: 'Failed to mark read' }, { status: 500 });
  }
}
