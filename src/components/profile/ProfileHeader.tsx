'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { useFollowUser, useUnfollowUser } from '@/hooks/useProfile';
import { useBlockMute } from '@/hooks/useBlockMute';
import { ShieldOff, VolumeOff, MoreHorizontal } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ProfileHeaderProps {
  profile: any;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const router = useRouter();
  const { session } = useAuth();
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const { blockUser, muteUser, loading: blockMuteLoading } = useBlockMute();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isOwnProfile = session?.did === profile.did;
  const isFollowing = !!profile.viewer?.following;
  const isMuted = !!profile.viewer?.muted;
  const isBlocked = !!profile.viewer?.blockedBy;

  const handleFollowToggle = async () => {
    if (isFollowing) {
      await unfollowMutation.mutateAsync(profile.viewer.following);
    } else {
      await followMutation.mutateAsync(profile.did);
    }
  };

  const handleMuteToggle = async () => {
    if (isMuted) {
      await muteUser(profile.did);
    } else {
      await muteUser(profile.did);
    }
    setShowMenu(false);
  };

  const handleBlock = async () => {
    await blockUser(profile.did);
    setShowMenu(false);
  };

  return (
    <div>
      {/* Banner */}
      <div className="profile-banner">
        {profile.banner && (
          <img src={profile.banner} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="px-4 pb-4">
        {/* Avatar + Follow button row */}
        <div className="profile-avatar-wrap flex items-end justify-between">
          <Avatar
            src={profile.avatar}
            alt={profile.displayName || profile.handle}
            size="xl"
            className="ring-4 ring-surface-base"
          />
          {!isOwnProfile && session ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleFollowToggle}
                disabled={followMutation.isPending || unfollowMutation.isPending}
                className={`rounded-full px-5 py-2 text-sm font-bold transition-colors ${
                  isFollowing
                    ? 'border border-border bg-transparent text-foreground hover:border-destructive hover:text-destructive hover:bg-destructive/10'
                    : 'bg-brand text-black hover:bg-brand-hover'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="rounded-full border border-border p-2 text-foreground hover:bg-accent transition-colors"
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                    <button
                      onClick={handleMuteToggle}
                      disabled={blockMuteLoading}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <VolumeOff className="h-4 w-4" />
                      {isMuted ? 'Unmute' : 'Mute'} @{profile.handle}
                    </button>
                    <button
                      onClick={handleBlock}
                      disabled={blockMuteLoading}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <ShieldOff className="h-4 w-4" />
                      Block @{profile.handle}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <a
              href="/settings"
              className="rounded-full border border-border px-5 py-2 text-sm font-bold text-foreground hover:bg-accent transition-colors"
            >
              Edit Profile
            </a>
          )}
        </div>

        {/* Name and handle */}
        <h1 className="text-xl font-bold text-foreground mt-2">
          {profile.displayName || profile.handle}
        </h1>
        <p className="text-sm text-muted-foreground">@{profile.handle}</p>

        {/* Bio */}
        {profile.description && (
          <p className="mt-3 text-[15px] text-foreground whitespace-pre-wrap leading-normal">
            {profile.description}
          </p>
        )}

        {/* Stats */}
        <div className="mt-3 flex items-center gap-5">
          <span className="text-sm text-muted-foreground">
            <strong className="text-foreground font-semibold tabular-nums">{profile.postsCount ?? 0}</strong> posts
          </span>
          <button
            onClick={() => router.push(`/profile/${profile.handle}/followers`)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <strong className="text-foreground font-semibold tabular-nums">{profile.followersCount ?? 0}</strong> followers
          </button>
          <button
            onClick={() => router.push(`/profile/${profile.handle}/following`)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <strong className="text-foreground font-semibold tabular-nums">{profile.followsCount ?? 0}</strong> following
          </button>
        </div>

        {/* Join date */}
        {profile.createdAt && (
          <p className="mt-2 text-sm text-muted-foreground">
            Joined {new Date(profile.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
    </div>
  );
}
