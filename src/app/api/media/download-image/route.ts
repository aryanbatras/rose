import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const parsed = new URL(url);
    const isBluesky = parsed.hostname.includes('bsky.app') || parsed.hostname.includes('bsky.network') || parsed.hostname.includes('bskycdn');
    if (!isBluesky) {
      return NextResponse.json({ error: 'Invalid domain' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch' }, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const filename = request.nextUrl.searchParams.get('filename') || 'image.jpg';

    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, max-age=31536000',
    });

    return new NextResponse(res.body, { headers });
  } catch {
    return NextResponse.json({ error: 'Proxy fetch failed' }, { status: 500 });
  }
}
