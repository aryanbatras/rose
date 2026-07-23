'use server';

import { BskyAgent } from '@atproto/api';

export type ThreadgateSetting = 'anyone' | 'nobody' | 'followers' | 'mentioned';

export async function createThreadGate(
  agent: BskyAgent,
  postUri: string,
  setting: ThreadgateSetting,
  mentionedDids?: string[]
): Promise<string | null> {
  if (setting === 'anyone') return null;

  const record: any = {
    $type: 'app.bsky.graph.threadgate',
    createdAt: new Date().toISOString(),
    post: postUri,
  };

  const allow: any[] = [];

  if (setting === 'nobody') {
    // Empty allow = nobody can reply
  } else if (setting === 'followers') {
    allow.push({ $type: 'app.bsky.graph.threadgate#followersRule' });
  } else if (setting === 'mentioned' && mentionedDids?.length) {
    allow.push({
      $type: 'app.bsky.graph.threadgate#mentionRule',
      mentioned: mentionedDids.map((did) => ({ did })),
    });
  }

  if (allow.length > 0) {
    record.allow = allow;
  }

  const result = await agent.com.atproto.repo.createRecord({
    repo: agent.session!.did,
    collection: 'app.bsky.graph.threadgate',
    record,
  });

  return (result as any).uri || null;
}
