'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications, useMarkRead } from '@/hooks/useNotifications';
import { NotificationSkeleton } from '@/components/ui/skeleton';
import { formatRelativeTime } from '@/lib/time';
import { Avatar } from '@/components/ui/avatar';
import { Bell } from 'lucide-react';

type NotificationFilter = 'all' | 'likes' | 'reposts' | 'follows' | 'mentions' | 'replies';

const FILTER_TABS: { key: NotificationFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'likes', label: 'Likes' },
  { key: 'reposts', label: 'Reposts' },
  { key: 'follows', label: 'Follows' },
  { key: 'mentions', label: 'Mentions' },
  { key: 'replies', label: 'Replies' },
];

const REASON_MAP: Record<string, NotificationFilter> = {
  like: 'likes',
  repost: 'reposts',
  follow: 'follows',
  mention: 'mentions',
  reply: 'replies',
  quote: 'replies',
};

function NotificationCard({ item }: { item: any }) {
  const router = useRouter();
  const authorDisplay = item.author.displayName || item.author.handle;
  const timeAgo = formatRelativeTime(item.indexedAt);

  const reasonLabels: Record<string, string> = {
    like: 'liked your post',
    repost: 'reposted your post',
    follow: 'followed you',
    mention: 'mentioned you',
    reply: 'replied to your post',
    quote: 'quoted your post',
  };

  return (
    <div
      onClick={() => {
        if (item.reason === 'follow') {
          router.push(`/profile/${item.author.handle}`);
        } else if (item.reasonSubject) {
          router.push(`/feed/${encodeURIComponent(item.reasonSubject)}`);
        }
      }}
      className={`flex items-start gap-3 px-4 py-3 border-b border-border transition-colors hover:bg-accent/30 active:bg-accent/50 cursor-pointer ${
        !item.isRead ? 'bg-brand-muted/30' : ''
      }`}
    >
      <Avatar
        src={item.author.avatar}
        alt={authorDisplay}
        size="md"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">
          <span className="font-semibold">{authorDisplay}</span>
          {' '}{reasonLabels[item.reason] || 'interacted with your post'}
        </p>
        {'text' in (item.record || {}) && (item.record as any)?.text && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {(item.record as any).text}
          </p>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">{timeAgo}</p>
      </div>
      {!item.isRead && (
        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" />
      )}
    </div>
  );
}



export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, isLoading, error } = useNotifications();
  const markRead = useMarkRead();
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (data?.items?.length > 0) {
      const hasUnread = data.items.some((n: any) => !n.isRead);
      if (hasUnread) {
        markRead.mutate();
      }
    }
  }, [data]);

  const filteredItems = data?.items?.filter((item: any) => {
    if (activeFilter === 'all') return true;
    return REASON_MAP[item.reason] === activeFilter;
  }) ?? [];

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
          <h1 className="text-lg font-bold font-heading text-foreground">Notifications</h1>
        </div>
        {/* Filter tabs */}
        <div className="flex border-t border-border overflow-x-auto scrollbar-none">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex-1 min-w-0 px-3 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                activeFilter === tab.key
                  ? 'text-brand border-b-2 border-brand'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-lg pb-20">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <NotificationSkeleton key={i} />)
        ) : error ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">Failed to load notifications</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/30 mb-4" strokeWidth={1} />
            <p className="text-lg font-medium text-foreground">
              {activeFilter === 'all' ? 'No notifications yet' : `No ${activeFilter} yet`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {activeFilter === 'all'
                ? 'When someone interacts with you, it will show up here'
                : 'Check back later'}
            </p>
          </div>
        ) : (
          filteredItems.map((item: any, index: number) => (
            <NotificationCard key={`${item.uri}-${index}`} item={item} />
          ))
        )}
      </main>

    </div>
  );
}
