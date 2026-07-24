'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAuthorFeed, useLikedPosts } from '@/hooks/useFeed';
import { FeedCard } from '@/components/feed/FeedCard';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileSkeleton, FeedCardSkeleton } from '@/components/ui/skeleton';
import { useEffect, useState, useRef, useCallback } from 'react';
import type { FeedItem } from '@/types/atproto';

type ProfileTab = 'posts' | 'replies' | 'media' | 'likes';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, session } = useAuth();
  const handle = decodeURIComponent(params.handle as string);
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile(handle);
  const { data: feedData, isLoading: feedLoading, fetchNextPage: fetchNextFeed, hasNextPage: hasNextFeed, isFetchingNextPage: isFetchingNextFeed } = useAuthorFeed(handle);
  const { data: likedData, isLoading: likedLoading, fetchNextPage: fetchNextLiked, hasNextPage: hasNextLiked, isFetchingNextPage: isFetchingNextLiked } = useLikedPosts(handle);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');

  const isOwnProfile = session?.handle === handle || session?.did === profile?.did;

  useEffect(() => {
    // Guests can browse profiles
  }, [isAuthenticated, authLoading, router]);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (activeTab === 'likes' ? isFetchingNextLiked : isFetchingNextFeed) return;
    if (activeTab === 'likes' ? !hasNextLiked : !hasNextFeed) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (activeTab === 'likes') fetchNextLiked();
          else fetchNextFeed();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeTab, hasNextFeed, hasNextLiked, isFetchingNextFeed, isFetchingNextLiked, fetchNextFeed, fetchNextLiked]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-[100dvh] bg-surface-base">
        <ProfileSkeleton />
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
      </div>
    );
  }

  const allPosts = feedData?.pages.flatMap((page: any) => page.items || []) ?? [];
  const allLiked = likedData?.pages.flatMap((page: any) => page.items || []) ?? [];

  // Deduplicate
  const seen = new Set<string>();
  const posts: FeedItem[] = [];
  for (const p of allPosts) {
    if (!seen.has(p.uri)) { seen.add(p.uri); posts.push(p); }
  }

  // Filter by tab
  const replies = posts.filter((p) => !!p.reply);
  const mediaPosts = posts.filter((p) => {
    const em = p.record.embed;
    if (!em) return false;
    const t = em.$type || '';
    return t.includes('images') || t.includes('video');
  });

  const tabs: { key: ProfileTab; label: string }[] = [
    { key: 'posts', label: 'Posts' },
    { key: 'replies', label: 'Replies' },
    { key: 'media', label: 'Media' },
    { key: 'likes', label: 'Likes' },
  ];

  const renderTabContent = () => {
    if (activeTab === 'likes') {
      if (likedLoading) return Array.from({ length: 3 }).map((_, i) => <FeedCardSkeleton key={i} />);
      if (allLiked.length === 0) return <div className="py-16 text-center"><p className="text-muted-foreground">No liked posts yet</p></div>;
      return allLiked.map((item: any, index: number) => (
        <FeedCard key={`${item.uri}-${index}`} item={item} />
      ));
    }

    if (feedLoading) return Array.from({ length: 3 }).map((_, i) => <FeedCardSkeleton key={i} />);

    let items: FeedItem[];
    if (activeTab === 'replies') items = replies;
    else if (activeTab === 'media') items = mediaPosts;
    else items = posts;

    if (items.length === 0) {
      const emptyMsg = activeTab === 'replies' ? 'No replies yet' : activeTab === 'media' ? 'No media posts yet' : 'No posts yet';
      return <div className="py-16 text-center"><p className="text-muted-foreground">{emptyMsg}</p></div>;
    }

    return items.map((item: any, index: number) => (
      <FeedCard key={`${item.uri}-${index}`} item={item} hideAvatar={isOwnProfile} />
    ));
  };

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
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'border-brand text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {renderTabContent()}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" />

        {(activeTab === 'likes' ? isFetchingNextLiked : isFetchingNextFeed) && (
          <div className="mx-auto max-w-lg pb-8">
            {Array.from({ length: 2 }).map((_, i) => <FeedCardSkeleton key={i} />)}
          </div>
        )}
      </main>
    </div>
  );
}
