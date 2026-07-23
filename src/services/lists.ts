'use server';

import { BskyAgent } from '@atproto/api';
import { revalidatePath } from 'next/cache';

export interface ListView {
  uri: string;
  name: string;
  description?: string;
  avatar?: string;
  itemCount?: number;
  creator: { did: string; handle: string; displayName?: string; avatar?: string };
}

export async function getUserLists(
  agent: BskyAgent,
  actor: string,
  cursor?: string,
  limit = 50
): Promise<{ lists: ListView[]; cursor?: string }> {
  const response = await agent.app.bsky.graph.getLists({ actor, limit, cursor });
  const lists = (response.data.lists || []).map((list: any) => ({
    uri: list.uri,
    name: list.name,
    description: list.description,
    avatar: list.avatar,
    itemCount: list.listItemCount,
    creator: {
      did: list.creator.did,
      handle: list.creator.handle,
      displayName: list.creator.displayName,
      avatar: list.creator.avatar,
    },
  }));
  return { lists, cursor: response.data.cursor };
}

export async function getListItems(
  agent: BskyAgent,
  listUri: string,
  cursor?: string,
  limit = 50
): Promise<{ items: any[]; cursor?: string }> {
  const response = await agent.app.bsky.graph.getList({ list: listUri, limit, cursor });
  const items = (response.data.items || []).map((item: any) => ({
    did: item.subject.did,
    handle: item.subject.handle,
    displayName: item.subject.displayName,
    avatar: item.subject.avatar,
    description: item.subject.description,
    viewer: item.subject.viewer,
  }));
  return { items, cursor: response.data.cursor };
}

export async function createList(
  agent: BskyAgent,
  name: string,
  description?: string,
  purpose?: string
): Promise<string> {
  const result = await agent.app.bsky.graph.list.create(
    { repo: agent.session!.did },
    {
      name,
      description: description || '',
      purpose: purpose || 'app.bsky.graph.list#curateList',
      createdAt: new Date().toISOString(),
    }
  );
  revalidatePath('/lists');
  return result.uri;
}

export async function deleteList(
  agent: BskyAgent,
  listUri: string
): Promise<void> {
  const rkey = listUri.split('/').pop()!;
  await agent.app.bsky.graph.list.delete({ repo: agent.session!.did, rkey });
  revalidatePath('/lists');
}

export async function addToList(
  agent: BskyAgent,
  listUri: string,
  subjectDid: string
): Promise<void> {
  await agent.app.bsky.graph.listitem.create(
    { repo: agent.session!.did },
    {
      list: listUri,
      subject: subjectDid,
      createdAt: new Date().toISOString(),
    }
  );
}

export async function removeFromList(
  agent: BskyAgent,
  listUri: string,
  subjectDid: string
): Promise<void> {
  const response = await agent.app.bsky.graph.getList({ list: listUri, limit: 100 });
  const item = (response.data.items || []).find((i: any) => i.subject.did === subjectDid);
  if (item?.uri) {
    const rkey = item.uri.split('/').pop()!;
    await agent.app.bsky.graph.listitem.delete({ repo: agent.session!.did, rkey });
  }
}
