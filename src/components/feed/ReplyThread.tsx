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

/** Indentation per depth level — Instagram uses ~12-16px */
const INDENT_PER_LEVEL = 16;

/** Colors for the left border thread line — cycles after 4 */
const LINE_COLORS = [
  'var(--brand)',
  'var(--muted-foreground)',
  'var(--accent-foreground)',
  'var(--blue)',
];

export function ReplyThread({ replies, depth = 0 }: ReplyThreadProps) {
  if (!replies?.length) return null;

  if (depth >= MAX_DEPTH) {
    return (
      <div
        className="py-3 text-sm text-muted-foreground/60 italic"
        style={{ paddingLeft: 12 + depth * INDENT_PER_LEVEL }}
      >
        … continued deeper
      </div>
    );
  }

  const lineColor = LINE_COLORS[depth % LINE_COLORS.length];

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
            {/* Thin vertical thread line — tracks with content indent per depth */}
            <div
              className="absolute top-0 bottom-0 w-px"
              style={{
                left: depth * INDENT_PER_LEVEL + 18,
                backgroundColor: lineColor,
                opacity: 0.18,
              }}
            />

            {/* The reply content — minimal indent */}
            <div
              className="relative"
              style={{ paddingLeft: depth * INDENT_PER_LEVEL + 12 }}
            >
              {/* Small dot at the connector point — aligns with the vertical line */}
              <div
                className="absolute top-[22px] h-2 w-2 rounded-full"
                style={{
                  left: 6,
                  backgroundColor: lineColor,
                  opacity: 0.35,
                }}
              />

              {/* Left accent border + actual card */}
              <div
                className="rounded-r-xl transition-colors"
                style={{
                  borderLeft: `2px solid ${lineColor}`,
                  borderLeftWidth: '2px',
                  borderLeftStyle: 'solid',
                  borderLeftColor: lineColor,
                  opacity: 1,
                }}
              >
                <div className="pl-3 py-1">
                  <FeedCard item={post} />
                </div>
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
