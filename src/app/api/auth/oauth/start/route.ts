import { NextRequest, NextResponse } from 'next/server';
import { getOAuthClient } from '@/lib/oauth-client';

const PDS_URL = process.env.ATPROTO_SERVICE_URL || 'https://bsky.social';

export async function GET(request: NextRequest) {
  try {
    const client = await getOAuthClient();

    // authorize() with a PDS URL (no handle) triggers "create account" prompt
    // The PDS URL acts as the "input" — no user identifier needed
    const authorizeUrl = await client.authorize(PDS_URL, {
      prompt: 'create',
      scope: 'atproto transition:generic',
    });

    return NextResponse.redirect(authorizeUrl);
  } catch (error: any) {
    console.error('OAuth start error:', error);
    return NextResponse.redirect(
      new URL(`/signup?error=${encodeURIComponent(error.message || 'Failed to start signup')}`, request.url)
    );
  }
}
