'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { GroupInfo, MessageView, BasicProfileView } from '@/types/chat';
import { Avatar } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { formatRelativeTime } from '@/lib/time';

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const convoId = params?.id as string;
  const { isAuthenticated, isLoading: authLoading, session } = useAuth();

  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [messages, setMessages] = useState<MessageView[]>([]);
  const [members, setMembers] = useState<BasicProfileView[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch group data
  useEffect(() => {
    if (!isAuthenticated || !convoId) return;
    async function load() {
      try {
        const [groupRes, membersRes, msgsRes] = await Promise.all([
          fetch(`/api/groups/${convoId}`),
          fetch(`/api/groups/${convoId}?scope=members`),
          fetch(`/api/groups/${convoId}?scope=messages&limit=50`),
        ]);

        if (groupRes.ok) {
          const groupData = await groupRes.json();
          setGroup(groupData.group);
        }
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers(membersData.members || []);
        }
        if (msgsRes.ok) {
          const msgsData = await msgsRes.json();
          setMessages(msgsData.messages || []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [isAuthenticated, convoId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, authLoading, router]);

  const handleSend = useCallback(async () => {
    const text = messageText.trim();
    if (!text || sending || !convoId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/groups/${convoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
          setMessageText('');
        }
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to send');
      }
    } catch {
      toast.error('Connection error');
    }
    setSending(false);
  }, [messageText, sending, convoId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" />
      </div>
    );
  }

  // Get sender profile from DID
  const getSenderProfile = (did: string) => {
    const allProfiles = [...members, group?.members?.find((m) => m.did === did)].filter(Boolean);
    return allProfiles.find((p) => p?.did === did);
  };

  return (
    <div className="flex flex-col min-h-[100dvh]">
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

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-foreground truncate">
              {group?.name || 'Loading...'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {group ? `${group.memberCount} members` : ''}
            </p>
          </div>

          {/* Members avatars */}
          <div className="flex -space-x-1.5">
            {members.slice(0, 5).map((member) => (
              <div
                key={member.did}
                className="h-8 w-8 rounded-full border-2 border-surface-base overflow-hidden"
              >
                {member.avatar ? (
                  <img src={member.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-accent flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {(member.displayName || member.handle || '?')[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
      >
        {loading ? (
          <div className="space-y-4 py-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`flex items-end gap-2 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                <div className="h-8 w-8 animate-pulse rounded-full bg-muted shrink-0" />
                <div className={`space-y-1.5 ${i % 2 === 0 ? '' : 'items-end flex flex-col'}`}>
                  <div className={`h-8 w-48 animate-pulse rounded-2xl bg-muted`} />
                  <div className="h-3 w-12 animate-pulse rounded bg-muted/50" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender.did === session?.did;
            const sender = getSenderProfile(msg.sender.did);
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                {!isOwn && (
                  <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 bg-accent">
                    {sender?.avatar ? (
                      <img src={sender.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {(sender?.displayName || sender?.handle || '?')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className={`max-w-[75%] ${isOwn ? 'items-end' : ''} flex flex-col`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isOwn
                        ? 'bg-brand text-black rounded-br-md'
                        : 'bg-surface-elevated text-foreground rounded-bl-md'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <p className={`text-[10px] text-muted-foreground mt-0.5 px-1 ${isOwn ? 'text-right' : ''}`}>
                    {formatRelativeTime(msg.sentAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="sticky bottom-0 bg-surface-base border-t border-border px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            maxLength={1000}
            className="flex-1 resize-none rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand transition-colors min-h-[44px] max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={sending || !messageText.trim()}
            className="px-5 py-2.5 rounded-xl bg-brand text-black text-sm font-semibold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-[44px] flex items-center justify-center"
          >
            {sending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
