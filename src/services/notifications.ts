'use server';

import { BskyAgent } from '@atproto/api';
import type { NotificationItem, PaginatedResponse } from '@/types/atproto';

export async function getNotifications(
  agent: BskyAgent,
  cursor?: string,
  limit = 50
): Promise<PaginatedResponse<NotificationItem>> {
  const response = await agent.listNotifications({ limit, cursor });

  const items: NotificationItem[] = (response.data.notifications || []).map((n: any) => ({
    uri: n.uri,
    cid: n.cid,
    author: {
      did: n.author.did,
      handle: n.author.handle,
      displayName: n.author.displayName,
      avatar: n.author.avatar,
    },
    reason: n.reason,
    reasonSubject: n.reasonSubject,
    record: {
      $type: n.record.$type || 'app.bsky.feed.post',
      text: n.record.text || '',
      createdAt: n.record.createdAt || n.indexedAt,
    },
    isRead: n.isRead,
    indexedAt: n.indexedAt,
    labels: n.labels,
  }));

  return {
    items,
    cursor: response.data.cursor,
  };
}

export async function markNotificationsRead(
  agent: BskyAgent
): Promise<void> {
  await agent.updateSeenNotifications(new Date().toISOString());
}

export async function getUnreadCount(
  agent: BskyAgent
): Promise<number> {
  const response = await agent.listNotifications({ limit: 1 });
  const notifications = response.data.notifications || [];
  return notifications.filter((n: any) => !n.isRead).length;
}
