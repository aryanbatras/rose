'use server';

import { BskyAgent } from '@atproto/api';
import { revalidatePath } from 'next/cache';

export interface StarterPackView {
  uri: string;
  name: string;
  description?: string;
  joinedCount?: number;
  list?: { uri: string; name: string; itemCount?: number };
  creator: { did: string; handle: string; displayName?: string; avatar?: string };
  createdAt: string;
}

export async function getStarterPack(
  agent: BskyAgent,
  uri: string
): Promise<any> {
  const response = await agent.app.bsky.graph.getStarterPack({ starterPack: uri });
  return response.data;
}

export async function createStarterPack(
  agent: BskyAgent,
  name: string,
  description: string,
  listUri: string,
  feedUris?: string[]
): Promise<string> {
  const result = await agent.app.bsky.graph.starterpack.create(
    { repo: agent.session!.did },
    {
      name,
      description,
      list: listUri,
      feeds: feedUris?.map((uri) => ({ uri })),
      createdAt: new Date().toISOString(),
    }
  );
  revalidatePath('/discover');
  return result.uri;
}

export async function deleteStarterPack(
  agent: BskyAgent,
  uri: string
): Promise<void> {
  const rkey = uri.split('/').pop()!;
  await agent.app.bsky.graph.starterpack.delete({ repo: agent.session!.did, rkey });
  revalidatePath('/discover');
}
