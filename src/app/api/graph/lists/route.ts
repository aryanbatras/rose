import { NextRequest, NextResponse } from 'next/server';
import { getAgentForSession } from '@/services/agent';
import { getUserLists, getListItems, createList, deleteList, addToList, removeFromList } from '@/services/lists';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const actor = searchParams.get('actor') || session.did;
    const listUri = searchParams.get('list');
    const cursor = searchParams.get('cursor') || undefined;

    if (listUri) {
      const result = await getListItems(agent, listUri, cursor);
      return NextResponse.json(result);
    }

    const result = await getUserLists(agent, actor, cursor);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Lists API error:', error);
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 });
  }
}

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

    const { action, listUri, name, description, subjectDid } = await request.json();

    if (action === 'create') {
      const uri = await createList(agent, name, description);
      return NextResponse.json({ uri });
    }

    if (action === 'delete' && listUri) {
      await deleteList(agent, listUri);
      return NextResponse.json({ success: true });
    }

    if (action === 'add' && listUri && subjectDid) {
      await addToList(agent, listUri, subjectDid);
      return NextResponse.json({ success: true });
    }

    if (action === 'remove' && listUri && subjectDid) {
      await removeFromList(agent, listUri, subjectDid);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Lists API error:', error);
    return NextResponse.json({ error: 'Failed to process list action' }, { status: 500 });
  }
}
