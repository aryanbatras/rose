'use client';

import { FeedCard } from './FeedCard';

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

const MAX_DEPTH = 10;

/** Indentation per depth level in pixels */
const INDENT_PER_LEVEL = 40;

/** Colors for depth indicator lines — cycles after 3 */
const DEPTH_COLORS = [
  'var(--brand)',
  'var(--blue)',
  'var(--muted-foreground)',
];

export function ReplyThread({ replies, depth = 0 }: ReplyThreadProps) {
  if (!replies?.length) return null;

  if (depth >= MAX_DEPTH) {
    return (
      <div
        className="py-3 text-sm text-muted-foreground italic"
        style={{ paddingLeft: depth > 0 ? 12 + INDENT_PER_LEVEL : 12 }}
      >
        … continued deeper
      </div>
    );
  }

  const lineColor = DEPTH_COLORS[depth % DEPTH_COLORS.length];

  return (
    <>
      {replies.map((reply, index) => {
        const node = reply.post ? reply : { post: reply, replies: reply.replies };
        const post = node.post;
        if (!post?.uri) return null;

        const nestedReplies = reply.replies || node.replies || [];
        const hasNested = nestedReplies.length > 0;
        const isLast = index === replies.length - 1;

        return (
          <div key={post.uri || index} className="relative">
            {/* Vertical connector line — runs full height of this reply */}
            {depth >= 0 && (
              <div
                className="absolute top-0 bottom-0 w-px"
                style={{
                  left: 12 + depth * (INDENT_PER_LEVEL / 2),
                  backgroundColor: lineColor,
                  opacity: 0.25,
                }}
              />
            )}

            {/* Horizontal branch connector — from vertical line to card */}
            {depth >= 0 && (
              <div
                className="absolute top-[36px] h-px"
                style={{
                  left: 12 + depth * (INDENT_PER_LEVEL / 2),
                  width: 20,
                  backgroundColor: lineColor,
                  opacity: 0.25,
                }}
              />
            )}

            {/* The reply card itself — indented */}
            <div
              style={{ paddingLeft: depth >= 0 ? 12 + (depth + 1) * (INDENT_PER_LEVEL / 2) : 12 }}
            >
              <div
                className="rounded-r-lg transition-colors"
                style={{
                  borderLeft: `2px solid ${lineColor}`,
                  opacity: Math.max(1 - depth * 0.08, 0.6),
                }}
              >
                <FeedCard item={post} />
              </div>

              {/* Nested replies */}
              {hasNested && (
                <ReplyThread replies={nestedReplies} depth={depth + 1} />
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
