import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { z } from 'zod';

// ─── Zod Schema ──────────────────────────────────────────────

export const SessionDataSchema = z.object({
  did: z.string(),
  handle: z.string(),
  accessJwt: z.string(),
  refreshJwt: z.string(),
  active: z.boolean().optional(),
});

export type SessionData = z.infer<typeof SessionDataSchema>;

// ─── Auth State ──────────────────────────────────────────────

interface AuthState {
  session: SessionData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  setSession: (session: SessionData) => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type AuthStore = AuthState & AuthActions;

// ─── Store ──────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // State
      session: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      // Actions
      setSession: (session) => {
        const parsed = SessionDataSchema.parse(session);
        set({
          session: parsed,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      },

      clearSession: () =>
        set({
          session: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),
    }),
    {
      name: 'rose-auth',
      partialize: (state) => ({
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
