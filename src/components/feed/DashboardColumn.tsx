'use client';

import { useRef, useEffect } from 'react';
import { useFeed } from '@/hooks/useFeed';
import { FeedCardSkeleton } from '@/components/ui/skeleton';
import { useFilterStore } from '@/stores/filter-store';
import { applyFilters } from '@/lib/filters';
import type { FeedSource, FeedItem } from '@/types/atproto';
import { Avatar } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { formatRelativeTime } from '@/lib/time';
import { Play } from 'lucide-react';

interface DashboardColumnProps {
  source: FeedSource;
  label: string;
}

export function DashboardColumn({ source, label }: DashboardColumnProps) {
  const router = useRouter();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useFeed(source);
  const filters = useFilterStore();
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

  const allPosts = data?.pages.flatMap((page: any) => page.items || []) ?? [];
  const seen = new Set<string>();
  const uniquePosts: FeedItem[] = [];
  for (const p of allPosts) {
    if (!seen.has(p.uri)) { seen.add(p.uri); uniquePosts.push(p); }
  }
  const filteredPosts = applyFilters(uniquePosts, { content: filters.content, mute: filters.mute, display: filters.display });

  return (
    <div className="flex-1 min-w-0 border-l border-border first:border-l-0">
      <div className="sticky top-0 z-10 bg-surface-base/95 backdrop-blur-xl border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{label}</h2>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 120px)' }}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <FeedCardSkeleton key={i} />)
        ) : filteredPosts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">No posts</p>
          </div>
        ) : (
          filteredPosts.map((item) => (
            <DashboardPostCard key={item.uri} item={item} router={router} />
          ))
        )}
        <div ref={sentinelRef} className="h-4" />
        {isFetchingNextPage && (
          <div className="py-4 text-center">
            <div className="h-6 w-6 mx-auto animate-pulse rounded-full bg-brand/30" />
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardPostCard({ item, router }: { item: FeedItem; router: any }) {
  const em = item.record.embed;
  const images = em?.images || [];
  const thumbUrl = images[0]?.thumb || images[0]?.fullsize || em?.thumbnail || em?.video?.thumbnail || null;
  const displayName = item.author.displayName || item.author.handle;
  const handle = item.author.handle;

  return (
    <div
      onClick={() => router.push(`/feed/${encodeURIComponent(item.uri)}`)}
      className="px-3 py-2.5 border-b border-border hover:bg-accent/30 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/profile/${handle}`); }}
          className="shrink-0"
        >
          <Avatar src={item.author.avatar} alt={displayName} size="sm" />
        </button>
        <span className="text-xs font-semibold text-foreground truncate">{displayName}</span>
        <span className="text-[11px] text-muted-foreground shrink-0">{formatRelativeTime(item.indexedAt)}</span>
      </div>
      {item.record.text && (
        <p className="text-xs text-foreground line-clamp-3 leading-relaxed mb-1.5">{item.record.text}</p>
      )}
      {thumbUrl && (
        <div className="rounded-lg overflow-hidden mt-1">
          <img src={thumbUrl} alt="" className="w-full h-32 object-cover" loading="lazy" />
        </div>
      )}
      {(item.likeCount > 0 || item.replyCount > 0) && (
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
          {item.likeCount > 0 && <span>{item.likeCount} likes</span>}
          {item.replyCount > 0 && <span>{item.replyCount} replies</span>}
        </div>
      )}
    </div>
  );
}
