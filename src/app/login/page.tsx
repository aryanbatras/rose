'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/feed');
    }
  }, [isAuthenticated, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await login(identifier, password);
    setIsSubmitting(false);
    if (success) {
      router.replace('/feed');
    }
  }

  async function startDemoMode() {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      if (res.ok) {
        // Refresh the page so the session check picks up the demo cookie
        window.location.href = '/feed';
        return;
      }
    } catch {}
    setIsSubmitting(false);
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-surface-base p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            VoiceFlow
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with your Bluesky account
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-foreground">
              Handle or Email
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              spellCheck={false}
              autoCorrect="off"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="your-handle.bsky.social"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              App Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="xxxx-xxxx-xxxx-xxxx"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-surface-base px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <button
          onClick={startDemoMode}
          disabled={isSubmitting || isLoading}
          className="w-full rounded-md border border-border bg-surface-elevated px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        >
          Try Demo Mode
        </button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Demo mode uses mock data. No Bluesky account needed.
        </p>
      </div>
    </div>
  );
}
