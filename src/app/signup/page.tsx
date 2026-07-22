'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

const STEPS = [
  {
    num: 1,
    title: 'Create a Bluesky Account',
    description: 'Go to bsky.app and sign up with your email and desired handle. It\'s free and takes about a minute.',
    action: { label: 'Go to Bluesky →', href: 'https://bsky.app/signup' },
  },
  {
    num: 2,
    title: 'Generate an App Password',
    description: 'In Bluesky Settings → App Passwords, create a new app password. Name it "VoiceFlow" so you can recognize it. Copy the generated password — it looks like "xxxx-xxxx-xxxx-xxxx".',
    action: { label: 'Open Bluesky Settings', href: 'https://bsky.app/settings/app-passwords' },
  },
  {
    num: 3,
    title: 'Sign In to VoiceFlow',
    description: 'Come back here and sign in using your Bluesky handle (or email) and the app password you just generated. Your regular Bluesky password won\'t work — you must use the app password.',
    action: { label: 'I have an app password →', href: '/login' },
  },
];

export default function SignupPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/feed');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-surface-base p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-bold tracking-tight" style={{ color: 'var(--brand)' }}>
            VoiceFlow
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Get started in 3 simple steps
          </p>
        </div>

        <div className="space-y-6">
          {STEPS.map((step) => (
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

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <button onClick={() => router.push('/login')} className="text-blue hover:underline font-medium">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
