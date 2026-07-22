import { BskyAgent } from '@atproto/api';
import type { ConvoView, MessageView, GroupInfo, BasicProfileView } from '@/types/chat';

/**
 * Resolve a handle to a DID using the AT Protocol identity resolver.
 */
async function resolveHandle(agent: BskyAgent, handle: string): Promise<string | null> {
  try {
    const clean = handle.replace(/^@/, '');
    // If it's already a DID, return as-is
    if (clean.startsWith('did:')) return clean;
    const response = await agent.api.com.atproto.identity.resolveHandle({ handle: clean });
    return response.data.did;
  } catch {
    return null;
  }
}

/**
 * Normalize a Bluesky ConvoView into our GroupInfo type.
 */
function normalizeGroupInfo(convo: ConvoView): GroupInfo {
  const memberCount = convo.members?.length || 0;
  const memberNames = convo.members
    ?.slice(0, 3)
    .map((m) => m.displayName || m.handle) || [];

  // Try to get group name from the convo itself (for named groups)
  // Fallback to member names for unnamed group conversations
  const groupName = (convo as any).name || memberNames.join(', ') || 'Group';

  return {
    convoId: convo.id,
    name: groupName,
    memberCount,
    members: convo.members || [],
    lastMessage: convo.lastMessage || null,
    unreadCount: convo.unreadCount || 0,
    muted: convo.muted || false,
    createdAt: convo.rev || new Date().toISOString(),
  };
}

/**
 * List all group conversations for the current user.
 */
export async function listGroups(
  agent: BskyAgent,
  cursor?: string,
  limit = 30
): Promise<{ groups: GroupInfo[]; cursor?: string }> {
  try {
    const response = await (agent.api.chat.bsky.convo as any).listConvos({
      limit,
      cursor,
      kind: 'group',
      status: 'accepted',
    });
    const convos: ConvoView[] = response.data.convos || [];
    return {
      groups: convos.map((c: ConvoView) => normalizeGroupInfo(c)),
      cursor: response.data.cursor,
    };
  } catch (error) {
    console.error('listGroups error:', error);
    return { groups: [] };
  }
}

/**
 * Get details for a specific group conversation.
 */
export async function getGroup(
  agent: BskyAgent,
  convoId: string
): Promise<GroupInfo | null> {
  try {
    const response = await (agent.api.chat.bsky.convo as any).getConvo({ convoId });
    const convo: ConvoView = response.data.convo;
    return convo ? normalizeGroupInfo(convo) : null;
  } catch (error) {
    console.error('getGroup error:', error);
    return null;
  }
}

/**
 * Get members of a group conversation.
 */
export async function getGroupMembers(
  agent: BskyAgent,
  convoId: string
): Promise<BasicProfileView[]> {
  try {
    const response = await (agent.api.chat.bsky.convo as any).getConvoMembers({ convoId });
    return response.data.members || [];
  } catch (error) {
    console.error('getGroupMembers error:', error);
    return [];
  }
}

/**
 * Get messages from a group conversation.
 */
export async function getGroupMessages(
  agent: BskyAgent,
  convoId: string,
  cursor?: string,
  limit = 50
): Promise<{ messages: MessageView[]; cursor?: string }> {
  try {
    const response = await (agent.api.chat.bsky.convo as any).getMessages({
      convoId,
      limit,
      cursor,
    });
    return {
      messages: response.data.messages || [],
      cursor: response.data.cursor,
    };
  } catch (error) {
    console.error('getGroupMessages error:', error);
    return { messages: [] };
  }
}

/**
 * Create a new group conversation.
 * Resolves handles to DIDs first, then creates the group via XRPC.
 */
export async function createGroup(
  agent: BskyAgent,
  name: string,
  memberIdentifiers: string[]
): Promise<{ convoId?: string; error?: string }> {
  try {
    // Resolve all member identifiers (handles or DIDs) to DIDs in parallel
    const results = await Promise.allSettled(
      memberIdentifiers.map(async (identifier) => {
        const did = await resolveHandle(agent, identifier);
        if (!did) throw new Error(`Could not resolve ${identifier}`);
        return did;
      })
    );

    const dids: string[] = [];
    const errors: string[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        dids.push(result.value);
      } else {
        errors.push(result.reason?.message || 'Unknown error');
      }
    }

    if (dids.length === 0) {
      return { error: `Could not find any members. ${errors[0] || ''}` };
    }

    // Use a direct XRPC call to create the group
    // The group namespace may or may not be wired on the agent, so we use the raw XRPC client
    const response = await agent.api.xrpc.call(
      'chat.bsky.group.createGroup',
      {},
      { name, members: dids },
      { encoding: 'application/json' }
    );

    const convo: ConvoView = response.data?.convo;
    return { convoId: convo?.id };
  } catch (error: any) {
    console.error('createGroup error:', error);
    const message = error?.message || error?.statusText || 'Failed to create group';
    if (message.includes('AccountSuspended')) {
      return { error: 'Your account is suspended and cannot create groups.' };
    }
    if (message.includes('BlockedActor') || message.includes('BlockedByActor')) {
      return { error: 'You have blocked one of the selected members or they blocked you.' };
    }
    if (message.includes('RecipientNotFound')) {
      return { error: 'One or more members could not be found.' };
    }
    if (message.includes('UserForbidsGroups')) {
      return { error: 'One or more members do not allow group invitations.' };
    }
    return { error: message };
  }
}

/**
 * Send a message to a group conversation.
 */
export async function sendGroupMessage(
  agent: BskyAgent,
  convoId: string,
  text: string
): Promise<{ message?: MessageView; error?: string }> {
  try {
    const response = await agent.api.xrpc.call(
      'chat.bsky.convo.sendMessage',
      {},
      { convoId, message: { text } },
      { encoding: 'application/json' }
    );
    return { message: response.data?.message };
  } catch (error: any) {
    return { error: error?.message || 'Failed to send message' };
  }
}
