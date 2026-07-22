'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSpellStore } from '@/stores/spell-store';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft } from 'lucide-react';

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
      <header className="sticky top-0 z-40 bg-surface-base/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="h-9 w-9 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all flex items-center justify-center active:scale-95"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <h1 className="text-lg font-bold font-heading text-foreground">Spell Book</h1>
          </div>
          <span className="text-xs text-muted-foreground font-medium px-3 py-1.5 rounded-full bg-surface-elevated shadow-sm">
            {castCount()}/2 cast
          </span>
        </div>
      </header>

      <main>
        {learnedSpells.length > 0 && (
          <section className="px-4 pt-5">
            <h2 className="text-base font-bold text-foreground mb-1">Your Spells</h2>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Cast a spell to make it active. Dormant spells stay in your book but don&apos;t take effect.
            </p>
            <div className="space-y-3">
              {learnedSpells.map((spell) => {
                const isCast = castIds.includes(spell.id);
                return (
                  <motion.div
                    key={spell.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-2xl transition-all ${
                      isCast
                        ? 'bg-brand-muted ring-1 ring-brand/30'
                        : 'bg-surface-elevated/60 ring-1 ring-border/60'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5">
                            <div className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 ${
                              isCast ? 'bg-brand/15' : 'bg-accent'
                            }`}>
                              <Sparkles className={`h-4 w-4 ${
                                isCast ? 'text-brand' : 'text-muted-foreground'
                              }`} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">{spell.name}</h3>
                            {isCast && (
                              <span className="px-2 py-0.5 rounded-full bg-brand/15 text-[10px] font-semibold text-brand uppercase tracking-wider">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{spell.description}</p>
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
                            isCast ? 'bg-brand' : 'bg-muted peer-disabled:opacity-40'
                          }`} />
                          <span className={`absolute left-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                            isCast ? 'translate-x-4 shadow-sm' : 'translate-x-0'
                          }`} />
                        </label>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {spell.effects.map((effect) => (
                          <span
                            key={effect.type}
                            className="px-2.5 py-0.5 rounded-full bg-accent text-[10px] font-medium text-muted-foreground"
                          >
                            {effectLabel(effect.type)}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => unlearnSpell(spell.id)}
                        className="mt-2.5 text-[11px] text-muted-foreground hover:text-destructive transition-colors underline-offset-2 hover:underline"
                      >
                        Remove from spell book
                      </button>
                    </div>

                    {isCast && spell.condition.type !== 'always' && (
                      <div className="mx-4 pb-4">
                        <div className="px-3 py-2 rounded-xl bg-accent/40">
                          <p className="text-[11px] text-muted-foreground">
                            {conditionDescription(spell.condition)}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {learnedSpells.length === 0 && (
          <section className="px-4 pt-10 text-center">
            <div className="py-8">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-brand/8 flex items-center justify-center mb-4">
                <Sparkles className="h-7 w-7 text-brand/40" strokeWidth={1.5} />
              </div>
              <h2 className="text-base font-bold text-foreground mb-1.5">No spells yet</h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Browse the spells below to learn and cast them to customize your experience.
              </p>
            </div>
          </section>
        )}

        <section className="px-4 pt-10">
          <h2 className="text-base font-bold text-foreground mb-1">Discover Spells</h2>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            Learn a spell to add it to your book and customize your Rose experience.
          </p>

          {discoverableSpells.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                You&apos;ve learned all available spells! Check back later for more.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {discoverableSpells.map((spell, index) => (
                <motion.div
                  key={spell.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl bg-surface-elevated/50 ring-1 ring-border/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-xl bg-accent flex items-center justify-center shrink-0">
                          <Sparkles className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground">{spell.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{spell.description}</p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {spell.effects.map((effect) => (
                          <span
                            key={effect.type}
                            className="px-2.5 py-0.5 rounded-full bg-accent text-[10px] font-medium text-muted-foreground"
                          >
                            {effectLabel(effect.type)}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 mt-2.5 text-[11px] text-muted-foreground">
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
                      className="shrink-0 px-4 py-2 rounded-2xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-all active:scale-95"
                    >
                      Learn
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
      return `${String(condition.startHour).padStart(2, '0')}:00 – ${String(condition.endHour).padStart(2, '0')}:00`;
    case 'session_duration':
      return `After ${condition.minutes} min`;
    case 'daily_count':
      return `${condition.count}+ ${condition.actionType} today`;
    case 'interval':
      return `Every ${condition.intervalMinutes} min`;
    default:
      return '';
  }
}
