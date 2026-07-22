import { NextResponse } from 'next/server';
import { getAgentForSession } from '@/services/agent';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Check for demo mode first
    const cookieStore = await cookies();
    const demoMode = cookieStore.get('demo_mode');
    if (demoMode?.value === 'true') {
      return NextResponse.json({
        did: 'did:plc:demo05',
        handle: 'demo.user.voiceflow',
        demo: true,
      });
    }

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
    // Fallback: check for demo cookie
    try {
      const cookieStore = await cookies();
      const demoMode = cookieStore.get('demo_mode');
      if (demoMode?.value === 'true') {
        return NextResponse.json({
          did: 'did:plc:demo05',
          handle: 'demo.user.voiceflow',
          demo: true,
        });
      }
    } catch {}
    return NextResponse.json({ error: 'Session invalid' }, { status: 401 });
  }
}
