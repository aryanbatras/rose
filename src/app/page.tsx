'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      router.replace('/feed');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-surface-base">
      <div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" />
    </div>
  );
}
