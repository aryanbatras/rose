import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/services/agent';
import { createJoinLink, disableJoinLink, enableJoinLink } from '@/services/groups';

/**
 * POST /api/groups/[id]/invite
 * Create or manage a join link for a group.
 * Body: { action: 'create' | 'disable' | 'enable', joinRule?: string, requireApproval?: boolean }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await getAgentFromRequest(request);
    if (!agent) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id: convoId } = await params;
    const body = await request.json();
    const { action, joinRule, requireApproval } = body;

    if (!action || !['create', 'disable', 'enable'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use create, disable, or enable.' }, { status: 400 });
    }

    switch (action) {
      case 'create': {
        const rule = joinRule || 'anyone';
        if (!['owner_invite', 'member_invite', 'anyone'].includes(rule)) {
          return NextResponse.json({ error: 'Invalid join rule' }, { status: 400 });
        }
        const result = await createJoinLink(agent, convoId, rule, requireApproval ?? false);
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json({ joinLink: result.joinLink });
      }

      case 'disable': {
        const result = await disableJoinLink(agent, convoId);
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json({ success: true });
      }

      case 'enable': {
        const result = await enableJoinLink(agent, convoId);
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }
        return NextResponse.json({ joinLink: result.joinLink });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('POST /api/groups/[id]/invite error:', error);
    return NextResponse.json({ error: 'Failed to manage invite link' }, { status: 500 });
  }
}
