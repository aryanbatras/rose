import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Set demo session cookie - same shape as real session but with demo credentials
    const demoSession = JSON.stringify({
      did: 'did:plc:demo05',
      handle: 'demo.user.voiceflow',
      accessJwt: 'demo-access-token',
      refreshJwt: 'demo-refresh-token',
      active: true,
    });

    cookieStore.set('session', demoSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/',
    });

    // Set a flag to indicate demo mode
    cookieStore.set('demo_mode', 'true', {
      httpOnly: false, // client needs to read this
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2,
      path: '/',
    });

    return NextResponse.json({
      session: {
        did: 'did:plc:demo05',
        handle: 'demo.user.voiceflow',
      },
      demo: true,
    });
  } catch (error) {
    console.error('Demo mode error:', error);
    return NextResponse.json(
      { error: 'Failed to start demo mode' },
      { status: 500 }
    );
  }
}
