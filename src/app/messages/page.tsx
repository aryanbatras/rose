'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function MessagesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

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
          <h1 className="text-lg font-bold font-heading text-foreground">Messages</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg pb-20">
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-muted-foreground/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-lg font-medium text-foreground">No messages yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Direct messaging coming soon with Bluesky DMs
          </p>
        </div>
      </main>

    </div>
  );
}
