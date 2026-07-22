'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useGroupPolling } from '@/hooks/useGroupPolling';
import { useGroupNameStore } from '@/stores/group-name-store';
import type { GroupInfo } from '@/types/chat';
import { Avatar } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { UserPlus, Users, X } from 'lucide-react';

export default function GroupsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, session } = useAuth();

  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [memberHandles, setMemberHandles] = useState('');

  // ── Group name persistence ──────────────────────────────────────────
  const setStoredName = useGroupNameStore((s) => s.setName);

  /** Apply stored names on top of API data (Bluesky ConvoView lacks name) */
  function applyStoredNames(raw: GroupInfo[]): GroupInfo[] {
    const names = useGroupNameStore.getState().names;
    return raw.map((g) => ({
      ...g,
      name: names[g.convoId] || g.name,
    }));
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, authLoading, router]);

  // Initial one-time fetch (manages loading state properly)
  useEffect(() => {
    if (!isAuthenticated || !session) return;
    fetch('/api/groups')
      .then((res) => (res.ok ? res.json() : { groups: [] }))
      .then((data) => setGroups(applyStoredNames(data.groups || [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, session]);

  // Background polling every 30s (never touches loading state)
  const { refreshNow } = useGroupPolling({
    isAuthenticated: isAuthenticated && !!session,
    onUpdate: useCallback((freshGroups: GroupInfo[]) => {
      const names = useGroupNameStore.getState().names;
      setGroups(
        freshGroups.map((g) => ({
          ...g,
          name: names[g.convoId] || g.name,
        }))
      );
    }, []),
  });

  const handleCreate = async () => {
    if (!groupName.trim() || !memberHandles.trim()) {
      toast.error('Group name and at least one member required');
      return;
    }

    const handles = memberHandles
      .split(/[\s,]+/)
      .map((h) => h.trim().replace(/^@/, ''))
      .filter(Boolean);

    if (handles.length === 0) {
      toast.error('Enter at least one member handle');
      return;
    }

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName.trim(), memberDids: handles }),
      });

      if (res.ok) {
        const data = await res.json();
        // Persist the group name so it doesn't fall back to member names
        if (data.convoId) {
          setStoredName(data.convoId, groupName.trim());
        }
        toast.success('Group created!');
        setShowCreate(false);
        setGroupName('');
        setMemberHandles('');
        // Trigger a fresh poll immediately
        refreshNow();
        // Navigate to the new group
        if (data.convoId) router.push(`/groups/${data.convoId}`);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create group');
      }
    } catch {
      toast.error('Connection error');
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
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-lg font-bold font-heading text-foreground">Groups</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/groups/join')}
              className="px-3 py-2 rounded-full border border-border text-foreground text-sm font-medium hover:bg-accent/30 transition-colors"
            >
              <span className="hidden sm:inline">Join</span>
              <UserPlus className="h-4 w-4 sm:hidden" />
            </button>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="px-4 py-2 rounded-full bg-brand text-black text-sm font-semibold hover:bg-brand-hover transition-colors"
            >
              {showCreate ? 'Cancel' : 'New Group'}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Create group form */}
        {showCreate && (
          <section className="px-4 pt-4 pb-6 border-b border-border">
            <h2 className="text-base font-bold text-foreground mb-3">Create Group</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., Project Team"
                  maxLength={50}
                  className="w-full rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Members <span className="text-muted-foreground font-normal">(handles, comma/space separated)</span>
                </label>
                <input
                  type="text"
                  value={memberHandles}
                  onChange={(e) => setMemberHandles(e.target.value)}
                  placeholder="alice.bsky.social, bob.bsky.social"
                  className="w-full rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand transition-colors"
                />
              </div>
              <button
                onClick={handleCreate}
                className="w-full py-2.5 rounded-xl bg-brand text-black text-sm font-semibold hover:bg-brand-hover transition-colors"
              >
                Create Group
              </button>
            </div>
          </section>
        )}

        {/* Groups list */}
        <section className="px-4 pt-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="h-12 w-12 animate-pulse rounded-xl bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <div className="py-16 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-muted-foreground">No groups yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create a group to start chatting with friends
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 px-6 py-2.5 rounded-xl bg-brand text-black text-sm font-semibold hover:bg-brand-hover transition-colors"
              >
                Create Group
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {groups.map((group) => (
                <button
                  key={group.convoId}
                  onClick={() => router.push(`/groups/${group.convoId}`)}
                  className="flex w-full items-center gap-3 p-3 rounded-xl hover:bg-accent/30 transition-colors text-left"
                >
                  {/* Group avatar */}
                  <div className="h-12 w-12 rounded-xl bg-brand/15 flex items-center justify-center shrink-0 relative">
                    <Users className="h-6 w-6 text-brand" strokeWidth={1.5} />
                    {group.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 min-w-[14px] flex items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white px-1">
                        {group.unreadCount > 99 ? '99+' : group.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {group.name}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {group.memberCount} members
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {group.lastMessage && 'text' in group.lastMessage
                        ? (group.lastMessage as any).text
                        : 'No messages yet'}
                    </p>
                  </div>

                  {/* Member avatars row */}
                  <div className="flex -space-x-2 shrink-0">
                    {group.members?.slice(0, 3).map((member) => (
                      <div
                        key={member.did}
                        className="h-7 w-7 rounded-full border-2 border-surface-base overflow-hidden"
                      >
                        {member.avatar ? (
                          <img src={member.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-accent flex items-center justify-center">
                            <span className="text-[9px] font-semibold text-muted-foreground">
                              {(member.displayName || member.handle || '?')[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
