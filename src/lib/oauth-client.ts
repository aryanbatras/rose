import { MemoryStore } from '@/lib/memory-store';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const stateStore = new MemoryStore();
const sessionStore = new MemoryStore();

let client: any = null;

export function getOAuthClientStores() {
  return { stateStore, sessionStore };
}

export async function getOAuthClient() {
  if (client) return client;

  const { NodeOAuthClient } = await import('@atproto/oauth-client-node');

  client = new NodeOAuthClient({
    clientMetadata: {
      client_id: `${APP_URL}/.well-known/oauth-client-metadata.json`,
      application_type: 'web',
      client_name: 'Rose',
      client_uri: APP_URL,
      dpop_bound_access_tokens: true,
      grant_types: ['authorization_code', 'refresh_token'],
      redirect_uris: [`${APP_URL}/api/auth/oauth/callback`],
      response_types: ['code'],
      scope: 'atproto transition:generic',
      token_endpoint_auth_method: 'none',
    },
    stateStore,
    sessionStore,
    allowHttp: APP_URL.startsWith('http://localhost'),
  });

  return client;
}
