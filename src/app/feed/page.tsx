'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useFeed } from '@/hooks/useFeed';
import { useFeedSourceStore } from '@/stores/feed-source-store';
import { useFilterStore } from '@/stores/filter-store';
import { applyFilters } from '@/lib/filters';
import { FeedSourcePicker } from '@/components/feed/FeedSourcePicker';
import { TrendingFeedView } from '@/components/feed/TrendingFeedView';
import { BookmarkButton } from '@/components/feed/BookmarkButton';
import { DownloadButton } from '@/components/feed/DownloadButton';
import { ImageCarousel } from '@/components/feed/ImageCarousel';
import { Play, LayoutGrid } from 'lucide-react';
import type { FeedItem } from '@/types/atproto';

// ─── Relative Time ───────────────────────────────────────────────
function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ─── Single Post Card (icon-free, minimal) ───────────────────────
function PostCard({
  item,
  onLikeToggle,
  liking,
}: {
  item: FeedItem;
  onLikeToggle: (item: FeedItem) => void;
  liking: Set<string>;
}) {
  const router = useRouter();
  const em = item.record.embed;
  const images = em?.images || [];
  const thumbUrl = images[0]?.thumb || images[0]?.fullsize || em?.thumbnail || em?.video?.thumbnail || null;
  const caption = item.record.text || '';
  const displayName = item.author.displayName || item.author.handle;
  const handle = item.author.handle;
  const isVideo = (em?.$type || '').includes('video');
  const isLiked = !!item.viewer?.like;
  const isPending = liking.has(item.uri);
  const timeAgo = relativeTime(item.record.createdAt || item.indexedAt);
  const lastClickRef = useRef<number>(0);

  const openPost = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(`/feed/${encodeURIComponent(item.uri)}`);
    },
    [item.uri, router]
  );

  const handleImageClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const now = Date.now();
      const elapsed = now - lastClickRef.current;
      lastClickRef.current = now;

      if (elapsed < 400 && elapsed > 0) {
        // Double-click → like (don't navigate)
        if (!item.viewer?.like) {
          onLikeToggle(item);
        }
      } else {
        // Single click → open post
        router.push(`/feed/${encodeURIComponent(item.uri)}`);
      }
    },
    [item, onLikeToggle, router]
  );

  return (
    <article className="feed-post feed-enter">
      {/* Author row: avatar + username — compact, tucked in */}
      <div className="flex items-center gap-3 px-1 pb-2.5">
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/profile/${handle}`); }}
          className="h-8 w-8 rounded-full overflow-hidden shrink-0"
          style={{ boxShadow: '0 0 0 2px white, 0 0 0 4px var(--brand-muted)' }}
        >
          {item.author.avatar ? (
            <img src={item.author.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-brand/10 to-brand/5 flex items-center justify-center text-sm font-semibold text-brand/60">
              {displayName[0]?.toUpperCase() || '?'}
            </div>
          )}
        </button>
        <button
          onClick={() => router.push(`/profile/${handle}`)}
          className="font-semibold text-[14px] text-foreground hover:text-brand transition-colors truncate"
        >
          {displayName}
        </button>
      </div>

      {/* Image / Video — generous radius, subtle shadow */}
      <div
        onClick={handleImageClick}
        className="feed-image relative w-full cursor-pointer"
      >
        {thumbUrl ? (
          <>
            {images.length > 1 ? (
              <ImageCarousel
                images={images.map((img: any) => ({ thumb: img.thumb, fullsize: img.fullsize, alt: img.alt || '' }))}
                className="w-full max-h-[90vh]"
              />
            ) : (
              <img
                src={thumbUrl}
                alt=""
                className="w-full max-h-[90vh] object-contain bg-surface-elevated select-none"
                loading="lazy"
                draggable={false}
              />
            )}
            {/* Time overlay — soft pill top-right */}
            <span className="absolute top-3 right-3 text-[11px] font-medium text-white/80 bg-black/25 px-2.5 py-1 rounded-full backdrop-blur-sm z-10">
              {timeAgo}
            </span>
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-14 w-14 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Play className="h-6 w-6 text-white fill-white ml-0.5" strokeWidth={0} />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-brand/5 to-brand/2 rounded-2xl">
            <Play className="h-12 w-12 text-brand/20" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Like count + Bookmark — just text for likes, bookmark icon on the right */}
      {item.likeCount >= 0 && (
        <div className="flex items-center justify-between feed-like">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLikeToggle(item);
            }}
            disabled={isPending}
            className={`transition-all duration-150 disabled:opacity-50 ${
              isLiked ? 'text-destructive' : 'text-foreground hover:text-destructive'
            }`}
          >
            {item.likeCount.toLocaleString()} {item.likeCount === 1 ? 'like' : 'likes'}
          </button>
          <div className="flex items-center gap-2">
            <DownloadButton item={item} />
            <BookmarkButton item={item} />
          </div>
        </div>
      )}

      {/* Caption — spacious, readable, clickable */}
      {caption && (
        <div className="feed-caption">
          <button onClick={openPost} className="text-left w-full">
            <span>
              <span className="font-semibold mr-1.5">{displayName}</span>
              {caption}
            </span>
          </button>
        </div>
      )}
    </article>
  );
}

// ─── Feed Page ───────────────────────────────────────────────────
export default function FeedPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { activeSource } = useFeedSourceStore();
  const filters = useFilterStore();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch } = useFeed(activeSource);
  const isTrending = activeSource?.type === 'trending';
  const [liking, setLiking] = useState<Set<string>>(new Set());
  const [gridMode, setGridMode] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, authLoading, router]);

  // Infinite scroll — observe the last sentinel element
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (isFetchingNextPage || !hasNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleLikeToggle = useCallback(
    async (item: FeedItem) => {
      if (liking.has(item.uri)) return;
      setLiking((prev) => new Set(prev).add(item.uri));

      try {
        if (item.viewer?.like) {
          await fetch('/api/interact/unlike', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ likeUri: item.viewer.like }),
          });
        } else {
          await fetch('/api/interact/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uri: item.uri, cid: item.cid }),
          });
        }
        refetch();
      } catch (e) {
        console.error('Like toggle failed:', e);
      } finally {
        setLiking((prev) => {
          const next = new Set(prev);
          next.delete(item.uri);
          return next;
        });
      }
    },
    [liking, refetch]
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" />
      </div>
    );
  }

  // Deduplicate posts by URI — API sometimes returns duplicates
  const allPosts = data?.pages.flatMap((page: any) => page.items || []) ?? [];
  const seen = new Set<string>();
  const uniquePosts: FeedItem[] = [];
  for (const p of allPosts) {
    if (!seen.has(p.uri)) {
      seen.add(p.uri);
      uniquePosts.push(p);
    }
  }

  // Apply content filters and muted words
  const filteredPosts = applyFilters(uniquePosts, {
    content: filters.content,
    mute: filters.mute,
    display: filters.display,
  });

  // Filter to only media posts (images/video)
  const mediaPosts = filteredPosts.filter((p) => {
    const em = p.record.embed;
    if (!em) return false;
    const t = em.$type || '';
    return t.includes('images') || t.includes('video');
  });

  return (
    <>
      {/* ─── Header ─────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-surface-base/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 h-[56px]">
          <FeedSourcePicker />
          <button
            onClick={() => setGridMode(!gridMode)}
            className={`p-2 rounded-lg transition-colors ${gridMode ? 'bg-brand/10 text-brand' : 'text-muted-foreground hover:bg-accent'}`}
            title={gridMode ? 'Classic view' : 'Grid view'}
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
        </div>
      </header>

      {isTrending ? (
        <TrendingFeedView />
      ) : (
        <>
          {isLoading ? (
            /* ─── Skeletons ───────────────────── */
            <div className="mx-auto max-w-3xl pb-20">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border-b border-border animate-pulse">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="h-8 w-8 rounded-full bg-surface-elevated" />
                    <div className="h-3 w-28 rounded bg-surface-elevated" />
                  </div>
                  <div className="aspect-[4/5] bg-surface-elevated" />
                  <div className="h-4 w-20 bg-surface-elevated rounded mx-4 mt-3 mb-4" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-24 text-center">
              <p className="text-muted-foreground">Could not load this feed</p>
              <button onClick={() => window.location.reload()} className="mt-2 text-sm text-brand hover:underline">
                Try again
              </button>
            </div>
          ) : mediaPosts.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-lg font-medium text-foreground">No posts to show</p>
              <p className="text-sm text-muted-foreground mt-1">Follow some users or pick a feed</p>
            </div>
          ) : gridMode ? (
            /* ─── Grid View: 2-column with search-style design ── */
            <>
              <div className="px-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  {mediaPosts.map((item) => {
                    const em = item.record.embed;
                    const images = em?.images || [];
                    const thumbUrl = images[0]?.thumb || images[0]?.fullsize || em?.thumbnail || em?.video?.thumbnail || null;
                    const isVideo = (em?.$type || '').includes('video');
                    const isMultiImage = images.length > 1;
                    const authorName = item.author.displayName || item.author.handle;

                    return (
                      <div
                        key={item.uri}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(`/feed/${encodeURIComponent(item.uri)}`)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') router.push(`/feed/${encodeURIComponent(item.uri)}`); }}
                        className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface-elevated group cursor-pointer shadow-sm"
                      >
                        {thumbUrl ? (
                          <>
                            <img src={thumbUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" loading="lazy" />
                            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="h-5 w-5 rounded-full overflow-hidden ring-1 ring-white/30 shrink-0">
                                    {item.author.avatar && <img src={item.author.avatar} alt="" className="h-full w-full object-cover" />}
                                  </div>
                                  <span className="text-xs font-semibold text-white truncate drop-shadow-sm">{authorName}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-white/70">
                                  <span>{item.likeCount || 0} likes</span>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/20 to-brand/5">
                            <Play className="h-8 w-8 text-brand/40" strokeWidth={1.5} />
                          </div>
                        )}
                        {isVideo && (
                          <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                            <Play className="h-3 w-3 text-white fill-white ml-0.5" strokeWidth={0} />
                          </div>
                        )}
                        {isMultiImage && (
                          <div className="absolute top-2 left-2 h-5 w-5 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <rect x="3" y="3" width="7" height="7" rx="1" />
                              <rect x="14" y="3" width="7" height="7" rx="1" />
                              <rect x="3" y="14" width="7" height="7" rx="1" />
                              <rect x="14" y="14" width="7" height="7" rx="1" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div ref={sentinelRef} className="h-4" />
              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-brand/70" />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mx-auto max-w-3xl pb-20">
                {mediaPosts.map((item) => (
                  <PostCard
                    key={`${item.uri}-${item.cid}`}
                    item={item}
                    onLikeToggle={handleLikeToggle}
                    liking={liking}
                  />
                ))}
              </div>

              {/* Sentinel for infinite scroll */}
              <div ref={sentinelRef} className="h-4" />

              {isFetchingNextPage && (
                <div className="mx-auto max-w-3xl pb-20">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="border-b border-border animate-pulse">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="h-8 w-8 rounded-full bg-surface-elevated" />
                        <div className="h-3 w-28 rounded bg-surface-elevated" />
                      </div>
                      <div className="aspect-[4/5] bg-surface-elevated" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
