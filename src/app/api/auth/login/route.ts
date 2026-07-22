import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, storeSession } from '@/services/agent';

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Handle and password are required' },
        { status: 400 }
      );
    }

    const { session, error } = await authenticateUser(identifier, password);

    if (error || !session) {
      return NextResponse.json(
        { error: error || 'Authentication failed' },
        { status: 401 }
      );
    }

    await storeSession(session);

    return NextResponse.json({
      session: {
        did: session.did,
        handle: session.handle,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
