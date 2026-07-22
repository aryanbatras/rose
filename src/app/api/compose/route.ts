import { NextRequest, NextResponse } from 'next/server';
import { getAgentForSession } from '@/services/agent';
import { createPost, uploadBlob } from '@/services/posts';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const agent = await getAgentForSession(session);
    if (!agent) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const { text, audioData, audioMimeType, duration, tags, mood } = await request.json();

    let embed;
    if (audioData && audioMimeType) {
      const binaryStr = atob(audioData);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const blob = await uploadBlob(agent, bytes, audioMimeType);

      // Create custom voice post record
      const voiceRecord = {
        $type: 'voiceflow.voice.post',
        videoBlob: blob,
        duration: duration || 0,
        text: text || '',
        tags: tags || [],
        mood: mood || '',
        transcript: '',
        createdAt: new Date().toISOString(),
      };

      await agent.com.atproto.repo.createRecord({
        repo: agent.session!.did,
        collection: 'voiceflow.voice.post',
        record: voiceRecord as any,
      });

      return NextResponse.json({ success: true, type: 'voice' });
    }

    // Regular text post
    const tagsToAdd = tags?.length
      ? tags.map((t: string) => `#${t}`).join(' ')
      : '';
    const postText = [text, tagsToAdd].filter(Boolean).join('\n\n');

    await createPost(agent, postText);
    return NextResponse.json({ success: true, type: 'text' });
  } catch (error) {
    console.error('Compose API error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
