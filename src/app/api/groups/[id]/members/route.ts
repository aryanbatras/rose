import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/services/agent';
import { addGroupMembers, removeGroupMembers } from '@/services/groups';

/**
 * POST /api/groups/[id]/members
 * Add or remove members from a group.
 * Body: { action: 'add' | 'remove', memberDids: string[] }
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
    const { action, memberDids } = body;

    if (!action || !['add', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use add or remove.' }, { status: 400 });
    }

    if (!memberDids || !Array.isArray(memberDids) || memberDids.length === 0) {
      return NextResponse.json({ error: 'memberDids array is required' }, { status: 400 });
    }

    if (action === 'add') {
      const result = await addGroupMembers(agent, convoId, memberDids);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({
        convo: result.convo,
        addedMembers: result.addedMembers,
      });
    }

    // action === 'remove'
    const result = await removeGroupMembers(agent, convoId, memberDids);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ convo: result.convo });
  } catch (error) {
    console.error('POST /api/groups/[id]/members error:', error);
    return NextResponse.json({ error: 'Failed to manage members' }, { status: 500 });
  }
}
