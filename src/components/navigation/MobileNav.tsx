'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useNotifications';

const NAV_ITEMS = [
  { label: 'Home', path: '/feed', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Search', path: '/search', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { label: 'Compose', path: '/compose', icon: 'M12 4v16m8-8H4', center: true },
  { label: 'Notifications', path: '/notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', badge: true },
  { label: 'Profile', path: '/profile', icon: '' },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useAuth();
  const { data: unreadData } = useUnreadCount();
  const unread = (unreadData as any)?.count ?? 0;

  if (pathname === '/login' || pathname === '/' || pathname?.startsWith('/oauth')) {
    return null;
  }

  const profilePath = session?.handle ? `/profile/${session.handle}` : '/login';

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface-base/95 backdrop-blur-lg safe-bottom">
      <div className="flex items-center justify-around h-14 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.path === '/profile'
            ? pathname?.startsWith('/profile')
            : pathname === item.path;

          if (item.path === '/profile') {
            return (
              <button
                key={item.path}
                onClick={() => router.push(profilePath)}
                className="flex flex-col items-center justify-center px-3 py-1"
                aria-label="Profile"
              >
                <div className={`h-6 w-6 rounded-full ${isActive ? 'ring-2 ring-brand' : ''} bg-accent`} />
                <span className="text-[10px] text-muted-foreground mt-0.5">Profile</span>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`relative flex flex-col items-center justify-center px-3 py-1 ${
                item.center ? '-mt-4' : ''
              }`}
              aria-label={item.label}
            >
              {item.center ? (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-black shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-6 ${isActive ? 'text-brand' : 'text-muted-foreground'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={isActive ? 2.5 : 2}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  <span className={`text-[10px] mt-0.5 ${isActive ? 'text-brand font-semibold' : 'text-muted-foreground'}`}>
                    {item.label}
                  </span>
                  {item.badge && unread > 0 && (
                    <span className="absolute -top-0.5 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
