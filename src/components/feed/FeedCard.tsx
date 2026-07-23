'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/avatar';
import { BlueskyVideoPlayer } from '@/components/feed/BlueskyVideoPlayer';
import { useState, useRef, useEffect, useCallback } from 'react';
import { formatRelativeTime } from '@/lib/time';
import { motion } from 'framer-motion';
import { useSpells } from '@/hooks/useSpells';
import {
  Repeat,
  MoreHorizontal,
  Trash2,
  MessageCircle,
  Heart,
  Share2,
} from 'lucide-react';
import { BookmarkButton } from '@/components/feed/BookmarkButton';
import { DownloadButton } from '@/components/feed/DownloadButton';
import { ImageCarousel } from '@/components/feed/ImageCarousel';
import type { FeedItem } from '@/types/atproto';

interface FeedCardProps {
  item: FeedItem;
  reason?: { $type: string; by: { handle: string; displayName?: string; avatar?: string } };
  hideAvatar?: boolean;
}

export function FeedCard({ item, reason, hideAvatar }: FeedCardProps) {
  const router = useRouter();
  const { session } = useAuth();
  const [liked, setLiked] = useState(!!item.viewer?.like);
  const [likeCount, setLikeCount] = useState(item.likeCount);
  const [isLiking, setIsLiking] = useState(false);
  const [reposted, setReposted] = useState(!!item.viewer?.repost);
  const [repostCount, setRepostCount] = useState(item.repostCount);
  const [isReposting, setIsReposting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
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

  const isOwnPost = session?.did === item.author.did;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session || isDeleting || !isOwnPost) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/interact/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: item.uri }),
      });
      if (res.ok) {
        setDeleted(true);
        setShowMenu(false);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (deleted) return null;

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session || isLiking) return;
    setIsLiking(true);
    const wasLiked = liked;
    const prevCount = likeCount;
    setLiked(!wasLiked);
    setLikeCount((c) => (wasLiked ? Math.max(0, c - 1) : c + 1));
    try {
      if (wasLiked && item.viewer?.like) {
        const res = await fetch('/api/interact/unlike', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ likeUri: item.viewer.like }),
        });
        if (!res.ok) { setLiked(true); setLikeCount(prevCount); }
      } else {
        const res = await fetch('/api/interact/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uri: item.uri, cid: item.cid }),
        });
        if (!res.ok) { setLiked(false); setLikeCount(prevCount); }
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount(prevCount);
    } finally { setIsLiking(false); }
  }, [session, isLiking, liked, likeCount, item.uri, item.cid, item.viewer?.like]);

  const handleRepost = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session || isReposting) return;
    setIsReposting(true);
    const wasReposted = reposted;
    const prevCount = repostCount;
    setReposted(!wasReposted);
    setRepostCount((c) => (wasReposted ? Math.max(0, c - 1) : c + 1));
    try {
      if (wasReposted && item.viewer?.repost) {
        const res = await fetch('/api/interact/repost', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repostUri: item.viewer.repost }),
        });
        if (!res.ok) { setReposted(true); setRepostCount(prevCount); }
      } else {
        const res = await fetch('/api/interact/repost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uri: item.uri, cid: item.cid }),
        });
        if (!res.ok) { setReposted(false); setRepostCount(prevCount); }
      }
    } catch {
      setReposted(wasReposted);
      setRepostCount(prevCount);
    } finally { setIsReposting(false); }
  }, [session, isReposting, reposted, repostCount, item.uri, item.cid, item.viewer?.repost]);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/feed/${encodeURIComponent(item.uri)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const spells = useSpells();
  const authorDisplay = item.author.displayName || item.author.handle;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={() => router.push(`/feed/${encodeURIComponent(item.uri)}`)}
      className="feed-card"
    >
      {!spells.hideAvatar && !hideAvatar && (
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/profile/${item.author.handle}`); }}
          className="shrink-0"
        >
          <Avatar src={item.author.avatar} alt={authorDisplay} size="lg" />
        </button>
      )}

      <div className="min-w-0 flex-1">
        {/* Repost reason */}
        {reason?.$type === 'app.bsky.feed.defs#reasonRepost' && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
            <Repeat className="h-4 w-4" />
            {reason.by.displayName || reason.by.handle} reposted
          </p>
        )}

        {/* Author row */}
        <div className="flex items-center gap-2.5">
          {!spells.hideDisplayName && (
            <span className="text-[17px] font-semibold text-foreground truncate">
              {authorDisplay}
            </span>
          )}
          {!spells.hideHandle && (
            <span className="shrink-0 text-[15px] text-muted-foreground">
              @{item.author.handle}
            </span>
          )}
          <span className="shrink-0 text-[15px] text-muted-foreground">·</span>
          <span className="shrink-0 text-[15px] text-muted-foreground">
            {formatRelativeTime(item.indexedAt)}
          </span>

          <div className="relative ml-auto" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1.5 rounded-full hover:bg-brand/10 transition-colors"
              aria-label="Post options"
            >
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                <button
                  onClick={(e) => { e.stopPropagation(); handleRepost(e); setShowMenu(false); }}
                  disabled={isReposting}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <Repeat className="h-4.5 w-4.5" />
                  {reposted ? 'Undo repost' : 'Repost'}
                </button>
                {isOwnPost && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                    {isDeleting ? 'Deleting...' : 'Delete post'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Post text */}
        <p className="mt-2 text-[17px] text-foreground whitespace-pre-wrap break-words leading-relaxed">
          {item.record.text}
        </p>

        {/* Embedded media */}
        {(() => {
          const em = item.record.embed;
          if (!em) return null;
          const t = em.$type || '';

          if ((t.includes('images') || t.includes('image')) && em.images?.length) {
            const isMulti = em.images.length > 1;
            if (isMulti) {
              return (
                <div className="mt-3 overflow-hidden rounded-2xl">
                  <ImageCarousel
                    images={em.images.map((img: any) => ({ thumb: img.thumb, fullsize: img.fullsize, alt: img.alt || '' }))}
                    className="max-h-96"
                  />
                </div>
              );
            }
            return (
              <div className="mt-3 overflow-hidden rounded-2xl">
                <img
                  src={em.images[0].thumb || em.images[0].fullsize}
                  alt={em.images[0].alt || ''}
                  className="w-full object-cover max-h-96"
                  loading="lazy"
                />
              </div>
            );
          }

          if (t.includes('video')) {
            return <BlueskyVideoPlayer item={item} variant="inline" />;
          }

          if (t.includes('external')) {
            const ext = em.external;
            return ext ? (
              <div className="mt-3 overflow-hidden rounded-2xl border border-border">
                {ext.thumb && (
                  <img src={ext.thumb} alt="" className="w-full h-52 object-cover" loading="lazy" />
                )}
                <div className="p-5">
                  <p className="text-[17px] font-semibold text-foreground">{ext.title}</p>
                  <p className="text-[15px] text-muted-foreground line-clamp-2 mt-1.5">{ext.description}</p>
                  <p className="text-[14px] text-blue mt-2 truncate">{ext.uri}</p>
                </div>
              </div>
            ) : null;
          }

          if (t.includes('record')) {
            return (
              <div className="mt-3 p-5 rounded-2xl border border-border text-[15px] text-muted-foreground bg-surface-elevated/50">
                Quoted post
              </div>
            );
          }

          return null;
        })()}

        {/* Interaction row */}
        {!spells.hideAllInteractions && (
          <div className="flex items-center gap-1 mt-3 -ml-3">
            <button
              onClick={(e) => { e.stopPropagation(); router.push(`/feed/${encodeURIComponent(item.uri)}`); }}
              className="interact-btn"
              aria-label="Reply"
              disabled={spells.disableReply}
            >
              <MessageCircle className="h-5 w-5" />
              {!spells.hideEngagementMetrics && (
                <span className="tabular-nums">{item.replyCount || ''}</span>
              )}
            </button>

            <button
              onClick={handleLike}
              disabled={isLiking || spells.disableLike}
              className={`interact-btn ${liked ? 'liked' : ''}`}
              aria-label={liked ? 'Unlike' : 'Like'}
            >
              <motion.div
                key={liked ? 'liked' : 'unliked'}
                initial={liked ? { scale: 1.5 } : false}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="flex items-center gap-1"
              >
                <Heart
                  className="h-5 w-5"
                  fill={liked ? 'currentColor' : 'none'}
                  strokeWidth={liked ? 0 : 2}
                />
              </motion.div>
              {!spells.hideEngagementMetrics && (
                <motion.span
                  key={likeCount}
                  initial={{ scale: 1.3 }}
                  animate={{ scale: 1 }}
                  className="tabular-nums"
                >
                  {likeCount || ''}
                </motion.span>
              )}
            </button>

            <button
              onClick={handleRepost}
              disabled={isReposting || spells.disableRepost}
              className={`interact-btn ${reposted ? 'text-blue hover:text-blue-hover' : ''}`}
              aria-label={reposted ? 'Undo repost' : 'Repost'}
            >
              <Repeat className="h-5 w-5" />
              {!spells.hideEngagementMetrics && (
                <span className="tabular-nums">{repostCount || ''}</span>
              )}
            </button>

            <button
              onClick={handleShare}
              className="interact-btn"
              aria-label="Share"
            >
              <Share2 className="h-5 w-5" />
            </button>

            <BookmarkButton item={item} />

            <DownloadButton item={item} />
          </div>
        )}
      </div>
    </motion.article>
  );
}
