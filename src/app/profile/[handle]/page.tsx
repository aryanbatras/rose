'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAuthorFeed } from '@/hooks/useFeed';
import { FeedCard } from '@/components/feed/FeedCard';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileSkeleton, FeedCardSkeleton } from '@/components/ui/skeleton';
import { Navbar } from '@/components/navigation/Navbar';
import { useEffect } from 'react';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const handle = decodeURIComponent(params.handle as string);
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile(handle);
  const { data: feedData, isLoading: feedLoading } = useAuthorFeed(handle);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-[100dvh] bg-surface-base">
        <ProfileSkeleton />
        <Navbar />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-[100dvh] bg-surface-base">
        <header className="border-b border-border bg-surface-base/80">
          <div className="mx-auto flex max-w-lg items-center px-4 py-3">
            <button onClick={() => router.back()} className="text-foreground hover:text-muted-foreground transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="ml-3 text-lg font-bold font-heading">Profile</h1>
          </div>
        </header>
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <p className="text-muted-foreground">User not found</p>
        </main>
        <Navbar />
      </div>
    );
  }

  const posts = feedData?.pages.flatMap((page: any) => page.items || []) ?? [];

  return (
    <div className="min-h-[100dvh] bg-surface-base">
      <header className="sticky top-0 z-40 border-b border-border bg-surface-base/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center px-4 py-3">
          <button onClick={() => router.back()} className="text-foreground hover:text-muted-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="ml-3">
            <h1 className="text-lg font-bold font-heading text-foreground leading-tight">
              {profile.displayName || profile.handle}
            </h1>
            <p className="text-xs text-muted-foreground">{profile.postsCount || 0} posts</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg pb-20">
        <ProfileHeader profile={profile} />

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button className="flex-1 border-b-2 border-brand px-4 py-3 text-sm font-semibold text-foreground">
            Posts
          </button>
        </div>

        {/* Posts */}
        {feedLoading ? (
          Array.from({ length: 3 }).map((_, i) => <FeedCardSkeleton key={i} />)
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">No posts yet</p>
          </div>
        ) : (
          posts.map((item: any, index: number) => (
            <FeedCard
              key={`${item.uri}-${index}`}
              item={item}
              isVoicePost={item.record?.$type === 'voiceflow.voice.post'}
            />
          ))
        )}
      </main>

      <Navbar />
    </div>
  );
}
