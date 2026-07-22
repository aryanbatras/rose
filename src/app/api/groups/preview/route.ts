import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/services/agent';
import { getJoinLinkPreviews } from '@/services/groups';

/**
 * GET /api/groups/preview?codes=xxx,yyy
 * Preview one or more join links by their invite codes.
 */
export async function GET(request: NextRequest) {
  try {
    const agent = await getAgentFromRequest(request);
    if (!agent) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const codesParam = searchParams.get('codes');
    if (!codesParam) {
      return NextResponse.json({ previews: [] });
    }

    const codes = codesParam.split(',').map((c) => c.trim()).filter(Boolean);
    if (codes.length === 0) {
      return NextResponse.json({ previews: [] });
    }

    const result = await getJoinLinkPreviews(agent, codes);
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/groups/preview error:', error);
    return NextResponse.json({ error: 'Failed to preview join links' }, { status: 500 });
  }
}
