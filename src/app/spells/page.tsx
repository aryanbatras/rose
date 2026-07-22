'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSpellStore } from '@/stores/spell-store';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Lock, Zap, Droplets, MessageSquareOff, BarChart3, Compass, UserX, RefreshCcw } from 'lucide-react';
import type { SpellEffectType } from '@/types/spells';

/** Map each spell effect to a Lucide icon component. */
function effectIcon(type: SpellEffectType) {
  const icons: Record<string, React.ReactNode> = {
    hide_avatar: <Eye className="h-4 w-4" strokeWidth={1.5} />,
    hide_display_name: <EyeOff className="h-4 w-4" strokeWidth={1.5} />,
    hide_handle: <UserX className="h-4 w-4" strokeWidth={1.5} />,
    hide_header: <EyeOff className="h-4 w-4" strokeWidth={1.5} />,
    hide_repost_reason: <RefreshCcw className="h-4 w-4" strokeWidth={1.5} />,
    hide_engagement_metrics: <BarChart3 className="h-4 w-4" strokeWidth={1.5} />,
    hide_compose: <Compass className="h-4 w-4" strokeWidth={1.5} />,
    hide_search_nav: <Compass className="h-4 w-4" strokeWidth={1.5} />,
    hide_feeds_nav: <Compass className="h-4 w-4" strokeWidth={1.5} />,
    hide_profile_nav: <UserX className="h-4 w-4" strokeWidth={1.5} />,
    disable_like: <Lock className="h-4 w-4" strokeWidth={1.5} />,
    disable_reply: <MessageSquareOff className="h-4 w-4" strokeWidth={1.5} />,
    disable_repost: <RefreshCcw className="h-4 w-4" strokeWidth={1.5} />,
    show_reminder: <Droplets className="h-4 w-4" strokeWidth={1.5} />,
    lockout: <Lock className="h-4 w-4" strokeWidth={1.5} />,
    hide_all_interactions: <EyeOff className="h-4 w-4" strokeWidth={1.5} />,
  };
  return icons[type] || <Zap className="h-4 w-4" strokeWidth={1.5} />;
}

/** Main icon for a spell — based on its primary effect. */
function spellMainIcon(effects: { type: SpellEffectType }[]) {
  return effectIcon(effects[0]?.type || 'lockout');
}

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
              Cast a spell to make it active.
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
                        ? 'bg-brand-muted'
                        : 'bg-surface-elevated/60'
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5">
                            <span className={`${isCast ? 'text-brand' : 'text-muted-foreground'}`}>
                              {spellMainIcon(spell.effects)}
                            </span>
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
                            className="px-2.5 py-0.5 rounded-full bg-accent text-[10px] font-medium text-muted-foreground inline-flex items-center gap-1"
                          >
                            {effectIcon(effect.type)}
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
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {learnedSpells.length === 0 && (
          <section className="px-4 pt-10 text-center">
            <div className="py-8">
              <div className="mb-4 flex justify-center">
                <Zap className="h-8 w-8 text-brand/40" strokeWidth={1.5} />
              </div>
              <h2 className="text-base font-bold text-foreground mb-1.5">No spells yet</h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Browse the spells below to learn and customize your Rose experience.
              </p>
            </div>
          </section>
        )}

        <section className="px-4 pt-10">
          <h2 className="text-base font-bold text-foreground mb-1">Discover Spells</h2>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            Learn a spell to add it to your book.
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
                  className="rounded-2xl bg-surface-elevated/50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="text-muted-foreground">
                          {spellMainIcon(spell.effects)}
                        </span>
                        <h3 className="text-sm font-semibold text-foreground">{spell.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{spell.description}</p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {spell.effects.map((effect) => (
                          <span
                            key={effect.type}
                            className="px-2.5 py-0.5 rounded-full bg-accent text-[10px] font-medium text-muted-foreground inline-flex items-center gap-1"
                          >
                            {effectIcon(effect.type)}
                            {effectLabel(effect.type)}
                          </span>
                        ))}
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
