'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, session, logout } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/login');
  };

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
        <div className="mx-auto flex max-w-lg items-center px-4 py-3">
          <button onClick={() => router.back()} className="text-foreground hover:text-muted-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <h1 className="ml-3 text-lg font-bold font-heading text-foreground">Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg pb-20">
        <div className="divide-y divide-border">
          {/* Account */}
          <section className="px-4 py-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">Account</h2>
            <div className="space-y-1">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground">Handle</span>
                <span className="text-sm text-muted-foreground">{session?.handle}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-foreground">DID</span>
                <span className="text-sm text-muted-foreground font-mono text-xs">
                  {session?.did?.slice(0, 20)}...
                </span>
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section className="px-4 py-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">Preferences</h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-foreground">Dark Mode</span>
                <div className="h-5 w-9 rounded-full bg-muted cursor-pointer">
                  <div className="h-5 w-5 rounded-full bg-brand shadow-sm ml-auto" />
                </div>
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-foreground">Voice Auto-play</span>
                <div className="h-5 w-9 rounded-full bg-muted cursor-pointer">
                  <div className="h-5 w-5 rounded-full bg-muted-foreground shadow-sm" />
                </div>
              </label>
            </div>
          </section>

          {/* About */}
          <section className="px-4 py-4">
            <h2 className="text-sm font-semibold text-foreground mb-3">About</h2>
            <p className="text-sm text-muted-foreground">
              VoiceFlow v1.0.0 — A social network that listens.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Built on the AT Protocol. Powered by Bluesky.
            </p>
          </section>

          {/* Logout */}
          <section className="px-4 py-6">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </section>
        </div>
      </main>

    </div>
  );
}
