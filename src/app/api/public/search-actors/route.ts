import { NextRequest, NextResponse } from 'next/server';
import { publicSearchActors } from '@/services/public-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    if (!q) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const data = await publicSearchActors(q);
    return NextResponse.json(data.actors || []);
  } catch (error) {
    console.error('Public search actors API error:', error);
    return NextResponse.json([]);
  }
}
