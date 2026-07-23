import { NextRequest, NextResponse } from 'next/server';
import { getOAuthClient, getOAuthClientStores } from '@/lib/oauth-client';
import { storeSession } from '@/services/agent';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const iss = searchParams.get('iss');
  const error = searchParams.get('error');

  if (error) {
    const errorDesc = searchParams.get('error_description') || error;
    return NextResponse.redirect(new URL(`/signup?error=${encodeURIComponent(errorDesc)}`, request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/signup?error=Missing+authorization+code', request.url));
  }

  try {
    const client = await getOAuthClient();

    // Exchange the authorization code for tokens
    const { session } = await client.callback(
      new URLSearchParams({ code, state, iss: iss || '' })
    );

    const did = session.sub;

    // Fetch profile via authorized request — pass actor=did as query param
    const profileRes = await session.fetchHandler(
      `/xrpc/app.bsky.actor.getProfile?actor=${did}`
    );

    if (!profileRes.ok) {
      const body = await profileRes.text();
      console.error('Profile fetch failed:', profileRes.status, body);
      throw new Error(`Profile fetch failed (${profileRes.status})`);
    }

    const profile = await profileRes.json();

    // Get tokens from the session store
    const { sessionStore } = getOAuthClientStores();
    const stored: any = await sessionStore.get(did);
    if (!stored?.tokenSet?.access_token) {
      throw new Error('Session tokens not found in store');
    }

    // Bridge to existing cookie-based auth
    await storeSession({
      did,
      handle: profile.handle,
      accessJwt: stored.tokenSet.access_token,
      refreshJwt: stored.tokenSet.refresh_token || '',
      active: true,
    });

    return NextResponse.redirect(new URL('/feed', request.url));
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/signup?error=${encodeURIComponent(error.message || 'Signup failed')}`, request.url)
    );
  }
}
