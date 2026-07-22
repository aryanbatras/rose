'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useGroupNameStore } from '@/stores/group-name-store';
import type { GroupInfo, MessageView, BasicProfileView, JoinLink, JoinRequestView } from '@/types/chat';
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

  // ── Invite link management ─────────────────────────────────────────
  const [showInvite, setShowInvite] = useState(false);
  const [joinLink, setJoinLink] = useState<JoinLink | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  // ── Member management ──────────────────────────────────────────────
  const [showMembers, setShowMembers] = useState(false);
  const [addMemberInput, setAddMemberInput] = useState('');
  const [memberActionLoading, setMemberActionLoading] = useState(false);

  // ── Pending join requests ───────────────────────────────────────────
  const [pendingRequests, setPendingRequests] = useState<JoinRequestView[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);

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
          // Apply stored name on top of API data (Bluesky ConvoView lacks name)
          const name = useGroupNameStore.getState().names[convoId];
          if (groupData.group && name) {
            groupData.group.name = name;
          }
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

  // ── Invite link actions ─────────────────────────────────────────────
  const handleCreateInviteLink = useCallback(async () => {
    if (!convoId || inviteLoading) return;
    setInviteLoading(true);
    try {
      const res = await fetch(`/api/groups/${convoId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', joinRule: 'anyone', requireApproval: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setJoinLink(data.joinLink);
        toast.success('Invite link created!');
      } else {
        toast.error(data.error || 'Failed to create invite link');
      }
    } catch {
      toast.error('Connection error');
    }
    setInviteLoading(false);
  }, [convoId, inviteLoading]);

  const handleToggleInviteLink = useCallback(async () => {
    if (!convoId || inviteLoading || !joinLink) return;
    setInviteLoading(true);
    const action = joinLink.enabledStatus === 'enabled' ? 'disable' : 'enable';
    try {
      const res = await fetch(`/api/groups/${convoId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        if (action === 'disable') {
          setJoinLink((prev) => prev ? { ...prev, enabledStatus: 'disabled' } : null);
          toast.success('Invite link disabled');
        } else {
          setJoinLink(data.joinLink || { ...joinLink, enabledStatus: 'enabled' });
          toast.success('Invite link enabled');
        }
      } else {
        toast.error(data.error || `Failed to ${action} invite link`);
      }
    } catch {
      toast.error('Connection error');
    }
    setInviteLoading(false);
  }, [convoId, inviteLoading, joinLink]);

  const copyInviteCode = useCallback(() => {
    if (!joinLink?.code) return;
    navigator.clipboard.writeText(joinLink.code);
    toast.success('Invite code copied to clipboard!');
  }, [joinLink]);

  // ── Pending requests actions ─────────────────────────────────────────
  const loadPendingRequests = useCallback(async () => {
    if (!convoId) return;
    setRequestsLoading(true);
    try {
      const res = await fetch(`/api/groups/${convoId}/requests`);
      if (res.ok) {
        const data = await res.json();
        setPendingRequests(data.requests || []);
      }
    } catch { /* ignore */ }
    setRequestsLoading(false);
  }, [convoId]);

  // Load requests when panel is opened
  useEffect(() => {
    if (showRequests) loadPendingRequests();
  }, [showRequests, loadPendingRequests]);

  const handleApproveRequest = useCallback(
    async (memberDid: string, memberName: string) => {
      if (!convoId || requestsLoading) return;
      setRequestsLoading(true);
      try {
        const res = await fetch(`/api/groups/${convoId}/requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approve', member: memberDid }),
        });
        if (res.ok) {
          toast.success(`Approved ${memberName}`);
          // Refresh members and pending requests
          loadPendingRequests();
          const membersRes = await fetch(`/api/groups/${convoId}?scope=members`);
          if (membersRes.ok) {
            const membersData = await membersRes.json();
            setMembers(membersData.members || []);
          }
        } else {
          const err = await res.json();
          toast.error(err.error || 'Failed to approve request');
        }
      } catch {
        toast.error('Connection error');
      }
      setRequestsLoading(false);
    },
    [convoId, requestsLoading, loadPendingRequests]
  );

  const handleRejectRequest = useCallback(
    async (memberDid: string, memberName: string) => {
      if (!convoId || requestsLoading) return;
      setRequestsLoading(true);
      try {
        const res = await fetch(`/api/groups/${convoId}/requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reject', member: memberDid }),
        });
        if (res.ok) {
          toast.success(`Rejected ${memberName}`);
          loadPendingRequests();
        } else {
          const err = await res.json();
          toast.error(err.error || 'Failed to reject request');
        }
      } catch {
        toast.error('Connection error');
      }
      setRequestsLoading(false);
    },
    [convoId, requestsLoading, loadPendingRequests]
  );

  // ── Member management actions ───────────────────────────────────────
  const handleAddMembers = useCallback(async () => {
    const input = addMemberInput.trim();
    if (!input || memberActionLoading || !convoId) return;
    setMemberActionLoading(true);

    const handles = input
      .split(/[\s,]+/)
      .map((h) => h.trim().replace(/^@/, ''))
      .filter(Boolean);

    if (handles.length === 0) {
      toast.error('Enter at least one handle');
      setMemberActionLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/groups/${convoId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', memberDids: handles }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Added ${handles.length} member${handles.length > 1 ? 's' : ''}!`);
        setAddMemberInput('');
        // Refresh members list
        const membersRes = await fetch(`/api/groups/${convoId}?scope=members`);
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers(membersData.members || []);
        }
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to add members');
      }
    } catch {
      toast.error('Connection error');
    }
    setMemberActionLoading(false);
  }, [addMemberInput, memberActionLoading, convoId]);

  const handleRemoveMember = useCallback(
    async (memberDid: string, memberName: string) => {
      if (memberActionLoading || !convoId) return;
      setMemberActionLoading(true);
      try {
        const res = await fetch(`/api/groups/${convoId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'remove', memberDids: [memberDid] }),
        });

        if (res.ok) {
          toast.success(`Removed ${memberName}`);
          // Refresh members list
          const membersRes = await fetch(`/api/groups/${convoId}?scope=members`);
          if (membersRes.ok) {
            const membersData = await membersRes.json();
            setMembers(membersData.members || []);
          }
        } else {
          const err = await res.json();
          toast.error(err.error || 'Failed to remove member');
        }
      } catch {
        toast.error('Connection error');
      }
      setMemberActionLoading(false);
    },
    [memberActionLoading, convoId]
  );

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

          {/* Pending requests button */}
          {!loading && (
            <button
              onClick={() => setShowRequests(!showRequests)}
              className={`p-2 rounded-lg transition-colors relative ${
                showRequests ? 'bg-brand/20 text-brand' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
              aria-label="Pending join requests"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              {pendingRequests.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-[14px] flex items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white px-1">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          )}

          {/* Members button */}
          {!loading && (
            <button
              onClick={() => setShowMembers(!showMembers)}
              className={`p-2 rounded-lg transition-colors ${
                showMembers ? 'bg-brand/20 text-brand' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
              aria-label="Manage members"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </button>
          )}

          {/* Invite button */}
          {!loading && (
            <button
              onClick={() => setShowInvite(!showInvite)}
              className={`p-2 rounded-lg transition-colors ${
                showInvite ? 'bg-brand/20 text-brand' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
              aria-label="Manage invite link"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          )}

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

      {/* Invite link panel */}
      {showInvite && (
        <div className="border-b border-border bg-surface-elevated/50 px-4 py-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Invite Link</h3>

          {joinLink ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={joinLink.code}
                  className="flex-1 rounded-lg border border-border bg-surface-base px-3 py-2 text-sm font-mono text-foreground"
                />
                <button
                  onClick={copyInviteCode}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  aria-label="Copy invite code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={joinLink.enabledStatus === 'enabled' ? 'text-green-500' : 'text-red-500'}>
                    {joinLink.enabledStatus === 'enabled' ? '● Enabled' : '● Disabled'}
                  </span>
                  <span>· {joinLink.requireApproval ? 'Approval required' : 'Open join'}</span>
                </div>
                <button
                  onClick={handleToggleInviteLink}
                  disabled={inviteLoading}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    joinLink.enabledStatus === 'enabled'
                      ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                      : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                  } disabled:opacity-50`}
                >
                  {inviteLoading ? '...' : joinLink.enabledStatus === 'enabled' ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground mb-3">
                Create an invite link to let others join this group.
              </p>
              <button
                onClick={handleCreateInviteLink}
                disabled={inviteLoading}
                className="px-4 py-2 rounded-lg bg-brand text-black text-xs font-semibold hover:bg-brand-hover disabled:opacity-50 transition-colors"
              >
                {inviteLoading ? 'Creating...' : 'Create Invite Link'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Members panel */}
      {showMembers && (
        <div className="border-b border-border bg-surface-elevated/50 px-4 py-4 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">
              Members ({members.length})
            </h3>
          </div>

          {/* Add member input */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={addMemberInput}
              onChange={(e) => setAddMemberInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddMembers();
                }
              }}
              placeholder="Add members (handles, comma separated)"
              className="flex-1 rounded-lg border border-border bg-surface-base px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand transition-colors"
            />
            <button
              onClick={handleAddMembers}
              disabled={memberActionLoading || !addMemberInput.trim()}
              className="px-3 py-2 rounded-lg bg-brand text-black text-xs font-semibold hover:bg-brand-hover disabled:opacity-50 transition-colors shrink-0"
            >
              {memberActionLoading ? '...' : 'Add'}
            </button>
          </div>

          {/* Members list */}
          <div className="space-y-1">
            {members.map((member) => {
              const isSelf = member.did === session?.did;
              return (
                <div
                  key={member.did}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/20 transition-colors"
                >
                  <Avatar
                    src={member.avatar}
                    alt={member.handle}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate block">
                      {member.displayName || member.handle}
                    </span>
                    {member.displayName && (
                      <span className="text-xs text-muted-foreground truncate block">
                        @{member.handle}
                      </span>
                    )}
                  </div>
                  {isSelf ? (
                    <span className="text-xs text-muted-foreground px-2">You</span>
                  ) : (
                    <button
                      onClick={() =>
                        handleRemoveMember(
                          member.did,
                          member.displayName || member.handle
                        )
                      }
                      disabled={memberActionLoading}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      aria-label={`Remove ${member.displayName || member.handle}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending requests panel */}
      {showRequests && (
        <div className="border-b border-border bg-surface-elevated/50 px-4 py-4 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">
              Pending Requests
              {pendingRequests.length > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({pendingRequests.length})
                </span>
              )}
            </h3>
            {pendingRequests.length > 0 && (
              <button
                onClick={loadPendingRequests}
                disabled={requestsLoading}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Refresh requests"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${requestsLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>

          {requestsLoading && pendingRequests.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-2 w-16 animate-pulse rounded bg-muted/50" />
                  </div>
                </div>
              ))}
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="py-4 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-muted-foreground">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-1">
              {pendingRequests.map((req) => (
                <div
                  key={req.requestedBy?.did || req.convoId}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/20 transition-colors"
                >
                  <Avatar
                    src={req.requestedBy?.avatar}
                    alt={req.requestedBy?.handle || ''}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate block">
                      {req.requestedBy?.displayName || req.requestedBy?.handle || 'Unknown'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Requested {formatRelativeTime(req.requestedAt)}
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() =>
                        handleApproveRequest(
                          req.requestedBy?.did,
                          req.requestedBy?.displayName || req.requestedBy?.handle || 'user'
                        )
                      }
                      disabled={requestsLoading}
                      className="p-1.5 rounded-lg text-green-500 hover:bg-green-500/10 transition-colors disabled:opacity-50"
                      aria-label="Approve request"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() =>
                        handleRejectRequest(
                          req.requestedBy?.did,
                          req.requestedBy?.displayName || req.requestedBy?.handle || 'user'
                        )
                      }
                      disabled={requestsLoading}
                      className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      aria-label="Reject request"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
