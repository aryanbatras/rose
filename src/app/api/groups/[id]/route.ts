import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/services/agent';
import { getGroup, getGroupMembers, getGroupMessages, sendGroupMessage } from '@/services/groups';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await getAgentFromRequest(request);
    if (!agent) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'group';
    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);

    if (scope === 'members') {
      const members = await getGroupMembers(agent, id);
      return NextResponse.json({ members });
    }

    if (scope === 'messages') {
      const result = await getGroupMessages(agent, id, cursor, limit);
      return NextResponse.json(result);
    }

    // Default: return group info
    const group = await getGroup(agent, id);
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    return NextResponse.json({ group });
  } catch (error) {
    console.error('GET /api/groups/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch group data' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const agent = await getAgentFromRequest(request);
    if (!agent) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { text } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Message text required' }, { status: 400 });
    }

    const result = await sendGroupMessage(agent, id, text);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('POST /api/groups/[id] error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
