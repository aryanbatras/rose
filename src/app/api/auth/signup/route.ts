import { NextRequest, NextResponse } from 'next/server';
import { createAccount, storeSession } from '@/services/agent';

export async function POST(request: NextRequest) {
  try {
    const { handle, email, password, verificationCode } = await request.json();

    if (!handle || !email || !password) {
      return NextResponse.json(
        { error: 'Handle, email, and password are required' },
        { status: 400 }
      );
    }

    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!verificationCode) {
      return NextResponse.json(
        { error: 'Please complete the human verification challenge' },
        { status: 400 }
      );
    }

    const result = await createAccount(handle.trim(), email.trim(), password, verificationCode);

    if (result.error || !result.session) {
      return NextResponse.json(
        { error: result.error || 'Account creation failed' },
        { status: 400 }
      );
    }

    await storeSession(result.session);

    return NextResponse.json({
      session: {
        did: result.session.did,
        handle: result.session.handle,
        accessJwt: result.session.accessJwt,
        refreshJwt: result.session.refreshJwt,
        active: true,
      },
    });
  } catch (err) {
    console.error('Signup API error:', err);
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
