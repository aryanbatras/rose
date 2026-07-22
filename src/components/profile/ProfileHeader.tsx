'use client';

import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
      <div className="h-32 bg-gradient-to-br from-brand/30 to-brand-muted sm:h-40">
        {profile.banner && (
          <img
            src={profile.banner}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Profile info */}
      <div className="px-4 pb-4">
        <div className="-mt-10 flex items-end justify-between mb-3">
          <Avatar
            src={profile.avatar}
            alt={profile.displayName || profile.handle}
            size="xl"
            className="ring-4 ring-surface-base"
          />
          {!isOwnProfile && session && (
            <Button
              variant={isFollowing ? 'outline' : 'primary'}
              size="sm"
              onClick={handleFollowToggle}
              disabled={followMutation.isPending || unfollowMutation.isPending}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
          {isOwnProfile && (
            <a
              href="/settings"
              className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Edit Profile
            </a>
          )}
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-foreground">
            {profile.displayName || profile.handle}
          </h1>
          <p className="text-sm text-muted-foreground">@{profile.handle}</p>
        </div>

        {profile.description && (
          <p className="mt-3 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {profile.description}
          </p>
        )}

        {/* Stats */}
        <div className="mt-4 flex items-center gap-5">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {profile.postsCount ?? 0}
            </span>
            <span className="text-sm text-muted-foreground">posts</span>
          </div>
          <button className="flex items-center gap-1 hover:underline">
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {profile.followersCount ?? 0}
            </span>
            <span className="text-sm text-muted-foreground">followers</span>
          </button>
          <button className="flex items-center gap-1 hover:underline">
            <span className="text-sm font-semibold text-foreground tabular-nums">
              {profile.followsCount ?? 0}
            </span>
            <span className="text-sm text-muted-foreground">following</span>
          </button>
        </div>

        {profile.joinedViaStarterPack && profile.createdAt && (
          <p className="mt-2 text-xs text-muted-foreground">
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
