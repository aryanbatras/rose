'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useFollows } from '@/hooks/useProfile';
import { Avatar } from '@/components/ui/avatar';
import { FeedCardSkeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function FollowingPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const handle = decodeURIComponent(params.handle as string);
  const { data, isLoading } = useFollows(handle, 'following');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" /></div>;
  }

  return (
    <div className="min-h-[100dvh] bg-surface-base">
      <header className="sticky top-0 z-40 border-b border-border bg-surface-base/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center px-4 py-3">
          <button onClick={() => router.back()} className="text-foreground hover:text-muted-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="ml-3 text-lg font-bold font-heading text-foreground">Following</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg pb-20">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <FeedCardSkeleton key={i} />)
        ) : !data?.items?.length ? (
          <div className="py-20 text-center">
            <p className="text-muted-foreground">Not following anyone yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.items.map((person: any) => (
              <button
                key={person.did}
                onClick={() => router.push(`/profile/${person.handle}`)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors w-full text-left"
              >
                <Avatar src={person.avatar} alt={person.displayName || person.handle} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{person.displayName || person.handle}</p>
                  <p className="text-xs text-muted-foreground truncate">@{person.handle}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
