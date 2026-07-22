import { NextResponse } from 'next/server';
import { getAgentForSession } from '@/services/agent';

export async function GET() {
  try {
    const agent = await getAgentForSession();

    if (!agent || !agent.session) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    return NextResponse.json({
      did: agent.session.did,
      handle: agent.session.handle,
    });
  } catch (err) {
    console.error('Session check error:', err);
    return NextResponse.json({ error: 'Session invalid' }, { status: 401 });
  }
}
