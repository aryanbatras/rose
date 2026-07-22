import { NextRequest, NextResponse } from 'next/server';
import { getAgentForSession, getAgentFromRequest } from '@/services/agent';
import { followUser, unfollowUser } from '@/services/graph';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('voiceflow_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const agent = await getAgentForSession(session);
    if (!agent) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }

    const { subjectDid, action, followUri } = await request.json();

    if (action === 'unfollow' && followUri) {
      await unfollowUser(agent, followUri);
      return NextResponse.json({ success: true });
    }

    const uri = await followUser(agent, subjectDid);
    return NextResponse.json({ uri });
  } catch (error) {
    console.error('Follow API error:', error);
    return NextResponse.json({ error: 'Failed to process follow' }, { status: 500 });
  }
}
