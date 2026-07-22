import { NextRequest, NextResponse } from 'next/server';
import { createAgentFromSession } from '@/services/agent';

export async function POST(request: NextRequest) {
  try {
    const { refreshJwt, did, handle } = await request.json();

    if (!refreshJwt) {
      return NextResponse.json({ error: 'Refresh token required' }, { status: 400 });
    }

    // Create a session-like object to resume
    const sessionData = {
      did: did || '',
      handle: handle || '',
      accessJwt: '', // Will be replaced on resume
      refreshJwt,
      active: true,
    };

    const agent = await createAgentFromSession(sessionData);
    if (!agent || !agent.session) {
      return NextResponse.json({ error: 'Session refresh failed' }, { status: 401 });
    }

    return NextResponse.json({
      session: {
        did: agent.session.did,
        handle: agent.session.handle,
        accessJwt: agent.session.accessJwt,
        refreshJwt: agent.session.refreshJwt,
        active: true,
      },
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
