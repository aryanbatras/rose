'use server';

import { BskyAgent } from '@atproto/api';
import type { SessionData } from '@/store/auth-store';

const ATPROTO_SERVICE = process.env.ATPROTO_SERVICE_URL || 'https://bsky.social';

/**
 * Authenticate user with the AT Protocol and return full session data.
 */
export async function authenticateUser(
  identifier: string,
  password: string
): Promise<{ session: SessionData | null; error?: string }> {
  try {
    const agent = new BskyAgent({ service: ATPROTO_SERVICE });
    const response = await agent.login({ identifier, password });
    const loginData = response.data;

    return {
      session: {
        did: loginData.did,
        handle: loginData.handle,
        accessJwt: loginData.accessJwt,
        refreshJwt: loginData.refreshJwt,
        active: loginData.active !== false,
      },
    };
  } catch (error: any) {
    const message = error?.message || 'Authentication failed';
    return { session: null, error: message };
  }
}

/**
 * Resume a session using stored tokens.
 * Creates a fresh agent instance per call to avoid stale state.
 */
export async function resumeSession(
  sessionData: SessionData
): Promise<BskyAgent> {
  const agent = new BskyAgent({ service: ATPROTO_SERVICE });
  await agent.resumeSession({
    did: sessionData.did,
    handle: sessionData.handle,
    accessJwt: sessionData.accessJwt,
    refreshJwt: sessionData.refreshJwt,
    active: sessionData.active ?? true,
  });
  return agent;
}

/**
 * Store session data in httpOnly cookie for API route backward compatibility.
 */
export async function storeSession(session: SessionData): Promise<void> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  cookieStore.set('voiceflow_session', JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

/**
 * Clear the session cookie.
 */
export async function clearSession(): Promise<void> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    cookieStore.delete('voiceflow_session');
  } catch {}
}

/**
 * Get agent from session data (used by API routes).
 * Accepts session data directly (from client via request body/headers)
 * or reads from cookie if no session data provided.
 */
export async function getAgentForSession(sessionData?: SessionData): Promise<BskyAgent | null> {
  try {
    if (sessionData) {
      return await createAgentFromSession(sessionData);
    }
    // Fallback: try to read from cookie (for backwards compatibility)
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('voiceflow_session') || cookieStore.get('session');
    if (!sessionCookie) return null;
    const parsed: SessionData = JSON.parse(sessionCookie.value);
    return await createAgentFromSession(parsed);
  } catch {
    return null;
  }
}

/**
 * Create a BskyAgent from full session data.
 * This creates a fresh agent per call to avoid stale singleton state.
 */
export async function createAgentFromSession(
  sessionData: SessionData
): Promise<BskyAgent | null> {
  try {
    const agent = new BskyAgent({ service: ATPROTO_SERVICE });
    await agent.resumeSession({
      did: sessionData.did,
      handle: sessionData.handle,
      accessJwt: sessionData.accessJwt,
      refreshJwt: sessionData.refreshJwt,
      active: sessionData.active ?? true,
    });
    return agent;
  } catch {
    return null;
  }
}

/**
 * Create a new Bluesky account via the AT Protocol.
 * Note: bsky.social may block direct API signups via Entryway.
 * Falls back gracefully with the error message from the server.
 */
export async function createAccount(
  handle: string,
  email: string,
  password: string,
  inviteCode?: string
): Promise<{ session: SessionData | null; error?: string }> {
  try {
    const agent = new BskyAgent({ service: ATPROTO_SERVICE });
    const response = await agent.api.com.atproto.server.createAccount({
      handle,
      email,
      password,
      inviteCode: inviteCode || undefined,
    });
    const data = response.data;
    return {
      session: {
        did: data.did,
        handle: data.handle,
        accessJwt: data.accessJwt,
        refreshJwt: data.refreshJwt,
        active: true,
      },
    };
  } catch (error: any) {
    const message = error?.message || 'Account creation failed';
    // Map common AT Protocol errors to user-friendly messages
    if (message.includes('HandleNotAvailable') || message.includes('handle already taken')) {
      return { session: null, error: 'This handle is already taken. Please choose another.' };
    }
    if (message.includes('InvalidHandle')) {
      return { session: null, error: 'The handle you entered is invalid. Use a valid handle like yourname.bsky.social.' };
    }
    if (message.includes('InvalidPassword') || message.includes('weak password')) {
      return { session: null, error: 'Password is too weak. Use at least 8 characters with a mix of letters and numbers.' };
    }
    if (message.includes('InvalidInviteCode')) {
      return { session: null, error: 'The invite code is invalid or expired.' };
    }
    if (message.includes('429') || message.includes('RateLimit')) {
      return { session: null, error: 'Too many attempts. Please wait a few minutes and try again.' };
    }
    if (message.includes('403') || message.includes('Forbidden') || message.includes('Entryway')) {
      return { session: null, error: 'Direct signup is not available on this server. Please create an account on bsky.app first, then sign in.' };
    }
    return { session: null, error: message };
  }
}

/**
 * Refresh an expired session using refresh token.
 */
export async function refreshSession(
  sessionData: SessionData
): Promise<{ session: SessionData | null; error?: string }> {
  try {
    const agent = new BskyAgent({ service: ATPROTO_SERVICE });
    await agent.resumeSession({
      did: sessionData.did,
      handle: sessionData.handle,
      accessJwt: sessionData.accessJwt,
      refreshJwt: sessionData.refreshJwt,
      active: sessionData.active ?? true,
    });
    // After resume, the agent has refreshed tokens internally
    // We need to get the new session data
    // BskyAgent stores session internally; we can read it back
    if (agent.session) {
      return {
        session: {
          did: agent.session.did as string,
          handle: agent.session.handle,
          accessJwt: agent.session.accessJwt,
          refreshJwt: agent.session.refreshJwt,
          active: true,
        },
      };
    }
    return { session: null, error: 'Session not available after refresh' };
  } catch (error: any) {
    return { session: null, error: error?.message || 'Refresh failed' };
  }
}
