import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/services/agent';
import { requestJoinGroup } from '@/services/groups';

/**
 * POST /api/groups/join
 * Join a group using a join link code.
 * Body: { code: string }
 */
export async function POST(request: NextRequest) {
  try {
    const agent = await getAgentFromRequest(request);
    if (!agent) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'Join link code is required' }, { status: 400 });
    }

    const result = await requestJoinGroup(agent, code.trim());
    if (result.error) {
      const status = result.errorType === 'user_kicked' ? 403
        : result.errorType === 'invalid_code' || result.errorType === 'link_disabled' ? 404
        : 400;
      return NextResponse.json({ error: result.error, errorType: result.errorType }, { status });
    }

    return NextResponse.json({ result: result.result });
  } catch (error) {
    console.error('POST /api/groups/join error:', error);
    return NextResponse.json({ error: 'Failed to join group' }, { status: 500 });
  }
}
