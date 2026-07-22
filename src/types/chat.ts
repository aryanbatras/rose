import type { ActorView } from './atproto';

// ─── Group / Conversation Types ──────────────────────────────────

export type ConvoKind = 'direct' | 'group';
export type ConvoStatus = 'request' | 'accepted';

export interface ConvoView {
  id: string;
  rev: string;
  members: BasicProfileView[];
  lastMessage?: MessageView | SystemMessageView | null;
  muted: boolean;
  status?: ConvoStatus;
  unreadCount: number;
  kind?: 'direct' | 'group';
}

export interface BasicProfileView {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}

export interface MessageView {
  id: string;
  rev: string;
  text: string;
  sender: MessageViewSender;
  sentAt: string;
  embed?: any;
}

export interface MessageViewSender {
  did: string;
}

export interface SystemMessageView {
  id: string;
  rev: string;
  sender: MessageViewSender;
  sentAt: string;
  message?: string;
}

export interface GroupInfo {
  convoId: string;
  name: string;
  description?: string;
  memberCount: number;
  members: BasicProfileView[];
  lastMessage?: MessageView | SystemMessageView | null;
  unreadCount: number;
  muted: boolean;
  createdAt: string;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  memberDids: string[];
}

export interface SendMessageInput {
  convoId: string;
  text: string;
}

// ─── Join Link Types ────────────────────────────────────────────

export type JoinLinkStatus = 'valid' | 'disabled' | 'invalid';
export type JoinRule = 'owner_invite' | 'member_invite' | 'anyone';

/** Preview of a join link (returned by getJoinLinkPreviews) */
export interface JoinLinkPreview {
  status: JoinLinkStatus;
  code: string;
  // Valid preview fields
  convoId?: string;
  name?: string;
  owner?: BasicProfileView;
  memberCount?: number;
  memberLimit?: number;
  requireApproval?: boolean;
  joinRule?: JoinRule;
  convo?: ConvoView;
}

/** A join link associated with a group */
export interface JoinLink {
  code: string;
  enabledStatus: 'enabled' | 'disabled';
  requireApproval: boolean;
  joinRule: JoinRule;
  createdAt: string;
}

/** Result of a join request */
export interface JoinResult {
  status: 'joined' | 'pending';
  convo?: ConvoView;
}

/** Input for creating a join link */
export interface CreateJoinLinkInput {
  convoId: string;
  joinRule: JoinRule;
  requireApproval?: boolean;
}

/** A pending join request for a group */
export interface JoinRequestView {
  convoId: string;
  requestedBy: BasicProfileView;
  requestedAt: string;
}
