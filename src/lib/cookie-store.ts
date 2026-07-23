import { cookies } from 'next/headers';

const PREFIX = 'oauth_';

export class CookieStore {
  async get(key: string): Promise<any | undefined> {
    const store = await cookies();
    const raw = store.get(`${PREFIX}${key}`)?.value;
    if (!raw) return undefined;
    try {
      return JSON.parse(decodeURIComponent(raw));
    } catch {
      return undefined;
    }
  }

  async set(key: string, value: any): Promise<void> {
    const store = await cookies();
    store.set(`${PREFIX}${key}`, encodeURIComponent(JSON.stringify(value)), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    });
  }

  async del(key: string): Promise<void> {
    const store = await cookies();
    store.delete(`${PREFIX}${key}`);
  }
}
