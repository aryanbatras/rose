import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PREDEFINED_SPELLS, evaluateCondition } from '@/types/spells';
import type { Spell, SpellEffect, SpellCondition } from '@/types/spells';

interface SpellState {
  /** IDs of spells the user has learned */
  learnedIds: string[];
  /** IDs of spells currently cast (active) */
  castIds: string[];
  /** User-created custom spells */
  customSpells: Spell[];

  // ─── Persistent runtime state for condition evaluation ──────
  /** Timestamp when the current session started */
  sessionStartTime: number;
  /** Number of replies sent today */
  dailyReplyCount: number;
  /** ISO date string for the last daily reset */
  lastActivityDate: string;

  /** Learn a spell */
  learnSpell: (id: string) => void;
  /** Cast/toggle a spell */
  toggleCast: (id: string) => void;
  /** Unlearn a spell */
  unlearnSpell: (id: string) => void;
  /** Get all effects that should currently be active */
  getActiveEffects: () => SpellEffect[];
  /** Check if a spell is cast */
  isCast: (id: string) => boolean;
  /** Check if a spell is learned */
  isLearned: (id: string) => boolean;
  /** Get all known spells */
  getAllSpells: () => Spell[];
  /** Cast count */
  castCount: () => number;
  /** Record a daily action (replies, likes) for daily_count conditions */
  recordAction: (type: 'replies' | 'likes') => void;
  /** Reset session timer (call on login) */
  resetSession: () => void;
  /** Evaluate a condition that depends on stored values */
  evaluateStoredCondition: (condition: SpellCondition) => boolean;
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useSpellStore = create<SpellState>()(
  persist(
    (set, get) => ({
      learnedIds: [],
      castIds: [],
      customSpells: [],
      sessionStartTime: Date.now(),
      dailyReplyCount: 0,
      lastActivityDate: getTodayDate(),

      learnSpell: (id) =>
        set((state) => {
          if (state.learnedIds.includes(id)) return state;
          const canCast = state.castIds.length < 2;
          return {
            learnedIds: [...state.learnedIds, id],
            castIds: canCast ? [...state.castIds, id] : state.castIds,
          };
        }),

      toggleCast: (id) =>
        set((state) => {
          if (!state.learnedIds.includes(id)) return state;
          const isCurrentlyCast = state.castIds.includes(id);
          if (isCurrentlyCast) {
            return { castIds: state.castIds.filter((cid) => cid !== id) };
          }
          if (state.castIds.length >= 2) return state;
          return { castIds: [...state.castIds, id] };
        }),

      unlearnSpell: (id) =>
        set((state) => ({
          learnedIds: state.learnedIds.filter((lid) => lid !== id),
          castIds: state.castIds.filter((cid) => cid !== id),
        })),

      recordAction: (type) =>
        set((state) => {
          // Reset counter if it's a new day
          const today = getTodayDate();
          const newCount = state.lastActivityDate === today ? state.dailyReplyCount + 1 : 1;
          return {
            dailyReplyCount: type === 'replies' ? newCount : state.dailyReplyCount,
            lastActivityDate: today,
          };
        }),

      resetSession: () => set({ sessionStartTime: Date.now() }),

      evaluateStoredCondition: (condition) => {
        const state = get();
        switch (condition.type) {
          case 'session_duration': {
            const elapsed = (Date.now() - state.sessionStartTime) / 1000 / 60;
            return elapsed >= (condition.minutes ?? 15);
          }
          case 'daily_count': {
            const today = getTodayDate();
            const count = state.lastActivityDate === today ? state.dailyReplyCount : 0;
            return count >= (condition.count ?? 10);
          }
          default:
            return evaluateCondition(condition);
        }
      },

      getActiveEffects: () => {
        const state = get();
        const effects: SpellEffect[] = [];
        const allSpells = [...PREDEFINED_SPELLS, ...state.customSpells];

        for (const spell of allSpells) {
          if (!state.castIds.includes(spell.id)) continue;
          // Evaluate condition with stored values
          if (!state.evaluateStoredCondition(spell.condition)) continue;
          effects.push(...spell.effects);
        }

        return effects;
      },

      isCast: (id) => get().castIds.includes(id),
      isLearned: (id) => get().learnedIds.includes(id),
      getAllSpells: () => [...PREDEFINED_SPELLS, ...get().customSpells],
      castCount: () => get().castIds.length,
    }),
    {
      name: 'voiceflow-spells',
      // Don't persist runtime counters — reinitialize on page load
      partialize: (state) => ({
        learnedIds: state.learnedIds,
        castIds: state.castIds,
        customSpells: state.customSpells,
        // Don't persist sessionStartTime or dailyReplyCount
      }),
    }
  )
);
