import type { FeedItem } from '@/types/atproto';
import { toast } from 'sonner';

export function hasMedia(item: FeedItem): boolean {
  const em = item.record.embed;
  if (!em) return false;
  const t = em.$type || '';
  return (
    ((t.includes('images') || t.includes('image')) && !!em.images?.length) ||
    (t.includes('video') && !!(em.playlist || em.video?.playlist))
  );
}

export function getMediaUrls(item: FeedItem): {
  images?: Array<{ fullsize: string; thumb: string; alt: string }>;
  videoPlaylist?: string;
} {
  const em = item.record.embed;
  if (!em) return {};

  const t = em.$type || '';
  const result: ReturnType<typeof getMediaUrls> = {};

  if ((t.includes('images') || t.includes('image')) && em.images?.length) {
    result.images = em.images.map((img) => ({
      fullsize: img.fullsize,
      thumb: img.thumb,
      alt: img.alt || '',
    }));
  }

  if (t.includes('video')) {
    result.videoPlaylist = em.playlist || em.video?.playlist;
  }

  return result;
}

function generateFilename(item: FeedItem, index?: number, ext?: string): string {
  const handle = item.author.handle.replace(/[^a-z0-9.-]/gi, '_');
  const date = (item.record.createdAt || item.indexedAt).split('T')[0];
  const idx = index !== undefined ? `_${index + 1}` : '';
  const extension = ext || 'jpg';
  return `${handle}_${date}${idx}.${extension}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadImage(url: string, filename: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch image');
  const blob = await res.blob();
  triggerDownload(blob, filename);
}

export async function downloadVideo(
  playlistUrl: string,
  filename: string
): Promise<void> {
  const res = await fetch(playlistUrl);
  if (!res.ok) throw new Error('Failed to fetch video');
  const blob = await res.blob();
  triggerDownload(blob, filename);
  toast.success('Video saved');
}

export async function downloadMedia(item: FeedItem): Promise<void> {
  const urls = getMediaUrls(item);

  if (urls.images?.length) {
    const count = urls.images.length;
    if (count === 1) {
      const filename = generateFilename(item, undefined, 'jpg');
      toast('Downloading image...');
      await downloadImage(urls.images[0].fullsize, filename);
      toast.success('Image saved');
    } else {
      for (let i = 0; i < count; i++) {
        toast(`Downloading ${i + 1} of ${count}...`);
        const filename = generateFilename(item, i, 'jpg');
        await downloadImage(urls.images[i].fullsize, filename);
      }
      toast.success(`Saved ${count} images`);
    }
  } else if (urls.videoPlaylist) {
    const filename = generateFilename(item, undefined, 'mp4');
    toast('Downloading video...');
    await downloadVideo(urls.videoPlaylist, filename);
  }
}
