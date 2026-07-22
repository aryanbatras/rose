'use server';

import { BskyAgent } from '@atproto/api';
import { revalidatePath } from 'next/cache';
import type { ActorView, PaginatedResponse } from '@/types/atproto';

export async function getFollows(
  agent: BskyAgent,
  actor: string,
  cursor?: string,
  limit = 100
): Promise<PaginatedResponse<ActorView>> {
  const response = await agent.getFollows({ actor, limit, cursor });
  return {
    items: response.data.follows.map((f: any) => ({
      did: f.did,
      handle: f.handle,
      displayName: f.displayName,
      avatar: f.avatar,
      viewer: f.viewer,
    })),
    cursor: response.data.cursor,
  };
}

export async function getFollowers(
  agent: BskyAgent,
  actor: string,
  cursor?: string,
  limit = 100
): Promise<PaginatedResponse<ActorView>> {
  const response = await agent.getFollowers({ actor, limit, cursor });
  return {
    items: response.data.followers.map((f: any) => ({
      did: f.did,
      handle: f.handle,
      displayName: f.displayName,
      avatar: f.avatar,
      viewer: f.viewer,
    })),
    cursor: response.data.cursor,
  };
}

export async function followUser(
  agent: BskyAgent,
  subjectDid: string
): Promise<string> {
  const result = await agent.follow(subjectDid);
  revalidatePath('/');
  return result.uri;
}

export async function unfollowUser(
  agent: BskyAgent,
  followUri: string
): Promise<void> {
  await agent.deleteFollow(followUri);
  revalidatePath('/');
}

export async function searchActors(
  agent: BskyAgent,
  term: string,
  limit = 25
): Promise<ActorView[]> {
  const response = await agent.app.bsky.actor.searchActors({ term, limit });
  const actors = (response as any).data?.actors || (response as any).actors || [];
  return actors.map((a: any) => ({
    did: a.did,
    handle: a.handle,
    displayName: a.displayName,
    avatar: a.avatar,
    description: a.description,
    followersCount: a.followersCount,
    viewer: a.viewer,
  }));
}

export async function getProfile(
  agent: BskyAgent,
  actor: string
): Promise<any> {
  const response = await agent.getProfile({ actor });
  return response.data;
}

export async function updateProfile(
  agent: BskyAgent,
  updates: {
    displayName?: string;
    description?: string;
    avatarBlob?: any;
    bannerBlob?: any;
  }
): Promise<void> {
  await agent.upsertProfile((existing: any) => {
    const updated = { ...existing };
    if (updates.displayName !== undefined) updated.displayName = updates.displayName;
    if (updates.description !== undefined) updated.description = updates.description;
    if (updates.avatarBlob) updated.avatar = updates.avatarBlob;
    if (updates.bannerBlob) updated.banner = updates.bannerBlob;
    return updated;
  });
  revalidatePath('/');
}

export async function getSuggestions(
  agent: BskyAgent,
  limit = 20
): Promise<{ did: string; handle: string; displayName?: string; avatar?: string; count: number }[]> {
  const myDid = agent.session!.did;
  const followsRes = await agent.getFollows({ actor: myDid, limit: 100 });
  const myFollows = followsRes.data.follows.map((f: any) => f.did);

  const secondDegreePromises = myFollows.slice(0, 10).map((did: string) =>
    agent.getFollows({ actor: did, limit: 50 }).then(r =>
      r.data.follows.map((f: any) => f.did)
    ).catch(() => [])
  );

  const results = await Promise.allSettled(secondDegreePromises);
  const allSecondDegree = results.flatMap(r =>
    r.status === 'fulfilled' ? r.value : []
  );

  const freq = new Map<string, number>();
  for (const did of allSecondDegree) {
    if (did !== myDid && !myFollows.includes(did)) {
      freq.set(did, (freq.get(did) || 0) + 1);
    }
  }

  const topDids = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([did]) => did);

  const profiles = await Promise.all(
    topDids.map(did =>
      agent.getProfile({ actor: did }).then(r => r.data).catch(() => null)
    )
  );

  return profiles
    .filter(Boolean)
    .map((p: any) => ({
      did: p.did,
      handle: p.handle,
      displayName: p.displayName,
      avatar: p.avatar,
      count: freq.get(p.did) || 0,
    }));
}

export async function getBlocks(agent: BskyAgent): Promise<any[]> {
  const response = await agent.app.bsky.graph.getBlocks({ limit: 100 });
  return (response as any).data?.blocked || (response as any).blocked || [];
}

export async function blockUser(
  agent: BskyAgent,
  did: string
): Promise<string> {
  const result = await agent.app.bsky.graph.block.create(
    { repo: agent.session!.did },
    { createdAt: new Date().toISOString(), subject: did },
  );
  return result.uri;
}

export async function unblockUser(
  agent: BskyAgent,
  blockUri: string
): Promise<void> {
  await agent.app.bsky.graph.block.delete({ repo: agent.session!.did, rkey: blockUri.split('/').pop()! });
}

export async function muteUser(
  agent: BskyAgent,
  did: string
): Promise<void> {
  await agent.mute(did);
}

export async function unmuteUser(
  agent: BskyAgent,
  did: string
): Promise<void> {
  await agent.unmute(did);
}

export async function getMutes(agent: BskyAgent): Promise<any[]> {
  const response = await agent.app.bsky.graph.getMutes({ limit: 100 });
  return (response as any).data?.muted || (response as any).muted || [];
}
