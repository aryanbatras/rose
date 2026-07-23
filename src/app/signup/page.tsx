'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const error = searchParams.get('error');

  useEffect(() => {
    if (isAuthenticated) router.replace('/feed');
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-surface-base p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold tracking-tight" style={{ color: 'var(--brand)' }}>
            Rose
          </h1>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Create your Bluesky account
            <br />
            directly with Bluesky.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <a
          href="/api/auth/oauth/start"
          className="inline-block w-full rounded-full bg-brand px-6 py-4 text-base font-bold text-black transition-colors hover:bg-brand-hover"
        >
          Create Account
        </a>

        <p className="mt-6 text-sm text-muted-foreground">
          You&apos;ll be taken to Bluesky to choose your handle,
          <br />
          set a password, and verify your account.
        </p>

        <div className="mt-8 space-y-3 text-left">
          {[
            'Pick a handle (yourname.bsky.social)',
            'Set your password',
            'Verify you\'re human',
            'Come back to Rose automatically',
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-surface-elevated px-4 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-xs font-bold" style={{ color: 'var(--brand)' }}>
                {i + 1}
              </span>
              <span className="text-sm text-foreground">{step}</span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Already have an account?{' '}
          <button
            onClick={() => router.push('/login')}
            className="text-blue hover:underline font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface-base">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-brand/60" />
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
