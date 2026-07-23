import type { FeedItem } from '@/types/atproto';
import type { AllFilters } from '@/types/atproto';

export function applyFilters(posts: FeedItem[], filters: AllFilters): FeedItem[] {
  let filtered = [...posts];

  // Content type filters
  if (filters.content.hideReposts) {
    filtered = filtered.filter((p) => !p.reason?.$type?.includes('reasonRepost'));
  }
  if (filters.content.mediaOnly) {
    filtered = filtered.filter((p) => {
      const em = p.record.embed;
      if (!em) return false;
      const t = em.$type || '';
      return t.includes('images') || t.includes('video');
    });
  }
  if (filters.content.videoOnly) {
    filtered = filtered.filter((p) => {
      const em = p.record.embed;
      if (!em) return false;
      return (em.$type || '').includes('video');
    });
  }
  if (filters.content.textOnly) {
    filtered = filtered.filter((p) => !p.record.embed);
  }

  // Muted words filter
  if (filters.mute.mutedWords.length > 0) {
    const lowerWords = filters.mute.mutedWords.map((w) => w.toLowerCase());
    filtered = filtered.filter((p) => {
      const text = (p.record.text || '').toLowerCase();
      return !lowerWords.some((w) => text.includes(w));
    });
  }

  // Muted tags filter
  if (filters.mute.mutedTags.length > 0) {
    const lowerTags = filters.mute.mutedTags.map((t) => t.toLowerCase());
    filtered = filtered.filter((p) => {
      const text = (p.record.text || '').toLowerCase();
      return !lowerTags.some((t) => text.includes('#' + t));
    });
  }

  return filtered;
}
