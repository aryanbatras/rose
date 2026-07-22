'use server';

import { BskyAgent } from '@atproto/api';
import type { VoicePostRecord, MusicPreferenceRecord, VoiceBioRecord, SongEntry } from '@/types/atproto';

export async function getVoicePosts(
  agent: BskyAgent,
  did: string,
  cursor?: string,
  limit = 50
): Promise<{ records: any[]; cursor?: string }> {
  try {
    const response = await agent.com.atproto.repo.listRecords({
      repo: did,
      collection: 'voiceflow.voice.post',
      limit,
      cursor,
    });
    return {
      records: response.data.records || [],
      cursor: response.data.cursor,
    };
  } catch {
    return { records: [] };
  }
}

export async function getMusicPreferences(
  agent: BskyAgent,
  did: string
): Promise<MusicPreferenceRecord | null> {
  try {
    const response = await agent.com.atproto.repo.getRecord({
      repo: did,
      collection: 'voiceflow.music.preference',
      rkey: 'self',
    });
    return response.data.value as unknown as MusicPreferenceRecord;
  } catch {
    return null;
  }
}

export async function setMusicPreferences(
  agent: BskyAgent,
  preferences: {
    favoriteSongs?: SongEntry[];
    favoriteGenres?: string[];
  }
): Promise<void> {
  const record: MusicPreferenceRecord = {
    $type: 'voiceflow.music.preference',
    favoriteSongs: preferences.favoriteSongs || [],
    favoriteGenres: preferences.favoriteGenres || [],
    updatedAt: new Date().toISOString(),
  };

  await agent.com.atproto.repo.putRecord({
    repo: agent.session!.did,
    collection: 'voiceflow.music.preference',
    rkey: 'self',
    record: record as any,
  });
}

export async function getVoiceBio(
  agent: BskyAgent,
  did: string
): Promise<VoiceBioRecord | null> {
  try {
    const response = await agent.com.atproto.repo.getRecord({
      repo: did,
      collection: 'voiceflow.actor.bio',
      rkey: 'self',
    });
    return response.data.value as unknown as VoiceBioRecord;
  } catch {
    return null;
  }
}

export async function setVoiceBio(
  agent: BskyAgent,
  blob: any,
  duration: number,
  transcript?: string
): Promise<void> {
  const record: VoiceBioRecord = {
    $type: 'voiceflow.actor.bio',
    bioBlob: blob,
    duration,
    transcript,
    createdAt: new Date().toISOString(),
  };

  await agent.com.atproto.repo.putRecord({
    repo: agent.session!.did,
    collection: 'voiceflow.actor.bio',
    rkey: 'self',
    record: record as any,
  });
}
