'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSuggestions } from '@/hooks/useProfile';
import { Avatar } from '@/components/ui/avatar';
import { FeedCardSkeleton } from '@/components/ui/skeleton';

export default function DiscoverPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: suggestions, isLoading } = useSuggestions();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface-base">
        <div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-surface-base">
      <header className="sticky top-0 z-40 border-b border-border bg-surface-base/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold font-heading text-foreground">Discover</h1>
          <button
            onClick={() => router.push('/search')}
            className="text-brand hover:text-brand-hover transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg pb-20">
        {/* Suggested users */}
        <section className="px-4 pt-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">Suggested for you</h2>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : !suggestions?.length ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No suggestions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Follow more users to get better suggestions
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {suggestions.map((s: any) => (
                <button
                  key={s.did}
                  onClick={() => router.push(`/profile/${s.handle}`)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/30"
                >
                  <Avatar
                    src={s.avatar}
                    alt={s.displayName || s.handle}
                    size="md"
                  />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-foreground">
                      {s.displayName || s.handle}
                    </p>
                    <p className="text-xs text-muted-foreground">@{s.handle}</p>
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {s.count} mutual
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Trending tags placeholder */}
        <section className="px-4 pt-8">
          <h2 className="text-sm font-semibold text-foreground mb-3">Trending</h2>
          <div className="rounded-lg border border-border bg-surface-elevated p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Trending topics coming soon
            </p>
          </div>
        </section>
      </main>

    </div>
  );
}
