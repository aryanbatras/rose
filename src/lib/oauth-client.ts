import { CookieStore } from '@/lib/cookie-store';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

function getAppUrl(): string {
  if (APP_URL) return APP_URL.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'development') return 'http://127.0.0.1:3000';
  throw new Error('NEXT_PUBLIC_APP_URL must be set');
}

const APP = getAppUrl();
const stateStore = new CookieStore();
const sessionStore = new CookieStore();

let client: any = null;

export function getOAuthClientStores() {
  return { stateStore, sessionStore };
}

export async function getOAuthClient() {
  if (client) return client;

  const { NodeOAuthClient } = await import('@atproto/oauth-client-node');

  client = new NodeOAuthClient({
    clientMetadata: {
      client_id: `${APP}/.well-known/oauth-client-metadata.json`,
      application_type: 'web',
      client_name: 'Rose',
      client_uri: APP,
      dpop_bound_access_tokens: true,
      grant_types: ['authorization_code', 'refresh_token'],
      redirect_uris: [`${APP}/api/auth/oauth/callback`],
      response_types: ['code'],
      scope: 'atproto transition:generic',
      token_endpoint_auth_method: 'none',
    },
    stateStore,
    sessionStore,
    allowHttp: APP.startsWith('http://'),
  });

  return client;
}
