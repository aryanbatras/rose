'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/avatar';
import { BlueskyVideoPlayer } from '@/components/feed/BlueskyVideoPlayer';
import { useState, useRef, useEffect, useCallback } from 'react';
import { formatRelativeTime } from '@/lib/time';
import { motion } from 'framer-motion';
import { useSpells } from '@/hooks/useSpells';
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
    // Optimistic update for instant feedback
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
      {!spells.hideAvatar && (
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
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

          {isOwnPost && (
            <div className="relative ml-auto" ref={menuRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="p-1.5 rounded-full hover:bg-brand/10 transition-colors"
                aria-label="Post options"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {isDeleting ? 'Deleting...' : 'Delete post'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Post text - larger */}
        <p className="mt-2 text-[17px] text-foreground whitespace-pre-wrap break-words leading-relaxed">
          {item.record.text}
        </p>

        {/* Embedded media - larger images */}
        {(() => {
          const em = item.record.embed;
          if (!em) return null;
          const t = em.$type || '';

          // Images
          if ((t.includes('images') || t.includes('image')) && em.images?.length) {
            const isMulti = em.images.length > 1;
            return (
              <div className={`mt-3 overflow-hidden rounded-2xl ${isMulti ? 'grid grid-cols-2 gap-1' : ''}`}>
                {em.images.map((img: any, i: number) => (
                  <img
                    key={i}
                    src={img.thumb || img.fullsize}
                    alt={img.alt || ''}
                    className="w-full object-cover max-h-96"
                    loading="lazy"
                  />
                ))}
              </div>
            );
          }

          // Video
          if (t.includes('video')) {
            return <BlueskyVideoPlayer item={item} variant="inline" />;
          }

          // External link
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

          // Record/quote
          if (t.includes('record')) {
            return (
              <div className="mt-3 p-5 rounded-2xl border border-border text-[15px] text-muted-foreground bg-surface-elevated/50">
                Quoted post
              </div>
            );
          }

          return null;
        })()}

        {/* Interaction row - larger */}
        {!spells.hideAllInteractions && (
          <div className="flex items-center gap-1 mt-3 -ml-3">
            <button
              onClick={(e) => { e.stopPropagation(); router.push(`/feed/${encodeURIComponent(item.uri)}`); }}
              className="interact-btn"
              aria-label="Reply"
              disabled={spells.disableReply}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
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
                <svg
                  fill={liked ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={liked ? 0 : 2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {!spells.hideEngagementMetrics && (
                <span className="tabular-nums">{repostCount || ''}</span>
              )}
            </button>

            <button
              onClick={handleShare}
              className="interact-btn"
              aria-label="Share"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </motion.article>
  );
}
