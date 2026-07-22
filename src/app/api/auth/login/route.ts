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

    // Store session in httpOnly cookie for API route backward compatibility
    await storeSession(session);

    // Also return full session data for client-side Zustand localStorage storage
    return NextResponse.json({
      session: {
        did: session.did,
        handle: session.handle,
        accessJwt: session.accessJwt,
        refreshJwt: session.refreshJwt,
        active: session.active,
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
