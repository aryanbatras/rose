const PUBLIC_API = 'https://api.bsky.app';

async function publicFetch(path: string, params?: Record<string, string>) {
  const url = new URL(`${PUBLIC_API}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Public API error: ${res.status}`);
  return res.json();
}

export async function publicSearchPosts(query: string, cursor?: string, limit = 25) {
  return publicFetch('/xrpc/app.bsky.feed.searchPosts', {
    q: query,
    limit: String(limit),
    ...(cursor ? { cursor } : {}),
  });
}

export async function publicGetProfile(actor: string) {
  return publicFetch('/xrpc/app.bsky.actor.getProfile', { actor });
}

export async function publicGetAuthorFeed(actor: string, cursor?: string, limit = 30) {
  return publicFetch('/xrpc/app.bsky.feed.getAuthorFeed', {
    actor,
    limit: String(limit),
    ...(cursor ? { cursor } : {}),
  });
}

export async function publicGetPostThread(uri: string, depth = 6) {
  return publicFetch('/xrpc/app.bsky.feed.getPostThread', {
    uri,
    depth: String(depth),
  });
}

export async function publicGetFollowers(actor: string, cursor?: string, limit = 50) {
  return publicFetch('/xrpc/app.bsky.graph.getFollowers', {
    actor,
    limit: String(limit),
    ...(cursor ? { cursor } : {}),
  });
}

export async function publicGetFollowing(actor: string, cursor?: string, limit = 50) {
  return publicFetch('/xrpc/app.bsky.graph.getFollowing', {
    actor,
    limit: String(limit),
    ...(cursor ? { cursor } : {}),
  });
}

export async function publicGetFeed(feedUri: string, cursor?: string, limit = 30) {
  return publicFetch('/xrpc/app.bsky.feed.getFeed', {
    feed: feedUri,
    limit: String(limit),
    ...(cursor ? { cursor } : {}),
  });
}

export async function publicSearchActors(term: string, cursor?: string, limit = 25) {
  return publicFetch('/xrpc/app.bsky.actor.searchActors', {
    q: term,
    limit: String(limit),
    ...(cursor ? { cursor } : {}),
  });
}

export async function publicGetFeedGenerator(feedUri: string) {
  return publicFetch('/xrpc/app.bsky.feed.getFeedGenerator', {
    feed: feedUri,
  });
}

export async function publicGetFeedGenerators(feedUris: string[]) {
  const url = new URL(`${PUBLIC_API}/xrpc/app.bsky.feed.getFeedGenerators`);
  feedUris.forEach((uri) => url.searchParams.append('feeds', uri));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Public API error: ${res.status}`);
  return res.json();
}

export async function publicGetPopularFeedGenerators(cursor?: string, limit = 25) {
  return publicFetch('/xrpc/app.bsky.unspecced.getPopularFeedGenerators', {
    limit: String(limit),
    ...(cursor ? { cursor } : {}),
  });
}
