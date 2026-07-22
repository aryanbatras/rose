'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useNotifications';
import {
  Home,
  Search,
  Users,
  Plus,
  Bell,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Home', path: '/feed', icon: 'home' },
  { label: 'Search', path: '/search', icon: 'search' },
  { label: 'Groups', path: '/groups', icon: 'groups' },
  { label: 'Compose', path: '/compose', icon: 'plus', center: true },
  { label: 'Notifications', path: '/notifications', icon: 'bell', badge: true },
  { label: 'Profile', path: '/profile', icon: 'profile' },
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
                  <Plus className="h-6 w-6" />
                </div>
              ) : (
                <>
                  <div className={`h-6 w-6 ${isActive ? 'text-brand' : 'text-muted-foreground'}`}>
                    {item.icon === 'home' && <Home className="h-6 w-6" />}
                    {item.icon === 'search' && <Search className="h-6 w-6" />}
                    {item.icon === 'groups' && <Users className="h-6 w-6" />}
                    {item.icon === 'bell' && <Bell className="h-6 w-6" />}
                  </div>
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
