import React from 'react';
import type { Facet } from '@/types/atproto';

interface RichTextProps {
  text: string;
  facets?: Facet[];
  className?: string;
}

interface Segment {
  text: string;
  type?: 'mention' | 'link' | 'tag';
  value?: string;
}

function decodeText(buffer: Uint8Array): string {
  return new TextDecoder().decode(buffer);
}

function encodeText(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function parseFacets(text: string, facets?: Facet[]): Segment[] {
  if (!facets || facets.length === 0) {
    return [{ text }];
  }

  const textBytes = encodeText(text);
  const segments: Segment[] = [];
  let lastEnd = 0;

  const sorted = [...facets].sort(
    (a, b) => a.index.byteStart - b.index.byteStart
  );

  for (const facet of sorted) {
    const { byteStart, byteEnd } = facet.index;

    if (byteStart > lastEnd) {
      segments.push({
        text: decodeText(textBytes.slice(lastEnd, byteStart)),
      });
    }

    const segmentText = decodeText(textBytes.slice(byteStart, byteEnd));
    const feature = facet.features[0];

    if (!feature) {
      segments.push({ text: segmentText });
      lastEnd = byteEnd;
      continue;
    }

    switch (feature.$type) {
      case 'app.bsky.richtext.facet#mention':
        segments.push({
          text: segmentText,
          type: 'mention',
          value: feature.did,
        });
        break;
      case 'app.bsky.richtext.facet#link':
        segments.push({
          text: segmentText,
          type: 'link',
          value: feature.uri,
        });
        break;
      case 'app.bsky.richtext.facet#tag':
        segments.push({
          text: segmentText,
          type: 'tag',
          value: feature.tag,
        });
        break;
      default:
        segments.push({ text: segmentText });
    }

    lastEnd = byteEnd;
  }

  if (lastEnd < textBytes.length) {
    segments.push({
      text: decodeText(textBytes.slice(lastEnd)),
    });
  }

  return segments;
}

export function RichText({ text, facets, className }: RichTextProps) {
  const segments = parseFacets(text, facets);

  return (
    <span className={className}>
      {segments.map((segment, i) => {
        if (!segment.type) {
          return <span key={i}>{segment.text}</span>;
        }

        if (segment.type === 'mention') {
          return (
            <a
              key={i}
              href={`/profile/${segment.text.replace('@', '')}`}
              onClick={(e) => e.stopPropagation()}
              className="text-blue hover:underline font-medium"
            >
              {segment.text}
            </a>
          );
        }

        if (segment.type === 'link') {
          return (
            <a
              key={i}
              href={segment.value}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-blue hover:underline"
            >
              {segment.text}
            </a>
          );
        }

        if (segment.type === 'tag') {
          return (
            <a
              key={i}
              href={`/search?q=${encodeURIComponent('#' + (segment.value || segment.text))}`}
              onClick={(e) => e.stopPropagation()}
              className="text-blue hover:underline"
            >
              {segment.text}
            </a>
          );
        }

        return <span key={i}>{segment.text}</span>;
      })}
    </span>
  );
}
