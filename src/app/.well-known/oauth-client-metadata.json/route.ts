import { NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET() {
  const metadata = {
    client_id: `${APP_URL}/.well-known/oauth-client-metadata.json`,
    application_type: 'web',
    client_name: 'Rose',
    client_uri: APP_URL,
    logo_uri: `${APP_URL}/logo.png`,
    dpop_bound_access_tokens: true,
    grant_types: ['authorization_code', 'refresh_token'],
    redirect_uris: [`${APP_URL}/api/auth/oauth/callback`],
    response_types: ['code'],
    scope: 'atproto transition:generic',
    token_endpoint_auth_method: 'none',
  };

  return NextResponse.json(metadata, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
