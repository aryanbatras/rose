'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { ArrowLeft, Camera, Keyboard, Eye, Bell, Shield, Palette, X, RotateCcw, ChevronRight } from 'lucide-react';
import { useFilterStore } from '@/stores/filter-store';
import { useShortcutsStore } from '@/stores/shortcuts-store';
import { useViewModeStore } from '@/stores/view-mode-store';
import { useThemeStore } from '@/stores/theme-store';

type SettingsSection = 'profile' | 'shortcuts' | 'filters' | 'muted' | 'display' | 'theme' | 'about';

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
  const [activeSection, setActiveSection] = useState<SettingsSection | null>(null);

  // Filter store
  const { content, mute, display, setContent, setMute, addMutedWord, removeMutedWord, setDisplay } = useFilterStore();

  // Shortcuts store
  const { enabled: shortcutsEnabled, bindings, setBinding, resetBindings, toggleEnabled } = useShortcutsStore();

  // View mode store
  const { mode: viewMode, setMode: setViewMode } = useViewModeStore();

  // Theme store
  const { theme: currentTheme, setTheme } = useThemeStore();

  // Muted word input
  const [newMutedWord, setNewMutedWord] = useState('');

  // Editing shortcut
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);

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
      const res = await fetch('/api/profile/update', { method: 'POST', body: formData });
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

  const handleAddMutedWord = () => {
    const word = newMutedWord.trim();
    if (word) {
      addMutedWord(word);
      setNewMutedWord('');
      toast.success(`Muted "${word}"`);
    }
  };

  const handleShortcutEdit = useCallback((id: string) => {
    setEditingShortcut(id);
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setBinding(id, e.key, e.ctrlKey || e.metaKey, e.shiftKey, e.altKey);
      setEditingShortcut(null);
      document.removeEventListener('keydown', handler, true);
    };
    document.addEventListener('keydown', handler, true);
  }, [setBinding]);

  if (authLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface-base">
        <div className="h-8 w-8 animate-pulse rounded-full bg-brand/30" />
      </div>
    );
  }

  // Section view
  if (activeSection) {
    return (
      <div className="min-h-[100dvh] bg-surface-base">
        <header className="sticky top-0 z-40 border-b border-border bg-surface-base/80 backdrop-blur-lg">
          <div className="mx-auto flex max-w-lg items-center px-4 py-3">
            <button onClick={() => setActiveSection(null)} className="text-foreground hover:text-muted-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="ml-3 text-lg font-bold font-heading text-foreground capitalize">
              {activeSection === 'shortcuts' ? 'Keyboard Shortcuts' :
               activeSection === 'filters' ? 'Content Filters' :
               activeSection === 'muted' ? 'Muted Words' :
               activeSection === 'display' ? 'Display' :
               activeSection === 'theme' ? 'Theme' :
               activeSection === 'about' ? 'About' : 'Settings'}
            </h1>
          </div>
        </header>

        <main className="mx-auto max-w-lg pb-20">
          {activeSection === 'shortcuts' && (
            <div className="px-4 py-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">Toggle keyboard shortcuts</p>
                <button
                  onClick={toggleEnabled}
                  className={`relative w-12 h-7 rounded-full transition-colors ${shortcutsEnabled ? 'bg-brand' : 'bg-muted'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${shortcutsEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {shortcutsEnabled && (
                <>
                  <div className="space-y-1">
                    {bindings.map((binding) => (
                      <div key={binding.id} className="flex items-center justify-between py-3 border-b border-border">
                        <div>
                          <p className="text-sm font-medium text-foreground">{binding.label}</p>
                          <p className="text-xs text-muted-foreground">{binding.description}</p>
                        </div>
                        <button
                          onClick={() => handleShortcutEdit(binding.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                            editingShortcut === binding.id
                              ? 'bg-brand text-white animate-pulse'
                              : 'bg-muted text-foreground hover:bg-accent'
                          }`}
                        >
                          {editingShortcut === binding.id
                            ? 'Press a key...'
                            : `${binding.ctrl ? '⌘' : ''}${binding.shift ? '⇧' : ''}${binding.alt ? '⌥' : ''}${binding.key}`}
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { resetBindings(); toast.success('Shortcuts reset to defaults'); }}
                    className="mt-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset to defaults
                  </button>
                </>
              )}
            </div>
          )}

          {activeSection === 'filters' && (
            <div className="px-4 py-4 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Content</h3>
                <div className="space-y-3">
                  {[
                    { key: 'hideReposts' as const, label: 'Hide reposts' },
                    { key: 'hideReplies' as const, label: 'Hide replies' },
                    { key: 'mediaOnly' as const, label: 'Media only' },
                    { key: 'videoOnly' as const, label: 'Video only' },
                    { key: 'textOnly' as const, label: 'Text only' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground">{label}</span>
                      <button
                        onClick={() => setContent({ [key]: !content[key] })}
                        className={`relative w-12 h-7 rounded-full transition-colors ${content[key] ? 'bg-brand' : 'bg-muted'}`}
                      >
                        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${content[key] ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'muted' && (
            <div className="px-4 py-4">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newMutedWord}
                  onChange={(e) => setNewMutedWord(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMutedWord()}
                  placeholder="Add a word or phrase to mute..."
                  className="flex-1 rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
                />
                <Button onClick={handleAddMutedWord} disabled={!newMutedWord.trim()} className="px-4">
                  Add
                </Button>
              </div>
              {mute.mutedWords.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No muted words yet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {mute.mutedWords.map((word) => (
                    <span key={word} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm text-foreground">
                      {word}
                      <button onClick={() => removeMutedWord(word)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'display' && (
            <div className="px-4 py-4 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Feed</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-foreground">Hide engagement metrics</span>
                    <button
                      onClick={() => setDisplay({ hideEngagementMetrics: !display.hideEngagementMetrics })}
                      className={`relative w-12 h-7 rounded-full transition-colors ${display.hideEngagementMetrics ? 'bg-brand' : 'bg-muted'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${display.hideEngagementMetrics ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-foreground">Feed density</span>
                    <select
                      value={display.feedDensity}
                      onChange={(e) => setDisplay({ feedDensity: e.target.value as 'comfortable' | 'compact' })}
                      className="rounded-lg border border-border bg-transparent px-3 py-1.5 text-sm text-foreground focus:border-brand focus:outline-none"
                    >
                      <option value="comfortable">Comfortable</option>
                      <option value="compact">Compact</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Default View</h3>
                <div className="flex gap-2">
                  {[
                    { key: 'classic' as const, label: 'Classic' },
                    { key: 'grid' as const, label: 'Grid' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setViewMode(key)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        viewMode === key ? 'bg-brand text-white' : 'bg-muted text-foreground hover:bg-accent'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'theme' && (
            <div className="px-4 py-4">
              <p className="text-sm text-muted-foreground mb-4">Choose your preferred theme</p>
              <div className="space-y-2">
                {[
                  { key: 'light' as const, label: 'Light', desc: 'Warm off-white background' },
                  { key: 'dark' as const, label: 'Dark', desc: 'Easy on the eyes' },
                  { key: 'system' as const, label: 'System', desc: 'Match your device setting' },
                ].map(({ key, label, desc }) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-accent transition-colors"
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 ${
                      currentTheme === key
                        ? 'border-brand bg-brand'
                        : 'border-border'
                    }`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'about' && (
            <div className="px-4 py-4 space-y-4">
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold font-heading" style={{ color: 'var(--brand)' }}>Rose</h2>
                <p className="text-sm text-muted-foreground mt-1">v1.0.0</p>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                A social network built on the AT Protocol.
              </p>
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-xs text-muted-foreground text-center">
                  Powered by Bluesky · AT Protocol
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Main settings view
  return (
    <div className="min-h-[100dvh] bg-surface-base">
      <header className="sticky top-0 z-40 border-b border-border bg-surface-base/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center px-4 py-3">
          <button onClick={() => router.back()} className="text-foreground hover:text-muted-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="ml-3 text-lg font-bold font-heading text-foreground">Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg pb-20">
        {/* Profile Editor */}
        <section className="px-4 pt-4">
          <div className="relative h-32 rounded-xl bg-muted overflow-hidden mb-4">
            {(bannerPreview || profile?.banner) && (
              <img src={bannerPreview || profile?.banner} alt="" className="h-full w-full object-cover" />
            )}
            <label className="absolute bottom-2 right-2 cursor-pointer rounded-lg bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm hover:bg-background transition-colors">
              Change banner
              <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
            </label>
          </div>

          <div className="flex items-end justify-between mb-6">
            <div className="relative">
              <Avatar src={avatarPreview || profile?.avatar} alt={displayName || session?.handle || ''} size="xl" className="ring-4 ring-surface-base" />
              <label className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-brand p-1.5 text-black shadow-md hover:bg-brand-hover transition-colors">
                <Camera className="h-3.5 w-3.5" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <span className="text-xs text-muted-foreground">@{session?.handle}</span>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-foreground">Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={64} placeholder="Your display name" className="w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none transition-colors" />
          </div>

          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-foreground">Bio</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={256} rows={3} placeholder="Tell people about yourself" className="w-full resize-none rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none transition-colors" />
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">{description.length}/256</p>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? 'Saving...' : 'Save Profile'}
          </Button>
        </section>

        {/* Settings sections */}
        <section className="mt-6 px-4">
          <h2 className="text-sm font-semibold text-foreground mb-2">Preferences</h2>
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {[
              { key: 'shortcuts' as const, icon: Keyboard, label: 'Keyboard Shortcuts', desc: 'Customize key bindings' },
              { key: 'filters' as const, icon: Shield, label: 'Content Filters', desc: 'Hide reposts, media only, etc.' },
              { key: 'muted' as const, icon: Bell, label: 'Muted Words', desc: `${mute.mutedWords.length} words muted` },
              { key: 'display' as const, icon: Eye, label: 'Display', desc: 'Density, metrics, view mode' },
              { key: 'theme' as const, icon: Palette, label: 'Theme', desc: 'Light, dark, or system' },
            ].map(({ key, icon: Icon, label, desc }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-accent transition-colors"
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </section>

        {/* Account */}
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
          <button onClick={() => setActiveSection('about')} className="w-full flex items-center justify-between py-2 hover:text-brand transition-colors">
            <span className="text-sm text-foreground">About Rose</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </section>

        {/* Logout */}
        <section className="px-4 py-6 border-t border-border">
          <Button variant="destructive" className="w-full" onClick={handleLogout}>Log Out</Button>
        </section>
      </main>
    </div>
  );
}
