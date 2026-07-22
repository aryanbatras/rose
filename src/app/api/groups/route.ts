import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/services/agent';
import { listGroups, createGroup } from '@/services/groups';

export async function GET(request: NextRequest) {
  try {
    const agent = await getAgentFromRequest(request);
    if (!agent) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(Number(searchParams.get('limit')) || 30, 100);

    const result = await listGroups(agent, cursor, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/groups error:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const agent = await getAgentFromRequest(request);
    if (!agent) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { name, memberDids } = body;

    if (!name || !memberDids?.length) {
      return NextResponse.json({ error: 'Name and members required' }, { status: 400 });
    }

    const result = await createGroup(agent, name, memberDids);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ convoId: result.convoId });
  } catch (error) {
    console.error('POST /api/groups error:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
