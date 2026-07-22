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
