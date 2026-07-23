import { NextRequest, NextResponse } from 'next/server';
import { publicGetPostThread } from '@/services/public-api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uri = searchParams.get('uri');
    if (!uri) {
      return NextResponse.json({ error: 'URI required' }, { status: 400 });
    }
    const data = await publicGetPostThread(uri);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Public thread API error:', error);
    return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 });
  }
}
