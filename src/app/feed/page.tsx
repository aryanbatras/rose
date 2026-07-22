'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useGSAPScrollAnimation } from '@/hooks/useGSDPScrollAnimation';
import { useAuth } from '@/hooks/useAuth';
import { useFeed } from '@/hooks/useFeed';
import { useViewModeStore } from '@/stores/view-mode-store';
import { useFilterStore } from '@/stores/filter-store';
import { useFeedSourceStore } from '@/stores/feed-source-store';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { FeedCard } from '@/components/feed/FeedCard';
import { BlueskyVideoPlayer } from '@/components/feed/BlueskyVideoPlayer';
import { ViewModeToggle } from '@/components/feed/ViewModeToggle';
import { FilterPanel } from '@/components/feed/FilterPanel';
import { FeedSourcePicker } from '@/components/feed/FeedSourcePicker';
import { StoriesRow } from '@/components/feed/StoriesRow';
import { TrendingFeedView } from '@/components/feed/TrendingFeedView';
import { FeedCardSkeleton } from '@/components/ui/skeleton';
import { Heart, MessageCircle, Play, Image, LayoutGrid, List } from 'lucide-react';
import type { FeedItem } from '@/types/atproto';

function applyClientFilters(posts: FeedItem[], content: any, mute: any): FeedItem[] {
  let filtered = [...posts];
  if (content.hideReposts) filtered = filtered.filter((p) => !p.reason?.$type?.includes('reasonRepost'));
  if (content.hideReplies) filtered = filtered.filter((p) => !p.reply);
  if (content.mediaOnly) filtered = filtered.filter((p) => !!p.record.embed);
  if (content.videoOnly) filtered = filtered.filter((p) => (p.record.embed?.$type || '').includes('video'));
  if (mute.mutedWords.length > 0) {
    const lowerWords = mute.mutedWords.map((w: string) => w.toLowerCase());
    filtered = filtered.filter((p) => !lowerWords.some((w: string) => p.record.text.toLowerCase().includes(w)));
  }
  return filtered;
}

/** Grid view: ONLY shows posts with actual image or video embeds (no links/external cards) */
function GridView({ items }: { items: FeedItem[] }) {
  const router = useRouter();
  // Strictly filter to only images and videos, NOT external links
  const mediaItems = items.filter((p) => {
    const em = p.record.embed;
    if (!em) return false;
    const t = em.$type || '';
    return t.includes('images') || t.includes('video');
  });

  if (mediaItems.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="h-14 w-14 mx-auto rounded-2xl bg-brand/10 flex items-center justify-center mb-3">
          <LayoutGrid className="h-6 w-6 text-brand/50" strokeWidth={1.5} />
        </div>
        <p className="text-base font-medium text-foreground">No media posts to show</p>
        <p className="text-sm text-muted-foreground mt-1">Switch to classic view to see all posts</p>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.03 } } }}
      className="grid grid-cols-2 sm:grid-cols-3 gap-[2px] px-0"
    >
      {mediaItems.map((item) => {
        const em = item.record.embed;
        const images = em?.images || [];
        const thumbUrl = images[0]?.thumb || images[0]?.fullsize || em?.thumbnail || em?.video?.thumbnail || null;
        const authorName = item.author.displayName || item.author.handle;
        const isVideo = (em?.$type || '').includes('video');
        const isMultiImage = images.length > 1;

        return (
          <motion.button
            key={`${item.uri}-${item.cid}`}
            variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}
            onClick={() => router.push(`/feed/${encodeURIComponent(item.uri)}`)}
            className="relative aspect-square overflow-hidden bg-surface-elevated group cursor-pointer"
          >
            {thumbUrl ? (
              <>
                <img src={thumbUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="h-6 w-6 rounded-full overflow-hidden ring-1 ring-white/30 shrink-0">
                        {item.author.avatar && <img src={item.author.avatar} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <span className="text-[13px] font-semibold text-white truncate drop-shadow-sm">{authorName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-white/80">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3.5 w-3.5 fill-current" strokeWidth={0} />
                        {item.likeCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {item.replyCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/20 to-brand/5">
                <Play className="h-10 w-10 text-brand/40" strokeWidth={1.5} />
              </div>
            )}

            {isVideo && (
              <div className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <Play className="h-4 w-4 text-white fill-white" strokeWidth={0} />
              </div>
            )}

            {isMultiImage && (
              <div className="absolute top-2 left-2 h-6 w-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <Image className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, session } = useAuth();
  const { activeSource } = useFeedSourceStore();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useFeed(activeSource);
  const { mode } = useViewModeStore();
  const { content, mute } = useFilterStore();
  const isTrending = activeSource?.type === 'trending';
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  useKeyboardShortcuts({
    onSearch: useCallback(() => router.push('/search'), [router]),
    onCompose: useCallback(() => router.push('/compose'), [router]),
    onEscape: useCallback(() => setShowShortcutHelp(false), []),
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, authLoading, router]);

  useGSAPScrollAnimation('.feed-card', { stagger: 0.06 });

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) fetchNextPage();
      });
      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" /></div>;
  }

  const allPosts = data?.pages.flatMap((page: any) => page.items || []) ?? [];
  const uniquePosts = Array.from(new Map(allPosts.map((p: any) => [p.uri, p])).values());
  const filteredPosts = applyClientFilters(uniquePosts, content, mute);

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface-base/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 h-[56px]">
          <div className="flex items-center gap-2">
            <FeedSourcePicker />
            {mode === 'grid' && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand/10 border border-brand/20">
                <LayoutGrid className="h-3.5 w-3.5 text-brand" />
                <span className="text-[11px] font-semibold text-brand">Grid</span>
              </div>
            )}
            {mode === 'classic' && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue/10 border border-blue/20">
                <List className="h-3.5 w-3.5 text-blue" />
                <span className="text-[11px] font-semibold text-blue">Classic</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ViewModeToggle />
            <button
              onClick={() => setShowShortcutHelp(!showShortcutHelp)}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all duration-200 hidden sm:block"
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
            >
              <span className="text-xs font-bold font-mono">?</span>
            </button>
          </div>
        </div>
      </header>

      {/* Render TrendingFeedView when trending source is active */}
      {isTrending ? (
        <TrendingFeedView />
      ) : (
        <>
          {mode === 'grid' && (
            <div className="border-b border-border/40">
              <StoriesRow />
            </div>
          )}
        </>
      )}

      {showShortcutHelp && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowShortcutHelp(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowShortcutHelp(false)}>
            <div className="bg-surface-elevated border border-border rounded-xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-bold mb-4">Keyboard Shortcuts</h2>
              <div className="space-y-2">
                {[
                  { key: 'j', desc: 'Next post' },
                  { key: 'k', desc: 'Previous post' },
                  { key: 'l', desc: 'Like post' },
                  { key: '/', desc: 'Focus search' },
                  { key: 'n', desc: 'New post' },
                  { key: '1', desc: 'Grid view' },
                  { key: '2', desc: 'Classic view' },
                  { key: 'Esc', desc: 'Close modals' },
                  { key: '?', desc: 'Show help' },
                ].map(({ key, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{desc}</span>
                    <kbd className="px-2 py-0.5 rounded bg-accent text-xs text-muted-foreground font-mono">{key}</kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {!isTrending && (
        <>
          {isLoading ? (
            <div className="space-y-0">
              {Array.from({ length: 8 }).map((_, i) => <FeedCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <p className="text-muted-foreground">Failed to load feed</p>
              <button onClick={() => window.location.reload()} className="mt-2 text-sm text-brand hover:underline">Try again</button>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg font-medium text-foreground">
                {mode === 'grid' && uniquePosts.length > 0
                  ? 'No media posts in your feed'
                  : uniquePosts.length > 0
                    ? 'No posts match your filters'
                    : 'Welcome to Rose!'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === 'grid' && uniquePosts.length > 0
                  ? 'Switch to classic view to see text posts and links'
                  : uniquePosts.length > 0
                    ? 'Try adjusting your filters'
                    : 'Follow some users to see their posts here'}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {mode === 'classic' && (
                  <div>
                    {filteredPosts.map((item: any, index: number) => (
                      <FeedCard key={`${item.uri}-${item.cid || index}`} item={item} reason={item.reason} />
                    ))}
                  </div>
                )}
                {mode === 'grid' && <GridView items={filteredPosts} />}
              </motion.div>
              <div ref={loadMoreRef} className="py-8">
                {isFetchingNextPage && Array.from({ length: 3 }).map((_, i) => <FeedCardSkeleton key={i} />)}
              </div>
            </AnimatePresence>
          )}
        </>
      )}
    </>
  );
}
