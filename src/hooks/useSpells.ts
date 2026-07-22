'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useSpellStore } from '@/stores/spell-store';
import { toast } from 'sonner';
import type { SpellEffect } from '@/types/spells';

/**
 * Hook that reads all active spell effects and returns convenient boolean flags.
 * Also manages interval timers for reminder-based spells (e.g., Hydrate).
 */
export function useSpells() {
  const effects: SpellEffect[] = useSpellStore((s) => s.getActiveEffects());
  const lastReminderRef = useRef<number>(Date.now());

  // Compute interval minutes from active interval spells
  const intervalMinutes = useMemo(() => {
    const state = useSpellStore.getState();
    const allSpells = state.getAllSpells();
    for (const spell of allSpells) {
      if (
        state.castIds.includes(spell.id) &&
        spell.condition.type === 'interval' &&
        spell.condition.intervalMinutes
      ) {
        return spell.condition.intervalMinutes;
      }
    }
    return null;
    // Re-compute when effects change (which means spell state changed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effects]);

  // Interval timer for reminder-based spells
  useEffect(() => {
    if (!intervalMinutes) return;

    const id = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastReminderRef.current) / 1000 / 60;
      if (elapsed >= intervalMinutes) {
        lastReminderRef.current = now;

        // Find reminder message from active effects
        const activeEffects = useSpellStore.getState().getActiveEffects();
        const reminderEffect = activeEffects.find((e) => e.type === 'show_reminder');
        if (reminderEffect?.message) {
          toast(reminderEffect.message, {
            icon: '🧙',
            duration: 8000,
          });
        }
      }
    }, 60_000); // Check every minute

    return () => clearInterval(id);
  }, [intervalMinutes]);

  const hasEffect = (type: string) => effects.some((e) => e.type === type);

  return {
    effects,
    hideAvatar: hasEffect('hide_avatar'),
    hideDisplayName: hasEffect('hide_display_name'),
    hideHandle: hasEffect('hide_handle'),
    hideHeader: hasEffect('hide_header'),
    hideRepostReason: hasEffect('hide_repost_reason'),
    hideEngagementMetrics: hasEffect('hide_engagement_metrics'),
    hideCompose: hasEffect('hide_compose'),
    hideSearchNav: hasEffect('hide_search_nav'),
    hideFeedsNav: hasEffect('hide_feeds_nav'),
    hideProfileNav: hasEffect('hide_profile_nav'),
    disableLike: hasEffect('disable_like'),
    disableReply: hasEffect('disable_reply'),
    disableRepost: hasEffect('disable_repost'),
    hideAllInteractions: hasEffect('hide_all_interactions'),
    hasLockout: hasEffect('lockout'),
    reminderMessage: effects.find((e) => e.type === 'show_reminder')?.message || null,
  };
}
