'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { FeedCardSkeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Plus, X, Users } from 'lucide-react';
import { toast } from 'sonner';

interface ListView {
  uri: string;
  name: string;
  description?: string;
  avatar?: string;
  itemCount?: number;
  creator: { did: string; handle: string; displayName?: string; avatar?: string };
}

export default function ListsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, session } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, authLoading, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['lists'],
    queryFn: async () => {
      const res = await fetch('/api/graph/lists');
      if (!res.ok) throw new Error('Failed to fetch lists');
      return res.json();
    },
    enabled: !!session,
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const res = await fetch('/api/graph/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', name, description }),
      });
      if (!res.ok) throw new Error('Failed to create list');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      setShowCreate(false);
      setNewListName('');
      setNewListDesc('');
      toast.success('List created');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (listUri: string) => {
      const res = await fetch('/api/graph/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', listUri }),
      });
      if (!res.ok) throw new Error('Failed to delete list');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      toast.success('List deleted');
    },
  });

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface-base">
        <div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" />
      </div>
    );
  }

  const lists: ListView[] = data?.lists || [];

  return (
    <div className="min-h-[100dvh] bg-surface-base">
      <header className="sticky top-0 z-40 border-b border-border bg-surface-base/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-foreground hover:text-muted-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold font-heading text-foreground">Lists</h1>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="p-2 rounded-full hover:bg-accent transition-colors"
          >
            <Plus className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg pb-20">
        {showCreate && (
          <div className="px-4 py-4 border-b border-border bg-surface-elevated">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">New List</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="List name"
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none mb-2"
            />
            <input
              type="text"
              value={newListDesc}
              onChange={(e) => setNewListDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none mb-3"
            />
            <Button
              onClick={() => createMutation.mutate({ name: newListName, description: newListDesc })}
              disabled={!newListName.trim() || createMutation.isPending}
              className="w-full"
            >
              {createMutation.isPending ? 'Creating...' : 'Create List'}
            </Button>
          </div>
        )}

        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <FeedCardSkeleton key={i} />)
        ) : lists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mb-4" strokeWidth={1} />
            <p className="text-lg font-medium text-foreground">No lists yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create a list to organize people you follow</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {lists.map((list) => (
              <div key={list.uri} className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors">
                <Avatar src={list.avatar} alt={list.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{list.name}</p>
                  {list.description && (
                    <p className="text-xs text-muted-foreground truncate">{list.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{list.itemCount || 0} members</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Delete this list?')) {
                      deleteMutation.mutate(list.uri);
                    }
                  }}
                  className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
