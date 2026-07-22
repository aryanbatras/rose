'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useSpellStore, computeActiveEffects } from '@/stores/spell-store';
import { toast } from 'sonner';
import { PREDEFINED_SPELLS } from '@/types/spells';
import type { SpellEffect } from '@/types/spells';

/**
 * Hook that reads all active spell effects and returns convenient boolean flags.
 * Also manages interval timers for reminder-based spells (e.g., Hydrate).
 *
 * NOTE: This hook selects stable primitive/array values from the store individually
 * and then computes effects using useMemo. THIS IS CRITICAL — calling
 * useSpellStore((s) => s.getActiveEffects()) directly would return a NEW array reference
 * on every selector call, causing React's useSyncExternalStore to detect an infinite loop.
 * See: "The result of getServerSnapshot should be cached to avoid an infinite loop"
 */
export function useSpells() {
  // ── Select stable primitive/array values (each is the same reference unless changed) ──
  const castIds = useSpellStore((s) => s.castIds);
  const customSpells = useSpellStore((s) => s.customSpells);
  const sessionStartTime = useSpellStore((s) => s.sessionStartTime);
  const dailyReplyCount = useSpellStore((s) => s.dailyReplyCount);
  const lastActivityDate = useSpellStore((s) => s.lastActivityDate);

  // ── Compute effects from stable deps ─────────────────────────────────────
  const effects: SpellEffect[] = useMemo(
    () =>
      computeActiveEffects(
        castIds,
        customSpells,
        sessionStartTime,
        dailyReplyCount,
        lastActivityDate
      ),
    [castIds, customSpells, sessionStartTime, dailyReplyCount, lastActivityDate]
  );

  const lastReminderRef = useRef<number>(Date.now());

  // Compute interval minutes from spell definitions (not from effects — stable)
  const intervalMinutes = useMemo(() => {
    const allSpells = [...PREDEFINED_SPELLS, ...customSpells];
    for (const spell of allSpells) {
      if (
        castIds.includes(spell.id) &&
        spell.condition.type === 'interval' &&
        spell.condition.intervalMinutes
      ) {
        return spell.condition.intervalMinutes;
      }
    }
    return null;
  }, [castIds, customSpells]);

  // Interval timer for reminder-based spells
  useEffect(() => {
    if (!intervalMinutes) return;

    const id = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastReminderRef.current) / 1000 / 60;
      if (elapsed >= intervalMinutes) {
        lastReminderRef.current = now;

        // Find reminder message from active effects (uses getState — not a selector)
        const state = useSpellStore.getState();
        const activeEffects = state.getActiveEffects();
        const reminderEffect = activeEffects.find((e) => e.type === 'show_reminder');
        if (reminderEffect?.message) {
          toast(reminderEffect.message, {
            icon: '🧙',
            duration: 8000,
          });
        }
      }
    }, 60_000);

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
