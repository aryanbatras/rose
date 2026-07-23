import { BskyAgent } from '@atproto/api';
import type {
  GroupInfo,
  BasicProfileView,
  JoinLinkPreview,
  JoinLink,
  JoinResult,
  JoinRule,
  JoinRequestView,
} from '@/types/chat';

const CHAT_BASE = 'https://api.bsky.chat/xrpc';

function chatHeaders(agent: BskyAgent): Record<string, string> {
  if (!agent.session?.accessJwt) throw new Error('No session');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${agent.session.accessJwt}`,
  };
}

async function chatGet(agent: BskyAgent, endpoint: string, params?: Record<string, string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${CHAT_BASE}/${endpoint}${qs}`, { headers: chatHeaders(agent) });
  const text = await res.text();
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = JSON.parse(text).message || msg; } catch {}
    throw new Error(msg);
  }
  return JSON.parse(text);
}

async function chatPost(agent: BskyAgent, endpoint: string, body?: Record<string, any>) {
  const res = await fetch(`${CHAT_BASE}/${endpoint}`, {
    method: 'POST',
    headers: chatHeaders(agent),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { msg = JSON.parse(text).message || msg; } catch {}
    throw new Error(msg);
  }
  return JSON.parse(text);
}

function normalizeGroupInfo(convo: any): GroupInfo {
  const memberNames = convo.members?.slice(0, 3).map((m: any) => m.displayName || m.handle) || [];
  return {
    convoId: convo.id,
    name: convo.name || memberNames.join(', ') || 'Group',
    memberCount: convo.members?.length || 0,
    members: convo.members || [],
    lastMessage: convo.lastMessage || null,
    unreadCount: convo.unreadCount || 0,
    muted: convo.muted || false,
    createdAt: convo.rev || new Date().toISOString(),
  };
}

async function resolveHandle(agent: BskyAgent, handle: string): Promise<string | null> {
  try {
    const clean = handle.replace(/^@/, '');
    if (clean.startsWith('did:')) return clean;
    const response = await agent.api.com.atproto.identity.resolveHandle({ handle: clean });
    return response.data.did;
  } catch {
    return null;
  }
}

export async function listGroups(
  agent: BskyAgent,
  cursor?: string,
  limit = 30
): Promise<{ groups: GroupInfo[]; cursor?: string }> {
  try {
    const params: Record<string, string> = { limit: String(limit), kind: 'group', status: 'accepted' };
    if (cursor) params.cursor = cursor;
    const data = await chatGet(agent, 'chat.bsky.convo.listConvos', params);
    return {
      groups: (data.convos || []).map((c: any) => normalizeGroupInfo(c)),
      cursor: data.cursor,
    };
  } catch (error) {
    console.error('listGroups error:', error);
    return { groups: [] };
  }
}

export async function getGroup(
  agent: BskyAgent,
  convoId: string
): Promise<GroupInfo | null> {
  try {
    const data = await chatGet(agent, 'chat.bsky.convo.getConvo', { convoId });
    return data.convo ? normalizeGroupInfo(data.convo) : null;
  } catch (error) {
    console.error('getGroup error:', error);
    return null;
  }
}

export async function getGroupMembers(
  agent: BskyAgent,
  convoId: string
): Promise<BasicProfileView[]> {
  try {
    const data = await chatGet(agent, 'chat.bsky.convo.getConvoMembers', { convoId });
    return data.members || [];
  } catch (error) {
    console.error('getGroupMembers error:', error);
    return [];
  }
}

export async function getGroupMessages(
  agent: BskyAgent,
  convoId: string,
  cursor?: string,
  limit = 50
): Promise<{ messages: any[]; cursor?: string }> {
  try {
    const params: Record<string, string> = { convoId, limit: String(limit) };
    if (cursor) params.cursor = cursor;
    const data = await chatGet(agent, 'chat.bsky.convo.getMessages', params);
    return { messages: data.messages || [], cursor: data.cursor };
  } catch (error) {
    console.error('getGroupMessages error:', error);
    return { messages: [] };
  }
}

export async function createGroup(
  agent: BskyAgent,
  name: string,
  memberIdentifiers: string[]
): Promise<{ convoId?: string; error?: string }> {
  try {
    const results = await Promise.allSettled(
      memberIdentifiers.map(async (id) => {
        const did = await resolveHandle(agent, id);
        if (!did) throw new Error(`Could not resolve ${id}`);
        return did;
      })
    );

    const dids: string[] = [];
    const errors: string[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') dids.push(r.value);
      else errors.push(r.reason?.message || 'Unknown');
    }
    if (dids.length === 0) return { error: `Could not find any members. ${errors[0] || ''}` };

    const data = await chatPost(agent, 'chat.bsky.group.createGroup', { members: dids, name });
    return { convoId: data.convo?.id };
  } catch (error: any) {
    console.error('createGroup error:', error);
    const msg = error?.message || 'Failed to create group';
    if (msg.includes('AccountSuspended')) return { error: 'Your account is suspended and cannot create groups.' };
    if (msg.includes('NewAccountCannotCreateGroup')) return { error: 'Your account is too new to create groups. Please try again later.' };
    if (msg.includes('BlockedActor') || msg.includes('BlockedByActor')) return { error: 'You have blocked one of the selected members or they blocked you.' };
    if (msg.includes('NotFollowedBySender')) return { error: 'One or more members do not follow you. They need to follow you before you can add them to groups.' };
    if (msg.includes('RecipientNotFound')) return { error: 'One or more members could not be found.' };
    if (msg.includes('UserForbidsGroups')) return { error: 'One or more members do not allow group invitations.' };
    return { error: msg };
  }
}

export async function getJoinLinkPreviews(
  agent: BskyAgent,
  codes: string[]
): Promise<{ previews: JoinLinkPreview[] }> {
  try {
    const params = new URLSearchParams();
    codes.forEach((c) => params.append('codes', c));
    const data = await chatGet(agent, 'chat.bsky.group.getJoinLinkPreviews', Object.fromEntries(params));
    const previews: JoinLinkPreview[] = (data.joinLinkPreviews || []).map((p: any) => {
      if (p.$type?.includes('joinLinkPreviewView')) {
        return {
          status: 'valid' as const, code: p.code, convoId: p.convoId, name: p.name,
          owner: p.owner ? { did: p.owner.did, handle: p.owner.handle, displayName: p.owner.displayName, avatar: p.owner.avatar } : undefined,
          memberCount: p.memberCount, memberLimit: p.memberLimit, requireApproval: p.requireApproval, joinRule: p.joinRule,
        };
      }
      if (p.$type?.includes('disabledJoinLinkPreviewView')) return { status: 'disabled' as const, code: p.code };
      return { status: 'invalid' as const, code: p.code };
    });
    return { previews };
  } catch (error) {
    console.error('getJoinLinkPreviews error:', error);
    return { previews: [] };
  }
}

export async function requestJoinGroup(
  agent: BskyAgent,
  code: string
): Promise<{ result?: JoinResult; error?: string; errorType?: string }> {
  try {
    const data = await chatPost(agent, 'chat.bsky.group.requestJoin', { code });
    return { result: { status: data.status, convo: data.convo } };
  } catch (error: any) {
    const msg = error?.message || 'Failed to join group';
    if (msg.includes('InvalidCode')) return { error: 'This invite code is invalid or has expired.', errorType: 'invalid_code' };
    if (msg.includes('LinkDisabled')) return { error: 'This join link has been disabled by the group owner.', errorType: 'link_disabled' };
    if (msg.includes('ConvoLocked')) return { error: 'This group is locked and not accepting new members.', errorType: 'convo_locked' };
    if (msg.includes('FollowRequired')) return { error: 'You need to follow the group owner before joining.', errorType: 'follow_required' };
    if (msg.includes('MemberLimitReached')) return { error: 'This group has reached its member limit.', errorType: 'member_limit' };
    if (msg.includes('UserKicked')) return { error: 'You have been removed from this group and cannot rejoin.', errorType: 'user_kicked' };
    return { error: msg, errorType: 'unknown' };
  }
}

export async function createJoinLink(
  agent: BskyAgent,
  convoId: string,
  joinRule: JoinRule = 'anyone',
  requireApproval = false
): Promise<{ joinLink?: JoinLink; error?: string }> {
  try {
    const data = await chatPost(agent, 'chat.bsky.group.createJoinLink', { convoId, joinRule, requireApproval });
    const link = data.joinLink;
    if (!link) return { error: 'No join link returned' };
    return { joinLink: { code: link.code, enabledStatus: link.enabledStatus, requireApproval: link.requireApproval, joinRule: link.joinRule, createdAt: link.createdAt } };
  } catch (error: any) {
    const msg = error?.message || 'Failed to create join link';
    if (msg.includes('EnabledJoinLinkAlreadyExists')) return { error: 'A join link already exists for this group. Disable it first to create a new one.' };
    return { error: msg };
  }
}

export async function disableJoinLink(agent: BskyAgent, convoId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    await chatPost(agent, 'chat.bsky.group.disableJoinLink', { convoId });
    return { success: true };
  } catch (error: any) {
    return { error: error?.message || 'Failed to disable join link' };
  }
}

export async function enableJoinLink(agent: BskyAgent, convoId: string): Promise<{ joinLink?: JoinLink; error?: string }> {
  try {
    const data = await chatPost(agent, 'chat.bsky.group.enableJoinLink', { convoId });
    const link = data.joinLink;
    if (!link) return { error: 'No join link returned' };
    return { joinLink: { code: link.code, enabledStatus: link.enabledStatus, requireApproval: link.requireApproval, joinRule: link.joinRule, createdAt: link.createdAt } };
  } catch (error: any) {
    return { error: error?.message || 'Failed to enable join link' };
  }
}

export async function addGroupMembers(
  agent: BskyAgent,
  convoId: string,
  memberIdentifiers: string[]
): Promise<{ convo?: any; addedMembers?: BasicProfileView[]; error?: string }> {
  try {
    const results = await Promise.allSettled(
      memberIdentifiers.map(async (id) => {
        const did = await resolveHandle(agent, id);
        if (!did) throw new Error(`Could not resolve ${id}`);
        return did;
      })
    );
    const dids: string[] = [];
    const errors: string[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') dids.push(r.value);
      else errors.push(r.reason?.message || 'Unknown');
    }
    if (dids.length === 0) return { error: `Could not resolve any members. ${errors[0] || ''}` };

    const data = await chatPost(agent, 'chat.bsky.group.addMembers', { convoId, members: dids });
    return { convo: data.convo, addedMembers: data.addedMembers };
  } catch (error: any) {
    const msg = error?.message || 'Failed to add members';
    if (msg.includes('MemberLimitReached')) return { error: 'This group has reached its member limit.' };
    if (msg.includes('BlockedActor') || msg.includes('BlockedByActor')) return { error: 'You have blocked one of these members or they blocked you.' };
    if (msg.includes('UserForbidsGroups')) return { error: 'One or more members do not allow group invitations.' };
    if (msg.includes('RecipientNotFound')) return { error: 'One or more members could not be found.' };
    return { error: msg };
  }
}

export async function removeGroupMembers(
  agent: BskyAgent,
  convoId: string,
  memberDids: string[]
): Promise<{ convo?: any; error?: string }> {
  try {
    const data = await chatPost(agent, 'chat.bsky.group.removeMembers', { convoId, members: memberDids });
    return { convo: data.convo };
  } catch (error: any) {
    return { error: error?.message || 'Failed to remove members' };
  }
}

export async function listJoinRequests(
  agent: BskyAgent,
  convoId: string,
  cursor?: string,
  limit = 30
): Promise<{ requests: JoinRequestView[]; cursor?: string; error?: string }> {
  try {
    const params: Record<string, string> = { convoId, limit: String(limit) };
    if (cursor) params.cursor = cursor;
    const data = await chatGet(agent, 'chat.bsky.group.listJoinRequests', params);
    return { requests: data.requests || [], cursor: data.cursor };
  } catch (error: any) {
    return { error: error?.message || 'Failed to list join requests', requests: [] };
  }
}

export async function approveJoinRequest(
  agent: BskyAgent,
  convoId: string,
  memberDid: string
): Promise<{ convo?: any; error?: string }> {
  try {
    const data = await chatPost(agent, 'chat.bsky.group.approveJoinRequest', { convoId, member: memberDid });
    return { convo: data.convo };
  } catch (error: any) {
    return { error: error?.message || 'Failed to approve request' };
  }
}

export async function rejectJoinRequest(
  agent: BskyAgent,
  convoId: string,
  memberDid: string
): Promise<{ error?: string }> {
  try {
    await chatPost(agent, 'chat.bsky.group.rejectJoinRequest', { convoId, member: memberDid });
    return {};
  } catch (error: any) {
    return { error: error?.message || 'Failed to reject request' };
  }
}

export async function listMutualGroups(
  agent: BskyAgent,
  subject: string
): Promise<{ groups: GroupInfo[]; cursor?: string }> {
  try {
    const data = await chatGet(agent, 'chat.bsky.group.listMutualGroups', { subject, limit: '30' });
    return {
      groups: (data.convos || []).map((c: any) => normalizeGroupInfo(c)),
      cursor: data.cursor,
    };
  } catch (error) {
    console.error('listMutualGroups error:', error);
    return { groups: [] };
  }
}

export async function muteGroup(agent: BskyAgent, convoId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    await chatPost(agent, 'chat.bsky.convo.muteConvo', { convoId });
    return { success: true };
  } catch (error: any) {
    return { error: error?.message || 'Failed to mute group' };
  }
}

export async function unmuteGroup(agent: BskyAgent, convoId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    await chatPost(agent, 'chat.bsky.convo.unmuteConvo', { convoId });
    return { success: true };
  } catch (error: any) {
    return { error: error?.message || 'Failed to unmute group' };
  }
}

export async function editGroupSettings(
  agent: BskyAgent,
  convoId: string,
  name: string
): Promise<{ convo?: any; error?: string }> {
  try {
    const data = await chatPost(agent, 'chat.bsky.group.editGroup', { convoId, name });
    return { convo: data.convo };
  } catch (error: any) {
    const msg = error?.message || 'Failed to update group settings';
    if (msg.includes('NameTooLong')) return { error: 'Group name is too long (max 50 characters).' };
    if (msg.includes('NameRequired')) return { error: 'Group name is required.' };
    return { error: msg };
  }
}

export async function editJoinLinkSettings(
  agent: BskyAgent,
  convoId: string,
  requireApproval: boolean,
  joinRule?: JoinRule
): Promise<{ joinLink?: JoinLink; error?: string }> {
  try {
    const body: Record<string, any> = { convoId, requireApproval };
    if (joinRule) body.joinRule = joinRule;
    const data = await chatPost(agent, 'chat.bsky.group.editJoinLink', body);
    const link = data.joinLink;
    if (!link) return { error: 'No join link returned' };
    return { joinLink: { code: link.code, enabledStatus: link.enabledStatus, requireApproval: link.requireApproval, joinRule: link.joinRule, createdAt: link.createdAt } };
  } catch (error: any) {
    return { error: error?.message || 'Failed to update join link settings' };
  }
}

export async function sendGroupMessage(
  agent: BskyAgent,
  convoId: string,
  text: string
): Promise<{ message?: any; error?: string }> {
  try {
    const data = await chatPost(agent, 'chat.bsky.convo.sendMessage', { convoId, message: { text } });
    return { message: data.message };
  } catch (error: any) {
    return { error: error?.message || 'Failed to send message' };
  }
}
