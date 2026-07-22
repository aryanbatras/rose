'use client';

import { FeedCard } from './FeedCard';

interface ReplyNode {
  post?: any;
  uri?: string;
  replies?: ReplyNode[];
  [key: string]: any;
}

interface ReplyThreadProps {
  replies: ReplyNode[];
  depth?: number;
}

const MAX_DEPTH = 10;

export function ReplyThread({ replies, depth = 0 }: ReplyThreadProps) {
  if (!replies?.length) return null;

  // Safety guard: don't render beyond MAX_DEPTH levels deep
  if (depth >= MAX_DEPTH) {
    return (
      <div className="ml-11 py-3 text-sm text-muted-foreground italic">
        … continued deeper
      </div>
    );
  }

  return (
    <>
      {replies.map((reply, index) => {
        const post = reply.post || reply;
        if (!post?.uri) return null;

        const hasNestedReplies = reply.replies && reply.replies.length > 0;

        return (
          <div key={post.uri || index} className="relative">
            {/* Vertical connector line */}
            {depth > 0 && (
              <div className="absolute left-[23px] inset-y-0 w-px bg-border" />
            )}

            {/* Horizontal branch connector */}
            {depth > 0 && (
              <div className="absolute left-[23px] top-[28px] w-[18px] h-px bg-border rounded-bl-lg" />
            )}

            <div className={depth > 0 ? 'ml-11' : ''}>
              <FeedCard item={post} />

              {/* Nested replies */}
              {hasNestedReplies && (
                <ReplyThread replies={reply.replies!} depth={depth + 1} />
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
