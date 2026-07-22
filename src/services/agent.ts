'use server';

import { BskyAgent } from '@atproto/api';
import { cookies } from 'next/headers';
import type { SessionData, DID } from '@/types/atproto';

const ATPROTO_SERVICE = process.env.ATPROTO_SERVICE_URL || 'https://bsky.social';

let agentInstance: BskyAgent | null = null;

async function getAgentInstance(): Promise<BskyAgent> {
  if (!agentInstance) {
    agentInstance = new BskyAgent({ service: ATPROTO_SERVICE });
  }
  return agentInstance;
}

export async function authenticateUser(
  identifier: string,
  password: string
): Promise<{ session: SessionData | null; error?: string }> {
  try {
    const agent = await getAgentInstance();
    const response = await agent.login({ identifier, password });
    const loginData = response.data;
    const session: SessionData = {
      did: loginData.did as DID,
      handle: loginData.handle,
      accessJwt: loginData.accessJwt,
      refreshJwt: loginData.refreshJwt,
      active: loginData.active !== false,
    };
    return { session };
  } catch (error: any) {
    const message = error?.message || 'Authentication failed';
    return { session: null, error: message };
  }
}

export async function resumeSession(
  sessionData: SessionData
): Promise<BskyAgent> {
  const agent = await getAgentInstance();
  try {
    await agent.resumeSession({
      did: sessionData.did as string,
      handle: sessionData.handle,
      accessJwt: sessionData.accessJwt,
      refreshJwt: sessionData.refreshJwt,
      active: sessionData.active ?? true,
    });
  } catch {
    // If the BskyAgent internal refresh fails, session is truly expired
    throw new Error('Session expired. Please log in again.');
  }
  return agent;
}

export async function getAgentForSession(): Promise<BskyAgent | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('voiceflow_session');
    if (!sessionCookie) return null;

    const sessionData: SessionData = JSON.parse(sessionCookie.value);
    const agent = await resumeSession(sessionData);
    return agent;
  } catch {
    return null;
  }
}

export async function storeSession(session: SessionData): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('voiceflow_session', JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function updateSession(session: Partial<SessionData>): Promise<void> {
  const cookieStore = await cookies();
  const existing = cookieStore.get('voiceflow_session');
  if (existing) {
    const current: SessionData = JSON.parse(existing.value);
    const updated: SessionData = { ...current, ...session };
    cookieStore.set('voiceflow_session', JSON.stringify(updated), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('voiceflow_session');
}

export { getAgentInstance };
