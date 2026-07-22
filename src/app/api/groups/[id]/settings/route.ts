import { NextRequest, NextResponse } from 'next/server';
import { getAgentForSession } from '@/services/agent';
import {
  editGroupSettings,
  muteGroup,
  unmuteGroup,
  editJoinLinkSettings,
} from '@/services/groups';
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
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const { pathname } = new URL(request.url);
    const convoId = pathname.split('/')[3]; // /api/groups/[id]/settings
    if (!convoId) {
      return NextResponse.json({ error: 'Missing group ID' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'update_name': {
        const { name } = body;
        if (!name || typeof name !== 'string' || !name.trim()) {
          return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
        }
        const result = await editGroupSettings(agent, convoId, name.trim());
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json({ success: true, convo: result.convo });
      }

      case 'toggle_mute': {
        const { muted } = body;
        if (muted) {
          const result = await muteGroup(agent, convoId);
          if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 });
          }
          return NextResponse.json({ success: true, muted: true });
        } else {
          const result = await unmuteGroup(agent, convoId);
          if (result.error) {
            return NextResponse.json({ error: result.error }, { status: 400 });
          }
          return NextResponse.json({ success: true, muted: false });
        }
      }

      case 'toggle_approval': {
        const { requireApproval } = body;
        const result = await editJoinLinkSettings(
          agent,
          convoId,
          requireApproval ?? false
        );
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json({
          success: true,
          joinLink: result.joinLink,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Group settings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
