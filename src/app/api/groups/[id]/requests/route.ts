import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/services/agent';
import { listJoinRequests, approveJoinRequest, rejectJoinRequest } from '@/services/groups';

/**
 * GET /api/groups/[id]/requests
 * List pending join requests for a group.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await getAgentFromRequest(request);
    if (!agent) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id: convoId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(Number(searchParams.get('limit')) || 30, 100);

    const result = await listJoinRequests(agent, convoId, cursor, limit);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ requests: result.requests, cursor: result.cursor });
  } catch (error) {
    console.error('GET /api/groups/[id]/requests error:', error);
    return NextResponse.json({ error: 'Failed to list join requests' }, { status: 500 });
  }
}

/**
 * POST /api/groups/[id]/requests
 * Approve or reject a join request.
 * Body: { action: 'approve' | 'reject', member: string }
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
    const { action, member } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use approve or reject.' }, { status: 400 });
    }

    if (!member || typeof member !== 'string') {
      return NextResponse.json({ error: 'Member DID is required' }, { status: 400 });
    }

    if (action === 'approve') {
      const result = await approveJoinRequest(agent, convoId, member);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ convo: result.convo });
    }

    // action === 'reject'
    const result = await rejectJoinRequest(agent, convoId, member);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/groups/[id]/requests error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
