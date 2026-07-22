'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, session, logout } = useAuth();
  const { data: profile } = useProfile(session?.handle || '');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setDescription(profile.description || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!session) return;
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.set('displayName', displayName.trim());
      formData.set('description', description.trim());
      if (avatarFile) formData.set('avatar', avatarFile);
      if (bannerFile) formData.set('banner', bannerFile);

      const res = await fetch('/api/profile/update', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast.success('Profile updated');
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        setAvatarFile(null);
        setBannerFile(null);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update profile');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/login');
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface-base">
        <div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-surface-base">
      <header className="sticky top-0 z-40 border-b border-border bg-surface-base/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center px-4 py-3">
          <button onClick={() => router.back()} className="text-foreground hover:text-muted-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <h1 className="ml-3 text-lg font-bold font-heading text-foreground">Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg pb-20">
        {/* Profile Editor */}
        <section className="px-4 pt-4">
          {/* Banner */}
          <div className="relative h-32 rounded-xl bg-muted overflow-hidden mb-4">
            {(bannerPreview || profile?.banner) && (
              <img
                src={bannerPreview || profile?.banner}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
            <label className="absolute bottom-2 right-2 cursor-pointer rounded-lg bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm hover:bg-background transition-colors">
              Change banner
              <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
            </label>
          </div>

          {/* Avatar */}
          <div className="flex items-end justify-between mb-6">
            <div className="relative">
              <Avatar
                src={avatarPreview || profile?.avatar}
                alt={displayName || session?.handle || ''}
                size="xl"
                className="ring-4 ring-surface-base"
              />
              <label className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-brand p-1.5 text-black shadow-md hover:bg-brand-hover transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <span className="text-xs text-muted-foreground">@{session?.handle}</span>
          </div>

          {/* Display Name */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-foreground">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={64}
              placeholder="Your display name"
              className="w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none transition-colors"
            />
          </div>

          {/* Bio */}
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-foreground">Bio</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={256}
              rows={3}
              placeholder="Tell people about yourself"
              className="w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none transition-colors"
            />
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">{description.length}/256</p>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? 'Saving...' : 'Save Profile'}
          </Button>
        </section>

        {/* Account Info */}
        <section className="mt-6 px-4 py-4 border-t border-border">
          <h2 className="text-sm font-semibold text-foreground mb-3">Account</h2>
          <div className="space-y-1">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">Handle</span>
              <span className="text-sm text-muted-foreground">{session?.handle}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">DID</span>
              <span className="text-sm text-muted-foreground font-mono text-xs">{session?.did?.slice(0, 20)}...</span>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="px-4 py-4 border-t border-border">
          <h2 className="text-sm font-semibold text-foreground mb-3">About</h2>
          <p className="text-sm text-muted-foreground">VoiceFlow v1.0.0 — A social network built on the AT Protocol.</p>
        </section>

        {/* Logout */}
        <section className="px-4 py-6 border-t border-border">
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            Log Out
          </Button>
        </section>
      </main>
    </div>
  );
}
