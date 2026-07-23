import { NextRequest, NextResponse } from 'next/server';
import { publicGetProfile } from '@/services/public-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actor = searchParams.get('actor');
    if (!actor) {
      return NextResponse.json({ error: 'Actor required' }, { status: 400 });
    }
    const data = await publicGetProfile(actor);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Public profile API error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
