'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useBookmarkStore } from '@/stores/bookmark-store';
import { useSpells } from '@/hooks/useSpells';
import { Avatar } from '@/components/ui/avatar';

interface NavEntry {
  label: string;
  path: string;
  icon: string;
  badge?: boolean;
  /** Spell effect that hides this nav item */
  hideEffect?: string;
}

const NAV_ENTRIES: NavEntry[] = [
  { label: 'Home', path: '/feed', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Search', path: '/search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', hideEffect: 'hide_search_nav' },
  { label: 'Notifications', path: '/notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', badge: true },
  { label: 'Feeds', path: '/discover', icon: 'M7 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h2zM17 3a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2V5a2 2 0 012-2h2z', hideEffect: 'hide_feeds_nav' },
  { label: 'Spells', path: '/spells', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
  { label: 'Bookmarks', path: '/bookmarks', icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' },
  { label: 'Profile', path: '/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', hideEffect: 'hide_profile_nav' },
  { label: 'Settings', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

function BookmarksIcon() {
  const { bookmarks } = useBookmarkStore();
  const count = bookmarks.length;
  return (
    <span className="relative">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-yellow-500 px-1 text-[10px] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useAuth();
  const { data: unreadData } = useUnreadCount();
  const unread = (unreadData as any)?.count ?? 0;
  const spells = useSpells();

  if (pathname === '/login' || pathname === '/signup' || pathname === '/' || pathname?.startsWith('/oauth')) {
    return null;
  }

  const profilePath = session?.handle ? `/profile/${session.handle}` : '/login';

  return (
    <aside className="app-sidebar hidden sm:flex flex-col gap-1">
      <div className="px-3 py-3 mb-2">
        <h1 className="text-xl font-bold font-heading" style={{ color: 'var(--brand)' }}>
          VoiceFlow
        </h1>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV_ENTRIES.map((entry) => {
          // Skip if spell effect hides this nav item
          if (entry.hideEffect === 'hide_search_nav' && spells.hideSearchNav) return null;
          if (entry.hideEffect === 'hide_feeds_nav' && spells.hideFeedsNav) return null;
          if (entry.hideEffect === 'hide_profile_nav' && spells.hideProfileNav) return null;

          const isActive = entry.path === '/profile'
            ? pathname?.startsWith('/profile')
            : pathname === entry.path || pathname?.startsWith(entry.path + '/') ||
              (entry.path === '/feed' && (pathname === '/feed' || pathname === '/'));

          if (entry.path === '/bookmarks') {
            return (
              <button
                key={entry.path}
                onClick={() => router.push(entry.path)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <BookmarksIcon />
                <span>Bookmarks</span>
              </button>
            );
          }

          if (entry.path === '/profile') {
            return (
              <button
                key={entry.path}
                onClick={() => router.push(profilePath)}
                className={`nav-item ${isActive ? 'active' : ''}`}
                aria-label="Profile"
              >
                <Avatar
                  src={session?.handle ? undefined : undefined}
                  alt={session?.handle || ''}
                  size="sm"
                  className={isActive ? 'ring-2 ring-[var(--brand)]' : ''}
                />
                <span>Profile</span>
              </button>
            );
          }

          return (
            <button
              key={entry.path}
              onClick={() => router.push(entry.path)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={entry.icon} />
                </svg>
                {entry.badge && unread > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </span>
              <span>{entry.label}</span>
            </button>
          );
        })}
      </nav>

      {!spells.hideCompose && (
        <div className="mt-auto pt-4 pb-2 px-3">
          <button
            onClick={() => router.push('/compose')}
            className="nav-compose"
          >
            Compose
          </button>
        </div>
      )}
    </aside>
  );
}
