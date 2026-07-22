import { BskyAgent } from '@atproto/api';
import type {
  ConvoView,
  MessageView,
  GroupInfo,
  BasicProfileView,
  JoinLinkPreview,
  JoinLink,
  JoinResult,
  JoinRule,
  JoinRequestView,
} from '@/types/chat';

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
 * Preview one or more join links by their codes.
 */
export async function getJoinLinkPreviews(
  agent: BskyAgent,
  codes: string[]
): Promise<{ previews: JoinLinkPreview[] }> {
  try {
    const response = await (agent.api.chat.bsky.group as any).getJoinLinkPreviews({
      codes,
    });
    const rawPreviews = response.data?.joinLinkPreviews || [];
    const previews: JoinLinkPreview[] = rawPreviews.map((p: any) => {
      if (p.$type?.includes('joinLinkPreviewView')) {
        return {
          status: 'valid' as const,
          code: p.code,
          convoId: p.convoId,
          name: p.name,
          owner: p.owner ? {
            did: p.owner.did,
            handle: p.owner.handle,
            displayName: p.owner.displayName,
            avatar: p.owner.avatar,
          } : undefined,
          memberCount: p.memberCount,
          memberLimit: p.memberLimit,
          requireApproval: p.requireApproval,
          joinRule: p.joinRule,
        };
      }
      if (p.$type?.includes('disabledJoinLinkPreviewView')) {
        return { status: 'disabled' as const, code: p.code };
      }
      return { status: 'invalid' as const, code: p.code };
    });
    return { previews };
  } catch (error) {
    console.error('getJoinLinkPreviews error:', error);
    return { previews: [] };
  }
}

/**
 * Request to join a group using a join link code.
 */
export async function requestJoinGroup(
  agent: BskyAgent,
  code: string
): Promise<{ result?: JoinResult; error?: string; errorType?: string }> {
  try {
    const response = await (agent.api.chat.bsky.group as any).requestJoin({ code });
    const data = response.data;
    return {
      result: {
        status: data.status,
        convo: data.convo,
      },
    };
  } catch (error: any) {
    const message = error?.message || error?.error || 'Failed to join group';
    // Map known error types
    if (message.includes('InvalidCode') || message.includes('InvalidCodeError')) {
      return { error: 'This invite code is invalid or has expired.', errorType: 'invalid_code' };
    }
    if (message.includes('LinkDisabled') || message.includes('LinkDisabledError')) {
      return { error: 'This join link has been disabled by the group owner.', errorType: 'link_disabled' };
    }
    if (message.includes('ConvoLocked') || message.includes('ConvoLockedError')) {
      return { error: 'This group is locked and not accepting new members.', errorType: 'convo_locked' };
    }
    if (message.includes('FollowRequired') || message.includes('FollowRequiredError')) {
      return { error: 'You need to follow the group owner before joining.', errorType: 'follow_required' };
    }
    if (message.includes('MemberLimitReached') || message.includes('MemberLimitReachedError')) {
      return { error: 'This group has reached its member limit.', errorType: 'member_limit' };
    }
    if (message.includes('UserKicked') || message.includes('UserKickedError')) {
      return { error: 'You have been removed from this group and cannot rejoin.', errorType: 'user_kicked' };
    }
    return { error: message, errorType: 'unknown' };
  }
}

/**
 * Create a join link for a group.
 */
export async function createJoinLink(
  agent: BskyAgent,
  convoId: string,
  joinRule: JoinRule = 'anyone',
  requireApproval = false
): Promise<{ joinLink?: JoinLink; error?: string }> {
  try {
    const response = await (agent.api.chat.bsky.group as any).createJoinLink({
      convoId,
      joinRule,
      requireApproval,
    });
    const link = response.data?.joinLink;
    if (!link) return { error: 'No join link returned' };
    return {
      joinLink: {
        code: link.code,
        enabledStatus: link.enabledStatus,
        requireApproval: link.requireApproval,
        joinRule: link.joinRule,
        createdAt: link.createdAt,
      },
    };
  } catch (error: any) {
    const message = error?.message || 'Failed to create join link';
    if (message.includes('EnabledJoinLinkAlreadyExists')) {
      return { error: 'A join link already exists for this group. Disable it first to create a new one.' };
    }
    return { error: message };
  }
}

/**
 * Disable a join link for a group.
 */
export async function disableJoinLink(
  agent: BskyAgent,
  convoId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    await (agent.api.chat.bsky.group as any).disableJoinLink({ convoId });
    return { success: true };
  } catch (error: any) {
    return { error: error?.message || 'Failed to disable join link' };
  }
}

/**
 * Enable a join link for a group.
 */
export async function enableJoinLink(
  agent: BskyAgent,
  convoId: string
): Promise<{ joinLink?: JoinLink; error?: string }> {
  try {
    const response = await (agent.api.chat.bsky.group as any).enableJoinLink({ convoId });
    const link = response.data?.joinLink;
    if (!link) return { error: 'No join link returned' };
    return {
      joinLink: {
        code: link.code,
        enabledStatus: link.enabledStatus,
        requireApproval: link.requireApproval,
        joinRule: link.joinRule,
        createdAt: link.createdAt,
      },
    };
  } catch (error: any) {
    return { error: error?.message || 'Failed to enable join link' };
  }
}

/**
 * Add members to a group conversation.
 * Resolves handles to DIDs before calling the API.
 */
export async function addGroupMembers(
  agent: BskyAgent,
  convoId: string,
  memberIdentifiers: string[]
): Promise<{ convo?: ConvoView; addedMembers?: BasicProfileView[]; error?: string }> {
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
        errors.push(result.reason?.message || 'Unknown');
      }
    }

    if (dids.length === 0) {
      return { error: `Could not resolve any members. ${errors[0] || ''}` };
    }

    const response = await (agent.api.chat.bsky.group as any).addMembers({
      convoId,
      members: dids,
    });
    return {
      convo: response.data?.convo,
      addedMembers: response.data?.addedMembers,
    };
  } catch (error: any) {
    const message = error?.message || 'Failed to add members';
    if (message.includes('MemberLimitReached')) {
      return { error: 'This group has reached its member limit.' };
    }
    if (message.includes('BlockedActor') || message.includes('BlockedByActor')) {
      return { error: 'You have blocked one of these members or they blocked you.' };
    }
    if (message.includes('UserForbidsGroups')) {
      return { error: 'One or more members do not allow group invitations.' };
    }
    if (message.includes('RecipientNotFound')) {
      return { error: 'One or more members could not be found.' };
    }
    return { error: message };
  }
}

/**
 * Remove members from a group conversation.
 */
export async function removeGroupMembers(
  agent: BskyAgent,
  convoId: string,
  memberDids: string[]
): Promise<{ convo?: ConvoView; error?: string }> {
  try {
    const response = await (agent.api.chat.bsky.group as any).removeMembers({
      convoId,
      members: memberDids,
    });
    return { convo: response.data?.convo };
  } catch (error: any) {
    return { error: error?.message || 'Failed to remove members' };
  }
}

/**
 * List pending join requests for a group.
 */
export async function listJoinRequests(
  agent: BskyAgent,
  convoId: string,
  cursor?: string,
  limit = 30
): Promise<{ requests: JoinRequestView[]; cursor?: string; error?: string }> {
  try {
    const response = await (agent.api.chat.bsky.group as any).listJoinRequests({
      convoId,
      limit,
      cursor,
    });
    return {
      requests: response.data?.requests || [],
      cursor: response.data?.cursor,
    };
  } catch (error: any) {
    return { error: error?.message || 'Failed to list join requests', requests: [] };
  }
}

/**
 * Approve a pending join request for a group.
 */
export async function approveJoinRequest(
  agent: BskyAgent,
  convoId: string,
  memberDid: string
): Promise<{ convo?: ConvoView; error?: string }> {
  try {
    const response = await (agent.api.chat.bsky.group as any).approveJoinRequest({
      convoId,
      member: memberDid,
    });
    return { convo: response.data?.convo };
  } catch (error: any) {
    return { error: error?.message || 'Failed to approve request' };
  }
}

/**
 * Reject a pending join request for a group.
 */
export async function rejectJoinRequest(
  agent: BskyAgent,
  convoId: string,
  memberDid: string
): Promise<{ error?: string }> {
  try {
    await (agent.api.chat.bsky.group as any).rejectJoinRequest({
      convoId,
      member: memberDid,
    });
    return {};
  } catch (error: any) {
    return { error: error?.message || 'Failed to reject request' };
  }
}

/**
 * List mutual groups (groups where both the current user and another user are members).
 */
export async function listMutualGroups(
  agent: BskyAgent,
  subject: string
): Promise<{ groups: GroupInfo[]; cursor?: string }> {
  try {
    const response = await (agent.api.chat.bsky.group as any).listMutualGroups({
      subject,
      limit: 30,
    });
    const convos: ConvoView[] = response.data?.convos || [];
    return {
      groups: convos.map((c: ConvoView) => normalizeGroupInfo(c)),
      cursor: response.data?.cursor,
    };
  } catch (error) {
    console.error('listMutualGroups error:', error);
    return { groups: [] };
  }
}

/**
 * Mute a group conversation (stop receiving notifications).
 */
export async function muteGroup(
  agent: BskyAgent,
  convoId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    await (agent.api.chat.bsky.convo as any).muteConvo({ convoId });
    return { success: true };
  } catch (error: any) {
    return { error: error?.message || 'Failed to mute group' };
  }
}

/**
 * Unmute a group conversation (resume receiving notifications).
 */
export async function unmuteGroup(
  agent: BskyAgent,
  convoId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    await (agent.api.chat.bsky.convo as any).unmuteConvo({ convoId });
    return { success: true };
  } catch (error: any) {
    return { error: error?.message || 'Failed to unmute group' };
  }
}

/**
 * Edit group settings (name).
 */
export async function editGroupSettings(
  agent: BskyAgent,
  convoId: string,
  name: string
): Promise<{ convo?: ConvoView; error?: string }> {
  try {
    const response = await (agent.api.chat.bsky.group as any).editGroup({
      convoId,
      name,
    });
    return { convo: response.data?.convo };
  } catch (error: any) {
    const message = error?.message || 'Failed to update group settings';
    if (message.includes('NameTooLong')) {
      return { error: 'Group name is too long (max 50 characters).' };
    }
    if (message.includes('NameRequired')) {
      return { error: 'Group name is required.' };
    }
    return { error: message };
  }
}

/**
 * Edit join link settings (approval requirement, join rule).
 */
export async function editJoinLinkSettings(
  agent: BskyAgent,
  convoId: string,
  requireApproval: boolean,
  joinRule?: JoinRule
): Promise<{ joinLink?: JoinLink; error?: string }> {
  try {
    const response = await (agent.api.chat.bsky.group as any).editJoinLink({
      convoId,
      requireApproval,
      ...(joinRule ? { joinRule } : {}),
    });
    const link = response.data?.joinLink;
    if (!link) return { error: 'No join link returned' };
    return {
      joinLink: {
        code: link.code,
        enabledStatus: link.enabledStatus,
        requireApproval: link.requireApproval,
        joinRule: link.joinRule,
        createdAt: link.createdAt,
      },
    };
  } catch (error: any) {
    return { error: error?.message || 'Failed to update join link settings' };
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
