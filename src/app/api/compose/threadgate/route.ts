import { NextRequest, NextResponse } from 'next/server';
import { getAgentForSession } from '@/services/agent';
import { createThreadGate, type ThreadgateSetting } from '@/services/threadgate';
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

    const { postUri, setting, mentionedDids } = await request.json();

    if (!postUri || !setting) {
      return NextResponse.json({ error: 'Missing postUri or setting' }, { status: 400 });
    }

    const gateUri = await createThreadGate(agent, postUri, setting as ThreadgateSetting, mentionedDids);
    return NextResponse.json({ gateUri });
  } catch (error) {
    console.error('Threadgate API error:', error);
    return NextResponse.json({ error: 'Failed to create thread gate' }, { status: 500 });
  }
}
