'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Avatar } from '@/components/ui/avatar';
import { useRef, useState, useEffect } from 'react';

interface FollowingProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

export function StoriesRow() {
  const router = useRouter();
  const { session } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data: followData } = useQuery({
    queryKey: ['following-stories', session?.did],
    queryFn: async () => {
      if (!session) return null;
      const handle = session.handle;
      const res = await fetch(`/api/graph/following?actor=${encodeURIComponent(handle)}&limit=20`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!session,
    staleTime: 60_000,
  });

  // API returns { items: [...], cursor: ... }
  const profiles: FollowingProfile[] = followData?.items ?? [];

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll);
    checkScroll();
    return () => el.removeEventListener('scroll', checkScroll);
  }, [profiles]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 280;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (!profiles.length && !session) return null;

  return (
    <div className="relative px-2 py-3">
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-md flex items-center justify-center hover:bg-accent transition-colors"
          aria-label="Scroll left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-md flex items-center justify-center hover:bg-accent transition-colors"
          aria-label="Scroll right"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex items-center gap-4 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Your own story ring */}
        <button
          onClick={() => session?.handle && router.push(`/profile/${session.handle}`)}
          className="flex flex-col items-center gap-1.5 snap-start shrink-0 group"
        >
          <div className="relative">
            <div className="h-[60px] w-[60px] rounded-full p-[3px] bg-gradient-to-br from-brand/60 via-brand to-yellow-500/60 group-hover:scale-105 transition-transform duration-200">
              <div className="h-full w-full rounded-full bg-surface-base p-[2px]">
                <Avatar
                  alt="You"
                  size="lg"
                  className="h-full w-full rounded-full object-cover ring-0"
                />
              </div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-blue flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium truncate w-16 text-center">You</span>
        </button>

        {profiles.slice(0, 19).map((profile) => (
          <button
            key={profile.did}
            onClick={() => router.push(`/profile/${profile.handle}`)}
            className="flex flex-col items-center gap-1.5 snap-start shrink-0 group"
          >
            <div className="relative">
              <div className="h-[60px] w-[60px] rounded-full p-[3px] bg-gradient-to-br from-brand/40 via-blue/40 to-purple-500/40 group-hover:from-brand/60 group-hover:via-blue/60 group-hover:to-purple-500/60 transition-all duration-300">
                <div className="h-full w-full rounded-full bg-surface-base p-[2px]">
                  <Avatar
                    src={profile.avatar}
                    alt={profile.displayName || profile.handle}
                    size="lg"
                    className="h-full w-full rounded-full object-cover ring-0"
                  />
                </div>
              </div>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium truncate w-16 text-center">
              {profile.displayName || profile.handle.replace('.bsky.social', '').slice(0, 10)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
