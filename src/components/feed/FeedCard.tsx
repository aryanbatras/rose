'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/avatar';
import { useState } from 'react';
import { formatRelativeTime } from '@/lib/time';
import type { FeedItem } from '@/types/atproto';

interface FeedCardProps {
  item: FeedItem;
  reason?: { $type: string; by: { handle: string; displayName?: string; avatar?: string } };
}

export function FeedCard({ item, reason }: FeedCardProps) {
  const router = useRouter();
  const { session } = useAuth();
  const [liked, setLiked] = useState(!!item.viewer?.like);
  const [likeCount, setLikeCount] = useState(item.likeCount);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session || isLiking) return;
    setIsLiking(true);
    try {
      if (liked && item.viewer?.like) {
        const res = await fetch('/api/interact/unlike', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ likeUri: item.viewer.like }),
        });
        if (res.ok) { setLiked(false); setLikeCount((c) => Math.max(0, c - 1)); }
      } else {
        const res = await fetch('/api/interact/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uri: item.uri, cid: item.cid }),
        });
        if (res.ok) { setLiked(true); setLikeCount((c) => c + 1); }
      }
    } finally { setIsLiking(false); }
  };

  const authorDisplay = item.author.displayName || item.author.handle;

  return (
    <article
      onClick={() => router.push(`/feed/${encodeURIComponent(item.uri)}`)}
      className="feed-card"
    >
      <button
        onClick={(e) => { e.stopPropagation(); router.push(`/profile/${item.author.handle}`); }}
        className="shrink-0"
      >
        <Avatar src={item.author.avatar} alt={authorDisplay} size="md" />
      </button>

      <div className="min-w-0 flex-1">
        {/* Repost reason */}
        {reason?.$type === 'app.bsky.feed.defs#reasonRepost' && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {reason.by.displayName || reason.by.handle} reposted
          </p>
        )}

        {/* Author row */}
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-foreground truncate">
            {authorDisplay}
          </span>
          <span className="shrink-0 text-sm text-muted-foreground">
            @{item.author.handle}
          </span>
          <span className="shrink-0 text-sm text-muted-foreground">·</span>
          <span className="shrink-0 text-sm text-muted-foreground">
            {formatRelativeTime(item.indexedAt)}
          </span>
        </div>

        {/* Post text */}
        <p className="mt-1 text-[15px] text-foreground whitespace-pre-wrap break-words leading-normal">
          {item.record.text}
        </p>

        {/* Embedded media */}
        {item.record.embed && (
          <div className="mt-2 overflow-hidden rounded-lg border border-border">
            {item.record.embed.$type === 'app.bsky.embed.images#view' && item.record.embed.images && (
              <div className={item.record.embed.images.length > 1 ? 'grid grid-cols-2 gap-0.5' : ''}>
                {item.record.embed.images.map((img: any, i: number) => (
                  <img
                    key={i}
                    src={img.thumb || `https://og-image.xyz/${i}`}
                    alt={img.alt || ''}
                    className="w-full object-cover max-h-60"
                    loading="lazy"
                  />
                ))}
              </div>
            )}
            {item.record.embed.$type === 'app.bsky.embed.external#view' && item.record.embed.external && (
              <div className="flex flex-col">
                {item.record.embed.external.thumb && (
                  <img
                    src={item.record.embed.external.thumb}
                    alt=""
                    className="w-full h-40 object-cover"
                    loading="lazy"
                  />
                )}
                <div className="p-3">
                  <p className="text-sm font-semibold text-foreground">{item.record.embed.external.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.record.embed.external.description}</p>
                  <p className="text-xs text-blue mt-1 truncate">{item.record.embed.external.uri}</p>
                </div>
              </div>
            )}
            {item.record.embed.$type === 'app.bsky.embed.record#view' && (
              <div className="p-3 text-sm text-muted-foreground">
                Quoted post
              </div>
            )}
          </div>
        )}

        {/* Interaction row */}
        <div className="flex items-center gap-2 mt-2 -ml-2">
          <button
            onClick={(e) => { e.stopPropagation(); router.push(`/feed/${encodeURIComponent(item.uri)}`); }}
            className="interact-btn"
            aria-label="Reply"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="tabular-nums text-sm">{item.replyCount || ''}</span>
          </button>

          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`interact-btn ${liked ? 'liked' : ''}`}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4.5 w-4.5"
              fill={liked ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={liked ? 0 : 2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className="tabular-nums text-sm">{likeCount || ''}</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="interact-btn"
            aria-label="Share"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
