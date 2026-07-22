import { NextRequest, NextResponse } from 'next/server';
import { getAgentForSession } from '@/services/agent';
import { createPost, uploadBlob } from '@/services/posts';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session') || cookieStore.get('voiceflow_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const agent = await getAgentForSession(session);
    if (!agent) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const formData = await request.formData();
    const text = (formData.get('text') as string) || '';
    const imageFiles = formData.getAll('images') as File[];
    const replyUri = formData.get('replyUri') as string | null;
    const replyCid = formData.get('replyCid') as string | null;

    if (!text.trim() && imageFiles.length === 0) {
      return NextResponse.json({ error: 'Text or image is required' }, { status: 400 });
    }
    if (text.length > 300) {
      return NextResponse.json({ error: 'Post must be 300 characters or less' }, { status: 400 });
    }
    if (imageFiles.length > 4) {
      return NextResponse.json({ error: 'Maximum 4 images allowed' }, { status: 400 });
    }

    // Upload images to AT Protocol
    const uploadedBlobs: any[] = [];
    for (const file of imageFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const blob = await uploadBlob(agent, new Uint8Array(arrayBuffer), file.type);
      uploadedBlobs.push({
        image: blob,
        alt: '',
      });
    }

    // Build post options
    const options: any = {};
    if (uploadedBlobs.length > 0) {
      options.embed = {
        $type: 'app.bsky.embed.images',
        images: uploadedBlobs,
      };
    }

    // Handle reply
    if (replyUri && replyCid) {
      options.replyTo = { uri: replyUri, cid: replyCid };
      await createPost(agent, text.trim(), options);
    } else {
      await createPost(agent, text.trim(), options);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Compose API error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
