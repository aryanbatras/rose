import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/services/agent';

export async function POST(request: NextRequest) {
  try {
    const agent = await getAgentFromRequest(request);
    if (!agent) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { name } = await request.json().catch(() => ({}));

    const response = await agent.api.com.atproto.server.createAppPassword({
      name: name || 'Rose Client',
      privileged: false,
    });

    return NextResponse.json({
      password: response.data.password,
      name: response.data.name,
      createdAt: response.data.createdAt,
    });
  } catch (err: any) {
    console.error('Create app password error:', err);
    const message = err?.message || 'Failed to create app password';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
