'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useNotifications';
import { Avatar } from '@/components/ui/avatar';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: boolean;
  center?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Feed', path: '/feed', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Discover', path: '/discover', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { label: 'Compose', path: '/compose', icon: 'M12 4v16m8-8H4', center: true },
  { label: 'Notifications', path: '/notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', badge: true },
  { label: 'Profile', path: '/profile', icon: '' },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session } = useAuth();
  const { data: unreadData } = useUnreadCount();

  const unread = (unreadData as any)?.count ?? 0;

  // Don't show nav on login, landing
  if (pathname === '/login' || pathname === '/' || pathname?.startsWith('/oauth')) {
    return null;
  }

  const profilePath = session?.handle ? `/profile/${session.handle}` : '/login';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface-base/95 backdrop-blur-lg safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = item.path === '/profile'
            ? pathname?.startsWith('/profile')
            : pathname === item.path || pathname?.startsWith(item.path);
          const isCenter = item.center;

          if (item.path === '/profile') {
            return (
              <button
                key={item.path}
                onClick={() => router.push(profilePath)}
                className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 transition-colors ${
                  isActive ? 'text-brand' : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Profile"
              >
                <Avatar
                  src={session?.handle ? undefined : undefined}
                  alt={session?.handle || ''}
                  size="sm"
                  className={isActive ? 'ring-2 ring-brand' : ''}
                />
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 transition-colors ${
                isCenter
                  ? '-mt-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-lg hover:bg-brand-hover active:scale-95'
                  : isActive
                    ? 'text-brand'
                    : 'text-muted-foreground hover:text-foreground'
              }`}
              aria-label={item.label}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={isCenter ? 'h-6 w-6' : 'h-5 w-5'}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={isCenter ? 2 : 1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              {!isCenter && (
                <span className="text-[10px] leading-none">{item.label}</span>
              )}
              {item.badge && unread > 0 && (
                <span className="absolute -right-1 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
