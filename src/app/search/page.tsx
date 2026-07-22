'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDebouncedSearch, useSearchPosts, useSearchActors } from '@/hooks/useSearch';
import { FeedCard } from '@/components/feed/FeedCard';
import { Avatar } from '@/components/ui/avatar';
import { FeedCardSkeleton } from '@/components/ui/skeleton';
import { Navbar } from '@/components/navigation/Navbar';

export default function SearchPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { query, setQuery, debouncedQuery } = useDebouncedSearch(300);
  const [tab, setTab] = useState<'top' | 'people' | 'posts'>('top');

  const { data: postsData, isLoading: postsLoading } = useSearchPosts(debouncedQuery);
  const { data: actorsData, isLoading: actorsLoading } = useSearchActors(debouncedQuery);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const posts = postsData?.items || [];
  const actors = actorsData || [];
  const isLoading = postsLoading || actorsLoading;

  return (
    <div className="min-h-[100dvh] bg-surface-base">
      <header className="sticky top-0 z-40 border-b border-border bg-surface-base/80 backdrop-blur-lg">
        <div className="mx-auto max-w-lg px-4 py-3">
          <h1 className="text-lg font-bold font-heading text-foreground mb-3">Search</h1>
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts and people..."
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
              autoComplete="off"
            />
          </div>
        </div>

        {/* Tabs */}
        {debouncedQuery.trim().length >= 2 && (
          <div className="flex border-b border-border">
            {(['top', 'people', 'posts'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                  tab === t
                    ? 'border-b-2 border-brand text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-lg pb-20">
        {!debouncedQuery.trim() ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-muted-foreground/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-lg font-medium text-foreground">Find people and posts</p>
            <p className="text-sm text-muted-foreground mt-1">
              Search for users or posts across the network
            </p>
          </div>
        ) : isLoading ? (
          tab === 'posts' ? (
            Array.from({ length: 3 }).map((_, i) => <FeedCardSkeleton key={i} />)
          ) : (
            <div className="space-y-1 px-4 pt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <>
            {(tab === 'top' || tab === 'people') && actors.length > 0 && (
              <div className="px-4 pt-4">
                {(tab === 'top') && <h2 className="mb-2 text-sm font-semibold text-foreground">People</h2>}
                <div className="space-y-1">
                  {actors.map((actor: any) => (
                    <button
                      key={actor.did}
                      onClick={() => router.push(`/profile/${actor.handle}`)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/30"
                    >
                      <Avatar
                        src={actor.avatar}
                        alt={actor.displayName || actor.handle}
                        size="md"
                      />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-foreground">
                          {actor.displayName || actor.handle}
                        </p>
                        <p className="text-xs text-muted-foreground">@{actor.handle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(tab === 'top' || tab === 'posts') && posts.length > 0 && (
              <div>
                {(tab === 'top') && actors.length > 0 && (
                  <div className="border-t border-border mt-2">
                    <h2 className="px-4 pt-4 pb-2 text-sm font-semibold text-foreground">Posts</h2>
                  </div>
                )}
                {posts.map((item: any, index: number) => (
                  <FeedCard
                    key={`${item.uri}-${index}`}
                    item={item}
                    isVoicePost={item.record?.$type === 'voiceflow.voice.post'}
                  />
                ))}
              </div>
            )}

            {posts.length === 0 && actors.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-muted-foreground">No results for &ldquo;{debouncedQuery}&rdquo;</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different search</p>
              </div>
            )}
          </>
        )}
      </main>

      <Navbar />
    </div>
  );
}
