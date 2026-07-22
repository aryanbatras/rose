'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth-store';

const GUIDE_STEPS = [
  {
    num: 1,
    title: 'Create a Bluesky Account',
    description: 'Go to bsky.app and sign up with your email and desired handle. It\'s free and takes about a minute.',
    action: { label: 'Go to Bluesky →', href: 'https://bsky.app/signup' },
  },
  {
    num: 2,
    title: 'Generate an App Password',
    description: 'In Bluesky Settings → App Passwords, create a new app password. Name it "Rose" so you can recognize it. Copy the generated password — it looks like "xxxx-xxxx-xxxx-xxxx".',
    action: { label: 'Open Bluesky Settings', href: 'https://bsky.app/settings/app-passwords' },
  },
  {
    num: 3,
    title: 'Sign In to Rose',
    description: 'Come back here and sign in using your Bluesky handle (or email) and the app password you just generated.',
    action: { label: 'I have an app password →', href: '/login' },
  },
];

export default function SignupPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<'direct' | 'guide'>('direct');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/feed');
    }
  }, [isAuthenticated, router]);

  async function handleDirectSignup(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: handle.trim(), email: email.trim(), password, inviteCode: inviteCode.trim() || undefined }),
      });

      const data = await res.json();

      if (res.ok && data.session) {
        // Auto-login: store session in Zustand
        useAuthStore.getState().setSession(data.session);
        setSuccess(true);
        setTimeout(() => router.replace('/feed'), 1000);
      } else {
        setError(data.error || 'Account creation failed');
        // If Entryway blocked it, switch to guide mode
        if (data.error?.toLowerCase().includes('direct signup') ||
            data.error?.toLowerCase().includes('bsky.app')) {
          setMode('guide');
        }
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface-base p-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground">Account created!</h2>           <p className="mt-1 text-sm text-muted-foreground">Welcome to Rose. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-surface-base p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-bold tracking-tight" style={{ color: 'var(--brand)' }}>
            Rose
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === 'direct' ? 'Create your Bluesky account' : 'Get started in 3 simple steps'}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="mb-6 flex rounded-lg border border-border p-1">
          <button
            onClick={() => { setMode('direct'); setError(null); }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === 'direct' ? 'bg-brand text-black' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Quick signup
          </button>
          <button
            onClick={() => { setMode('guide'); setError(null); }}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === 'guide' ? 'bg-brand text-black' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Step-by-step guide
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            {error}
          </div>
        )}

        {mode === 'direct' ? (
          <form onSubmit={handleDirectSignup} className="space-y-4">
            <div>
              <label htmlFor="handle" className="block text-sm font-medium text-foreground">
                Handle
              </label>
              <input
                id="handle"
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="yourname.bsky.social"
                autoComplete="username"
                spellCheck={false}
                autoCorrect="off"
                className="mt-1 block w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="mt-1 block w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className="mt-1 block w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                required
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-foreground">
                Invite Code <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Only if you have one"
                autoComplete="off"
                className="mt-1 block w-full rounded-lg border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-brand px-4 py-3 text-sm font-bold text-black transition-colors hover:bg-brand-hover disabled:opacity-50"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              By creating an account, you agree to the <a href="https://bsky.app/social-safety-tos" target="_blank" rel="noopener noreferrer" className="text-blue hover:underline">Bluesky Terms of Service</a>.
            </p>
          </form>
        ) : (
          <div className="space-y-4">
            {GUIDE_STEPS.map((step) => (
              <div
                key={step.num}
                className="rounded-xl border border-border bg-surface-elevated p-5 transition-colors hover:border-brand/30"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/20 text-sm font-bold" style={{ color: 'var(--brand)' }}>
                    {step.num}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                    {step.action.href.startsWith('http') ? (
                      <a
                        href={step.action.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue hover:text-blue-hover transition-colors"
                      >
                        {step.action.label}
                      </a>
                    ) : (
                      <button
                        onClick={() => router.push(step.action.href)}
                        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue hover:text-blue-hover transition-colors"
                      >
                        {step.action.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <button onClick={() => router.push('/login')} className="text-blue hover:underline font-medium">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
