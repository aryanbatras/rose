'use client';

import { useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

/**
 * Auth-aware fetch that automatically attaches the session
 * from Zustand localStorage as an X-AT-Session header.
 */
export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const state = useAuthStore.getState();
  if (state.session) {
    // Base64 encode session data so server can resume from it
    const encoded = Buffer.from(JSON.stringify(state.session)).toString('base64');
    const headers = new Headers(options.headers);
    headers.set('x-at-session', encoded);
    return fetch(url, { ...options, headers });
  }
  return fetch(url, options);
}

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    async function validateSession() {
      const state = useAuthStore.getState();
      if (!state.session) {
        store.setLoading(false);
        return;
      }

      try {
        // Validate the stored session by calling the server
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          store.setLoading(false);
        } else {
          // Session expired - try to refresh
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              refreshJwt: state.session.refreshJwt,
              did: state.session.did,
              handle: state.session.handle,
            }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            if (data.session) {
              store.setSession(data.session);
            }
          } else {
            store.clearSession();
          }
        }
      } catch {
        store.clearSession();
      } finally {
        store.setLoading(false);
      }
    }

    validateSession();
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    store.setLoading(true);
    store.setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (res.ok && data.session) {
        store.setSession(data.session);
        return true;
      } else {
        store.setError(data.error || 'Login failed');
        store.setLoading(false);
        return false;
      }
    } catch {
      store.setError('Connection error');
      store.setLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    store.clearSession();
  }, []);

  return {
    session: store.session,
    isLoading: store.isLoading,
    error: store.error,
    login,
    logout,
    isAuthenticated: store.isAuthenticated,
  };
}
