'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/avatar';
import { VoicePlayer } from '@/components/voice/VoicePlayer';
import { useState } from 'react';
import type { FeedItem } from '@/types/atproto';

interface FeedCardProps {
  item: FeedItem;
  isVoicePost?: boolean;
}

function formatRelativeTime(dateStr: string) {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

export function FeedCard({ item, isVoicePost = false }: FeedCardProps) {
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
        if (res.ok) {
          setLiked(false);
          setLikeCount((c) => Math.max(0, c - 1));
        }
      } else {
        const res = await fetch('/api/interact/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uri: item.uri, cid: item.cid }),
        });
        if (res.ok) {
          setLiked(true);
          setLikeCount((c) => c + 1);
        }
      }
    } finally {
      setIsLiking(false);
    }
  };

  const authorDisplay = item.author.displayName || item.author.handle;

  return (
    <article
      onClick={() => router.push(`/feed/${encodeURIComponent(item.uri)}`)}
      className="group cursor-pointer border-b border-border px-4 py-3 transition-colors hover:bg-accent/30 active:bg-accent/50"
    >
      <div className="flex gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/profile/${item.author.handle}`);
          }}
          className="shrink-0"
        >
          <Avatar
            src={item.author.avatar}
            alt={authorDisplay}
            size="md"
          />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {authorDisplay}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              @{item.author.handle}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatRelativeTime(item.indexedAt)}
            </span>
          </div>

          {isVoicePost && item.record.$type === 'voiceflow.voice.post' ? (
            <VoicePlayer
              duration={(item.record as any).duration || 0}
              transcript={(item.record as any).transcript}
              mood={(item.record as any).mood}
            />
          ) : (
            <p className="mt-1 text-sm text-foreground whitespace-pre-wrap break-words leading-relaxed">
              {'text' in item.record ? item.record.text : ''}
            </p>
          )}

          {'embed' in item.record && (() => {
            const embed = (item.record as any).embed;
            if (!embed) return null;
            return (
              <div className="mt-2 overflow-hidden rounded-lg border border-border">
                {embed.$type === 'app.bsky.embed.images#view' && (
                  <div className="grid grid-cols-2 gap-0.5">
                    {embed.images?.map((img: any, i: number) => (
                      <img
                        key={i}
                        src={img.thumb || img.image?.ref?.$link}
                        alt={img.alt || ''}
                        className="h-48 w-full object-cover"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
                {embed.$type === 'app.bsky.embed.external#view' && (
                  <div className="flex flex-col p-3">
                    {embed.external?.thumb && (
                      <img
                        src={embed.external.thumb}
                        alt=""
                        className="mb-2 h-40 w-full rounded object-cover"
                        loading="lazy"
                      />
                    )}
                    <p className="text-sm font-medium text-foreground">
                      {embed.external?.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {embed.external?.description}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Actions */}
          <div className="mt-2 flex items-center gap-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/feed/${encodeURIComponent(item.uri)}`);
              }}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-brand transition-colors"
              aria-label="Reply"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs tabular-nums">{item.replyCount || ''}</span>
            </button>

            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center gap-1.5 transition-colors ${
                liked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
              }`}
              aria-label={liked ? 'Unlike' : 'Like'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill={liked ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={liked ? 0 : 1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs tabular-nums">{likeCount || ''}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                const url = `${window.location.origin}/feed/${encodeURIComponent(item.uri)}`;
                navigator.clipboard.writeText(url);
              }}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-brand transition-colors"
              aria-label="Share"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
