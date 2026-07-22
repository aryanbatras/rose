'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { JoinLinkPreview } from '@/types/chat';
import { Avatar } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function JoinGroupPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, session } = useAuth();

  const [code, setCode] = useState('');
  const [preview, setPreview] = useState<JoinLinkPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinResult, setJoinResult] = useState<'joined' | 'pending' | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, authLoading, router]);

  const handlePreview = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setPreviewLoading(true);
    setPreview(null);
    setJoinResult(null);
    try {
      const res = await fetch(`/api/groups/preview?codes=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = await res.json();
        const previews: JoinLinkPreview[] = data.previews || [];
        if (previews.length > 0) {
          setPreview(previews[0]);
          if (previews[0].status === 'invalid') {
            toast.error('This invite code is invalid or has expired.');
          } else if (previews[0].status === 'disabled') {
            toast.error('This invite link has been disabled by the group owner.');
          }
        } else {
          toast.error('Could not find any group with this code.');
        }
      } else {
        toast.error('Failed to look up invite code.');
      }
    } catch {
      toast.error('Connection error.');
    }
    setPreviewLoading(false);
  }, [code]);

  const handleJoin = useCallback(async () => {
    if (!code.trim() || joining || !preview || preview.status !== 'valid') return;
    setJoining(true);
    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        const status = data.result?.status;
        setJoinResult(status);
        if (status === 'joined') {
          toast.success('You have joined the group!');
        } else if (status === 'pending') {
          toast.success('Join request sent! Waiting for approval.');
        }
      } else {
        toast.error(data.error || 'Failed to join group.');
      }
    } catch {
      toast.error('Connection error.');
    }
    setJoining(false);
  }, [code, joining, preview]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (preview && preview.status === 'valid') {
        handleJoin();
      } else {
        handlePreview();
      }
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-base/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => router.push('/groups')}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            aria-label="Back to groups"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <h1 className="text-lg font-bold font-heading text-foreground">Join Group</h1>
        </div>
      </header>

      <main className="px-4 pt-6">
        {/* Code input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Enter an invite code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setPreview(null);
                setJoinResult(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Paste invite code here..."
              className="flex-1 rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand transition-colors"
              autoFocus
            />
            <button
              onClick={handlePreview}
              disabled={previewLoading || !code.trim()}
              className="px-5 py-3 rounded-xl bg-brand text-black text-sm font-semibold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {previewLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                'Lookup'
              )}
            </button>
          </div>
        </div>

        {/* Preview card */}
        {preview && preview.status === 'valid' && (
          <div className="rounded-xl border border-border bg-surface-elevated p-5 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-2xl bg-brand/15 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-foreground truncate">
                  {preview.name || 'Unnamed Group'}
                </h2>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span>{preview.memberCount ?? 0} members</span>
                  {preview.memberLimit && (
                    <span>· {preview.memberLimit} max</span>
                  )}
                </div>
                {preview.owner && (
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar
                      src={preview.owner.avatar}
                      alt={preview.owner.handle}
                      size="sm"
                    />
                    <span className="text-xs text-muted-foreground">
                      {preview.owner.displayName || preview.owner.handle}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Info chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {preview.requireApproval && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Requires Approval
                </span>
              )}
              {preview.joinRule && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-medium">
                  {preview.joinRule === 'anyone' ? 'Open to anyone' :
                   preview.joinRule === 'member_invite' ? 'Members can invite' :
                   'Owner invite only'}
                </span>
              )}
            </div>

            {/* Join button */}
            {joinResult ? (
              <div className="text-center py-3">
                {joinResult === 'joined' ? (
                  <div className="flex flex-col items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-semibold text-foreground">You are now a member!</p>
                    <button
                      onClick={() => preview.convoId && router.push(`/groups/${preview.convoId}`)}
                      className="mt-2 px-5 py-2 rounded-xl bg-brand text-black text-sm font-semibold hover:bg-brand-hover transition-colors"
                    >
                      Open Group
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-semibold text-foreground">Join request sent!</p>
                    <p className="text-xs text-muted-foreground">Waiting for approval from the group owner.</p>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full py-3 rounded-xl bg-brand text-black text-sm font-semibold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {joining ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    <span>Joining...</span>
                  </div>
                ) : (
                  `Join ${preview.name || 'Group'}`
                )}
              </button>
            )}
          </div>
        )}

        {/* Invalid/Disabled state */}
        {preview && (preview.status === 'invalid' || preview.status === 'disabled') && (
          <div className="rounded-xl border border-border bg-surface-elevated p-8 mb-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <p className="text-muted-foreground">
              {preview.status === 'invalid'
                ? 'This invite code is invalid or has expired.'
                : 'This invite link has been disabled by the group owner.'}
            </p>
          </div>
        )}

        {/* Tips */}
        {!preview && (
          <div className="rounded-xl border border-border/50 bg-surface-elevated/50 p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2">How to join a group</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                <span>Get an invite code from the group owner or a member.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                <span>Paste the code above and tap &quot;Lookup&quot; to preview the group.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                <span>If the group requires approval, the owner will need to accept your request.</span>
              </li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
