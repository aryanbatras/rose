'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications, useMarkRead } from '@/hooks/useNotifications';
import { NotificationSkeleton } from '@/components/ui/skeleton';
import { formatRelativeTime } from '@/lib/time';
import { Avatar } from '@/components/ui/avatar';

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
      </header>

      <main className="mx-auto max-w-lg pb-20">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <NotificationSkeleton key={i} />)
        ) : error ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">Failed to load notifications</p>
          </div>
        ) : !data?.items?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-muted-foreground/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-lg font-medium text-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              When someone interacts with you, it will show up here
            </p>
          </div>
        ) : (
          data.items.map((item: any, index: number) => (
            <NotificationCard key={`${item.uri}-${index}`} item={item} />
          ))
        )}
      </main>

    </div>
  );
}
