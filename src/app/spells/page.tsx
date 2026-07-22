'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSpellStore } from '@/stores/spell-store';
import { PREDEFINED_SPELLS } from '@/types/spells';
import type { Spell } from '@/types/spells';
import { motion, AnimatePresence } from 'framer-motion';

export default function SpellsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    learnedIds,
    castIds,
    learnSpell,
    toggleCast,
    unlearnSpell,
    castCount,
    getAllSpells,
  } = useSpellStore();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, authLoading, router]);

  const allSpells = getAllSpells();
  const learnedSpells = allSpells.filter((s) => learnedIds.includes(s.id));
  const discoverableSpells = allSpells.filter((s) => !learnedIds.includes(s.id));

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] pb-20">
      {/* ─── Header ──────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-surface-base/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              aria-label="Back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold font-heading text-foreground">Spell Book</h1>
          </div>
          <span className="text-xs text-muted-foreground font-medium px-3 py-1 rounded-full bg-surface-elevated border border-border">
            {castCount()}/2 cast
          </span>
        </div>
      </header>

      <main>
        {/* ─── Active Spells Section ──────────────────── */}
        {learnedSpells.length > 0 && (
          <section className="px-4 pt-4">
            <h2 className="text-base font-bold text-foreground mb-3">Your Spells</h2>
            <p className="text-sm text-muted-foreground mb-3">
              Cast a spell to make it active. Dormant spells stay in your book but don&apos;t take effect.
              Guest access allows up to 2 spells cast at once.
            </p>
            <div className="space-y-2">
              {learnedSpells.map((spell) => {
                const isCast = castIds.includes(spell.id);
                return (
                  <motion.div
                    key={spell.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl border transition-all ${
                      isCast
                        ? 'border-brand/40 bg-brand-muted'
                        : 'border-border bg-surface-elevated/50'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <SpellIcon />
                            <h3 className="text-sm font-semibold text-foreground">{spell.name}</h3>
                            {isCast && (
                              <span className="px-1.5 py-0.5 rounded-full bg-brand/20 text-[10px] font-semibold text-brand uppercase tracking-wider">
                                Cast
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{spell.description}</p>
                        </div>

                        <label className="relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={isCast}
                            onChange={() => toggleCast(spell.id)}
                            disabled={!isCast && castCount() >= 2}
                            className="peer sr-only"
                          />
                          <span className={`absolute inset-0 rounded-full transition-colors ${
                            isCast
                              ? 'bg-brand'
                              : 'bg-muted peer-disabled:opacity-40'
                          }`} />
                          <span className={`absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                            isCast ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </label>
                      </div>

                      {/* Effects list */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {spell.effects.map((effect) => (
                          <span
                            key={effect.type}
                            className="px-2 py-0.5 rounded-full bg-accent text-[10px] font-medium text-muted-foreground"
                          >
                            {effectLabel(effect.type)}
                          </span>
                        ))}
                      </div>

                      {/* Unlearn button */}
                      <button
                        onClick={() => unlearnSpell(spell.id)}
                        className="mt-2 text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Remove from spell book
                      </button>
                    </div>

                    {/* Condition info bar */}
                    {isCast && spell.condition.type !== 'always' && (
                      <div className="px-4 py-2 border-t border-border/50 bg-accent/30 rounded-b-xl">
                        <p className="text-[11px] text-muted-foreground">
                          {conditionDescription(spell.condition)}
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty state */}
        {learnedSpells.length === 0 && (
          <section className="px-4 pt-8 text-center">
            <div className="py-8">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-foreground mb-1">No spells yet</h2>
              <p className="text-sm text-muted-foreground">
                Browse the Discover section below to learn spells and cast them to customize your experience.
              </p>
            </div>
          </section>
        )}

        {/* ─── Discover Spells Section ────────────────── */}
        <section className="px-4 pt-8">
          <h2 className="text-base font-bold text-foreground mb-1">Discover Spells</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Pre-made spells from the community. Learn one to copy it into your spell book.
          </p>

          {discoverableSpells.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                You&apos;ve learned all available spells! Check back later for more.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {discoverableSpells.map((spell, index) => (
                <motion.div
                  key={spell.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border border-border bg-surface-elevated/50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <SpellIcon />
                        <h3 className="text-sm font-semibold text-foreground">{spell.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{spell.description}</p>

                      {/* Effects tags */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {spell.effects.map((effect) => (
                          <span
                            key={effect.type}
                            className="px-2 py-0.5 rounded-full bg-accent text-[10px] font-medium text-muted-foreground"
                          >
                            {effectLabel(effect.type)}
                          </span>
                        ))}
                      </div>

                      {/* Condition & author */}
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                        {spell.condition.type !== 'always' && (
                          <span>{conditionDescription(spell.condition)}</span>
                        )}
                        {spell.author && (
                          <>
                            <span>·</span>
                            <span>{spell.author}</span>
                          </>
                        )}
                        {spell.casts !== undefined && (
                          <>
                            <span>·</span>
                            <span>{spell.casts} cast{spell.casts !== 1 ? 's' : ''}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => learnSpell(spell.id)}
                      className="shrink-0 px-4 py-1.5 rounded-full bg-brand text-black text-xs font-semibold hover:bg-brand-hover transition-colors"
                    >
                      Learn spell
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ─── Small helpers ───────────────────────────────────────────────

function SpellIcon() {
  return (
    <div className="h-6 w-6 rounded-lg bg-brand/15 flex items-center justify-center shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    </div>
  );
}

function effectLabel(type: string): string {
  const labels: Record<string, string> = {
    hide_avatar: 'Hide Avatar',
    hide_display_name: 'Hide Name',
    hide_handle: 'Hide Handle',
    hide_header: 'Hide Header',
    hide_repost_reason: 'Hide Reposts',
    hide_engagement_metrics: 'Hide Metrics',
    hide_compose: 'Hide Compose',
    hide_search_nav: 'Hide Search',
    hide_feeds_nav: 'Hide Feeds',
    hide_profile_nav: 'Hide Profile',
    disable_like: 'Disable Like',
    disable_reply: 'Disable Reply',
    disable_repost: 'Disable Repost',
    show_reminder: 'Reminder',
    lockout: 'Lockout',
    hide_all_interactions: 'Hide All Actions',
  };
  return labels[type] || type.replace(/_/g, ' ');
}

function conditionDescription(condition: any): string {
  switch (condition.type) {
    case 'time_range':
      return `🕐 ${String(condition.startHour).padStart(2, '0')}:00 – ${String(condition.endHour).padStart(2, '0')}:00`;
    case 'session_duration':
      return `⏱ After ${condition.minutes} min`;
    case 'daily_count':
      return `📊 ${condition.count}+ ${condition.actionType} today`;
    case 'interval':
      return `🔔 Every ${condition.intervalMinutes} min`;
    default:
      return '';
  }
}
