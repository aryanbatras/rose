import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/services/agent';
import { getPostThread } from '@/services/posts';

export async function GET(request: NextRequest) {
  try {
    const agent = await getAgentFromRequest(request);
    if (!agent) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const uri = searchParams.get('uri');
    if (!uri) return NextResponse.json({ error: 'Missing uri' }, { status: 400 });

    const thread = await getPostThread(agent, decodeURIComponent(uri));
    return NextResponse.json(thread);
  } catch (error) {
    console.error('Thread API error:', error);
    return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 });
  }
}
