import { NextRequest, NextResponse } from 'next/server';
import { getAgentForSession, getAgentFromRequest } from '@/services/agent';
import { updateProfile, getProfile } from '@/services/graph';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('rose_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const agent = await getAgentForSession(session);
    if (!agent) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const formData = await request.formData();
    const displayName = formData.get('displayName') as string | null;
    const description = formData.get('description') as string | null;
    const avatarFile = formData.get('avatar') as File | null;
    const bannerFile = formData.get('banner') as File | null;

    const updates: any = {};
    if (displayName !== null) updates.displayName = displayName;
    if (description !== null) updates.description = description;

    // Upload avatar if provided
    if (avatarFile && avatarFile.size > 0) {
      const avatarBytes = new Uint8Array(await avatarFile.arrayBuffer());
      const blobRes = await agent.uploadBlob(avatarBytes, { encoding: avatarFile.type });
      updates.avatarBlob = blobRes.data.blob;
    }

    // Upload banner if provided
    if (bannerFile && bannerFile.size > 0) {
      const bannerBytes = new Uint8Array(await bannerFile.arrayBuffer());
      const blobRes = await agent.uploadBlob(bannerBytes, { encoding: bannerFile.type });
      updates.bannerBlob = blobRes.data.blob;
    }

    await updateProfile(agent, updates);

    // Fetch updated profile
    const profile = await getProfile(agent, session.handle);

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Profile update API error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
