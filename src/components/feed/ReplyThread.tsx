'use client';

import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { formatRelativeTime } from '@/lib/time';
import { Heart } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { RichText } from '@/lib/rich-text';

interface ThreadNode {
  post?: any;
  uri?: string;
  replies?: ThreadNode[];
  depth?: number;
  [key: string]: any;
}

interface ReplyThreadProps {
  replies: ThreadNode[];
  depth?: number;
}

export function ReplyThread({ replies, depth = 0 }: ReplyThreadProps) {
  if (!replies?.length) return null;

  return (
    <div className="flex flex-col gap-1.5 py-2">
      {replies.map((reply, index) => {
        const node = reply.post ? reply : { post: reply, replies: reply.replies };
        const post = node.post;
        if (!post?.uri) return null;

        const nestedReplies = reply.replies || node.replies || [];

        return (
          <CommentItem
            key={post.uri || index}
            post={post}
            depth={depth}
            nestedReplies={nestedReplies}
          />
        );
      })}
    </div>
  );
}

function CommentItem({
  post,
  depth,
  nestedReplies,
}: {
  post: any;
  depth: number;
  nestedReplies: ThreadNode[];
}) {
  const router = useRouter();
  const { session } = useAuth();
  const [liked, setLiked] = useState(!!post.viewer?.like);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);

  const authorDisplay = post.author?.displayName || post.author?.handle || '';
  const handle = post.author?.handle || '';
  const text = post.record?.text || '';
  const avatar = post.author?.avatar;
  const time = post.indexedAt;

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session || isLiking) return;
    setIsLiking(true);
    const wasLiked = liked;
    const prevCount = likeCount;
    setLiked(!wasLiked);
    setLikeCount((c: number) => (wasLiked ? Math.max(0, c - 1) : c + 1));
    try {
      if (wasLiked && post.viewer?.like) {
        await fetch('/api/interact/unlike', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ likeUri: post.viewer.like }),
        });
      } else {
        await fetch('/api/interact/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uri: post.uri, cid: post.cid }),
        });
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  }, [session, isLiking, liked, likeCount, post.uri, post.cid, post.viewer?.like]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-surface-elevated/60 rounded-2xl"
      style={{ marginLeft: `${depth * 24}px` }}
    >
      <div className="px-4 py-3">
        <div className="flex gap-3">
          {/* Avatar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/profile/${handle}`);
            }}
            className="shrink-0"
          >
            <Avatar src={avatar} alt={authorDisplay} size="sm" />
          </button>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {/* Author + time */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/profile/${handle}`);
                }}
                className="text-sm font-semibold text-foreground hover:underline truncate"
              >
                {authorDisplay}
              </button>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatRelativeTime(time)}
              </span>
            </div>

            {/* Comment text */}
            <p className="mt-0.5 text-[15px] text-foreground leading-relaxed whitespace-pre-wrap break-words">
              <RichText text={text} facets={post.record?.facets} />
            </p>

            {/* Like button */}
            <div className="flex items-center gap-3 mt-1.5">
              <button
                onClick={handleLike}
                disabled={isLiking}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <Heart
                  className="h-3.5 w-3.5"
                  fill={liked ? 'currentColor' : 'none'}
                  strokeWidth={liked ? 0 : 2}
                />
                {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {nestedReplies.length > 0 && (
        <div className="px-4 pb-2">
          <ReplyThread replies={nestedReplies} depth={depth + 1} />
        </div>
      )}
    </motion.div>
  );
}
