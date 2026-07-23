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
    if (isAuthenticated) router.replace('/feed');
  }, [isAuthenticated, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const success = await login(identifier, password);
    setIsSubmitting(false);
    if (success) router.replace('/feed');
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-surface-base p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-heading text-3xl font-bold tracking-tight" style={{ color: 'var(--brand)' }}>
            Rose
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Sign in with your Bluesky account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl bg-destructive/10 p-4 text-sm text-destructive" role="alert">
            <p className="font-medium">Sign in failed</p>
            <p className="mt-1">{error}</p>
            {error.toLowerCase().includes('verification') && (
              <p className="mt-2 text-xs text-muted-foreground">
                Bluesky requires email verification. Please verify your email at{' '}
                <a href="https://bsky.app" target="_blank" rel="noopener noreferrer" className="text-blue hover:underline">
                  bsky.app
                </a>{' '}
                first.
              </p>
            )}
          </div>
        )}

        {/* Form */}
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
              className="mt-2 block w-full rounded-xl border border-border bg-surface-elevated px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand"
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
              className="mt-2 block w-full rounded-xl border border-border bg-surface-elevated px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              required
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Don&apos;t have one?{' '}
              <a
                href="https://bsky.app/settings/app-passwords"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue hover:underline"
              >
                Create one in Bluesky Settings
              </a>
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full rounded-full bg-brand px-4 py-3.5 text-sm font-bold text-black transition-colors hover:bg-brand-hover disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don&apos;t have a Bluesky account?{' '}
          <button
            onClick={() => router.push('/signup')}
            className="text-blue hover:underline font-medium"
          >
            Get started
          </button>
        </p>
      </div>
    </div>
  );
}
