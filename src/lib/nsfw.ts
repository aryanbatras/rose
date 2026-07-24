const NSFW_LABELS = new Set(['porn', 'sexual', 'nudity', 'graphic-media']);

export function isNsfwPost(item: any): boolean {
  const post = item.post || item;
  const postLabels = post.labels || [];
  if (postLabels.some((l: any) => NSFW_LABELS.has(l.val))) return true;
  const authorLabels = post.author?.labels || [];
  if (authorLabels.some((l: any) => NSFW_LABELS.has(l.val))) return true;
  return false;
}

export function filterNsfw<T>(items: T[]): T[] {
  return items.filter((item: any) => !isNsfwPost(item));
}
