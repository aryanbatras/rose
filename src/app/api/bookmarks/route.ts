import { NextRequest, NextResponse } from 'next/server';
import { getAgentFromRequest } from '@/services/agent';
import { getBookmarks, createBookmark, deleteBookmark } from '@/services/posts';
import { cookies } from 'next/headers';

/**
 * GET /api/bookmarks — Fetch user's bookmarks (paginated)
 */
export async function GET(request: NextRequest) {
  try {
    const agent = await getAgentFromRequest(request);
    if (!agent) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(Number(searchParams.get('limit')) || 30, 100);

    const result = await getBookmarks(agent, cursor, limit);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ bookmarks: result.bookmarks, cursor: result.cursor });
  } catch (error) {
    console.error('GET /api/bookmarks error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
  }
}

/**
 * POST /api/bookmarks — Create a bookmark for a post
 * Body: { uri: string, cid: string }
 */
export async function POST(request: NextRequest) {
  try {
    const agent = await getAgentFromRequest(request);
    if (!agent) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { uri, cid } = body;
    if (!uri || !cid) {
      return NextResponse.json({ error: 'uri and cid are required' }, { status: 400 });
    }

    const result = await createBookmark(agent, uri, cid);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/bookmarks error:', error);
    return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 });
  }
}

/**
 * DELETE /api/bookmarks — Delete a bookmark
 * Body: { bookmarkUri: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const agent = await getAgentFromRequest(request);
    if (!agent) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { bookmarkUri } = body;
    if (!bookmarkUri) {
      return NextResponse.json({ error: 'bookmarkUri is required' }, { status: 400 });
    }

    const result = await deleteBookmark(agent, bookmarkUri);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/bookmarks error:', error);
    return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 });
  }
}
