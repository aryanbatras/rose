// ─── Spell Types ──────────────────────────────────────────────────

/** Condition types for when a spell activates */
export type SpellConditionType = 'always' | 'time_range' | 'session_duration' | 'daily_count' | 'interval';

export interface SpellCondition {
  type: SpellConditionType;
  /** For time_range: { startHour: 0, endHour: 8 } means 00:00–08:00 */
  startHour?: number;
  endHour?: number;
  /** For session_duration: minutes of use before activating */
  minutes?: number;
  /** For daily_count: number of actions before activating */
  count?: number;
  /** For daily_count: action type to count */
  actionType?: 'replies' | 'likes' | 'all';
  /** For interval: minutes between reminders */
  intervalMinutes?: number;
}

/** Effect types that spells can apply */
export type SpellEffectType =
  | 'hide_avatar'
  | 'hide_display_name'
  | 'hide_handle'
  | 'hide_header'
  | 'hide_repost_reason'
  | 'hide_engagement_metrics'
  | 'hide_compose'
  | 'hide_search_nav'
  | 'hide_feeds_nav'
  | 'hide_profile_nav'
  | 'disable_like'
  | 'disable_reply'
  | 'disable_repost'
  | 'show_reminder'
  | 'lockout'
  | 'hide_all_interactions';

export interface SpellEffect {
  type: SpellEffectType;
  message?: string;
}

export interface Spell {
  id: string;
  name: string;
  description: string;
  condition: SpellCondition;
  effects: SpellEffect[];
  author?: string;
  casts?: number;
}

// ─── Predefined Spells ───────────────────────────────────────────

export const PREDEFINED_SPELLS: Spell[] = [
  {
    id: 'quiet-shadow',
    name: 'Quiet Shadow',
    description: 'Strips away profile details to let the content speak for itself without personal context.',
    condition: { type: 'always' },
    effects: [
      { type: 'hide_avatar' },
      { type: 'hide_display_name' },
      { type: 'hide_handle' },
      { type: 'hide_header' },
    ],
    author: 'lore.house',
    casts: 3,
  },
  {
    id: 'night-lantern',
    name: 'Night Lantern',
    description: 'Softens the app during late night hours, gently discouraging impulsive interaction between midnight and morning.',
    condition: { type: 'time_range', startHour: 0, endHour: 8 },
    effects: [
      { type: 'disable_like' },
      { type: 'disable_reply' },
      { type: 'disable_repost' },
      { type: 'hide_compose' },
    ],
    author: 'andreijiroh.dev',
    casts: 5,
  },
  {
    id: 'brief-detox',
    name: 'A Brief Detox',
    description: 'After 15 minutes of browsing, shows a mindful reminder to help you be intentional with your time.',
    condition: { type: 'session_duration', minutes: 15 },
    effects: [
      { type: 'show_reminder', message: 'Take a breath. Step away. Your feed will be here when you return.' },
    ],
    author: 'lore.house',
    casts: 19,
  },
  {
    id: 'hydrate',
    name: 'Hydrate',
    description: 'Gently reminds you to pause and hydrate during your online time.',
    condition: { type: 'interval', intervalMinutes: 30 },
    effects: [
      { type: 'show_reminder', message: 'Time to hydrate! Drink some water.' },
    ],
    author: 'dame.is',
    casts: 7,
  },
  {
    id: 'quiet-after-storm',
    name: 'Quiet After Storm',
    description: 'Gently pauses reply interactions after a day of heavy conversation (more than 10 replies sent).',
    condition: { type: 'daily_count', count: 10, actionType: 'replies' },
    effects: [
      { type: 'disable_reply' },
    ],
    author: 'dame.is',
    casts: 2,
  },
  {
    id: 'zen-feed',
    name: 'Zen Feed',
    description: 'Removes engagement metrics (like counts, reply counts) for a calmer, less competitive feed experience.',
    condition: { type: 'always' },
    effects: [
      { type: 'hide_engagement_metrics' },
    ],
    author: 'voiceflow',
    casts: 12,
  },
  {
    id: 'lurker-mode',
    name: 'Lurker Mode',
    description: 'Hides all interaction buttons. Browse without the temptation to engage.',
    condition: { type: 'always' },
    effects: [
      { type: 'hide_all_interactions' },
    ],
    author: 'voiceflow',
    casts: 8,
  },
  {
    id: 'distraction-free',
    name: 'Distraction Free',
    description: 'Hides navigation elements like Feeds, Search, and Profile so you can focus on your timeline.',
    condition: { type: 'always' },
    effects: [
      { type: 'hide_search_nav' },
      { type: 'hide_feeds_nav' },
      { type: 'hide_profile_nav' },
    ],
    author: 'voiceflow',
    casts: 6,
  },
];

// ─── Pure helpers (no side effects, no module state) ─────────────

/** Check if a spell's condition is currently met */
export function evaluateCondition(condition: SpellCondition): boolean {
  switch (condition.type) {
    case 'always':
      return true;

    case 'time_range': {
      const hour = new Date().getHours();
      const start = condition.startHour ?? 0;
      const end = condition.endHour ?? 8;
      if (start <= end) return hour >= start && hour < end;
      return hour >= start || hour < end;
    }

    case 'session_duration':
    case 'daily_count':
      // Evaluated by the store with stored values — always true here,
      // the store calls evaluateStoredCondition with actual values
      return true;

    case 'interval':
      // Intervals are handled by the hook with a timer
      return true;

    default:
      return false;
  }
}
