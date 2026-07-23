import { NextRequest, NextResponse } from 'next/server';

function parseM3U8(manifest: string, baseUrl: string): string[] {
  const lines = manifest.split('\n');
  const segments: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    try {
      const segmentUrl = trimmed.startsWith('http')
        ? trimmed
        : new URL(trimmed, baseUrl).href;
      segments.push(segmentUrl);
    } catch {
      continue;
    }
  }

  return segments;
}

async function fetchWithRetry(url: string, retries = 2): Promise<ArrayBuffer> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.arrayBuffer();
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 200 * (i + 1)));
    }
  }
  throw new Error('Unreachable');
}

export async function POST(request: NextRequest) {
  try {
    const { playlistUrl, filename } = await request.json();

    if (!playlistUrl || typeof playlistUrl !== 'string') {
      return NextResponse.json({ error: 'Missing playlistUrl' }, { status: 400 });
    }

    try {
      const parsed = new URL(playlistUrl);
      const isBluesky = parsed.hostname.includes('bsky.app') || parsed.hostname.includes('bsky.network') || parsed.hostname.includes('bskycdn');
      if (!isBluesky) {
        return NextResponse.json({ error: 'Invalid domain' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const manifestRes = await fetch(playlistUrl);
    if (!manifestRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: manifestRes.status });
    }

    const manifest = await manifestRes.text();
    const baseUrl = playlistUrl.substring(0, playlistUrl.lastIndexOf('/') + 1);
    let segments = parseM3U8(manifest, baseUrl);

    if (segments.length === 0) {
      return NextResponse.json({ error: 'No segments found in playlist' }, { status: 404 });
    }

    if (manifest.includes('#EXT-X-STREAM-INF') || manifest.includes('#EXT-X-MEDIA:TYPE=AUDIO')) {
      const masterLines = manifest.split('\n');
      let chosenPlaylist: string | null = null;

      for (let i = 0; i < masterLines.length; i++) {
        if (masterLines[i].includes('#EXT-X-STREAM-INF')) {
          const nextLine = masterLines[i + 1]?.trim();
          if (nextLine && !nextLine.startsWith('#')) {
            chosenPlaylist = nextLine.startsWith('http')
              ? nextLine
              : new URL(nextLine, baseUrl).href;
            break;
          }
        }
      }

      if (chosenPlaylist) {
        const subManifestRes = await fetch(chosenPlaylist);
        if (subManifestRes.ok) {
          const subManifest = await subManifestRes.text();
          const subBaseUrl = chosenPlaylist.substring(0, chosenPlaylist.lastIndexOf('/') + 1);
          segments = parseM3U8(subManifest, subBaseUrl);
        }
      }
    }

    if (segments.length === 0) {
      return NextResponse.json({ error: 'No segments found' }, { status: 404 });
    }

    const CONCURRENCY = 6;
    const segmentBuffers: ArrayBuffer[] = new Array(segments.length);

    for (let i = 0; i < segments.length; i += CONCURRENCY) {
      const batch = segments.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map((url, batchIdx) =>
          fetchWithRetry(url).then((buf) => {
            segmentBuffers[i + batchIdx] = buf;
            return buf;
          })
        )
      );
      void results;
    }

    const totalSize = segmentBuffers.reduce((sum, buf) => sum + buf.byteLength, 0);
    const combined = new Uint8Array(totalSize);
    let offset = 0;
    for (const buf of segmentBuffers) {
      combined.set(new Uint8Array(buf), offset);
      offset += buf.byteLength;
    }

    const safeName = (filename || 'video.mp4').replace(/[^a-zA-Z0-9._-]/g, '_');

    return new NextResponse(combined, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Content-Length': totalSize.toString(),
      },
    });
  } catch (err) {
    console.error('Video download failed:', err);
    return NextResponse.json({ error: 'Video download failed' }, { status: 500 });
  }
}
