'use client';

import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/avatar';
import { useFollowUser, useUnfollowUser } from '@/hooks/useProfile';

interface ProfileHeaderProps {
  profile: any;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { session } = useAuth();
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const isOwnProfile = session?.did === profile.did;
  const isFollowing = !!profile.viewer?.following;

  const handleFollowToggle = async () => {
    if (isFollowing) {
      await unfollowMutation.mutateAsync(profile.viewer.following);
    } else {
      await followMutation.mutateAsync(profile.did);
    }
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
          <span className="text-sm text-muted-foreground">
            <strong className="text-foreground font-semibold tabular-nums">{profile.followersCount ?? 0}</strong> followers
          </span>
          <span className="text-sm text-muted-foreground">
            <strong className="text-foreground font-semibold tabular-nums">{profile.followsCount ?? 0}</strong> following
          </span>
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
