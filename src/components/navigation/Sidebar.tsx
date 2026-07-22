'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useBookmarkStore } from '@/stores/bookmark-store';
import { useSpells } from '@/hooks/useSpells';
import { Avatar } from '@/components/ui/avatar';
import {
  Home,
  Search,
  Bell,
  LayoutGrid,
  Users,
  Zap,
  Bookmark,
  Settings,
  Play,
} from 'lucide-react';

interface NavEntry {
  label: string;
  path: string;
  icon: 'home' | 'search' | 'reels' | 'bell' | 'feeds' | 'groups' | 'spells' | 'bookmarks' | 'profile' | 'settings';
  badge?: boolean;
  hideEffect?: string;
}

const NAV_ENTRIES: NavEntry[] = [
  { label: 'Home', path: '/feed', icon: 'home' },
  { label: 'Search', path: '/search', icon: 'search', hideEffect: 'hide_search_nav' },
  { label: 'Reels', path: '/reels', icon: 'reels' },
  { label: 'Notifications', path: '/notifications', icon: 'bell', badge: true },
  { label: 'Discover', path: '/discover', icon: 'feeds', hideEffect: 'hide_feeds_nav' },
  { label: 'Groups', path: '/groups', icon: 'groups' },
  { label: 'Spells', path: '/spells', icon: 'spells' },
  { label: 'Bookmarks', path: '/bookmarks', icon: 'bookmarks' },
  { label: 'Profile', path: '/profile', icon: 'profile', hideEffect: 'hide_profile_nav' },
  { label: 'Settings', path: '/settings', icon: 'settings' },
];

function NavIcon({ icon, isActive }: { icon: string; isActive: boolean }) {
  const className = `h-6 w-6 ${isActive ? 'stroke-[2.5]' : ''}`;
  switch (icon) {
    case 'home': return <Home className={className} />;
    case 'search': return <Search className={className} />;
    case 'bell': return <Bell className={className} />;
    case 'feeds': return <LayoutGrid className={className} />;
    case 'reels': return <Play className={className} />;
    case 'groups': return <Users className={className} />;
    case 'spells': return <Zap className={className} />;
    case 'bookmarks': return <BookmarksIcon />;
    case 'settings': return <Settings className={className} />;
    default: return <Home className={className} />;
  }
}

function BookmarksIcon() {
  const { bookmarks } = useBookmarkStore();
  const count = bookmarks.length;
  return (
    <span className="relative">
      <Bookmark className="h-6 w-6" />
      {count > 0 && (            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
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
      <div className="px-3 pt-4 pb-5">
        <h1 className="text-2xl font-bold font-heading tracking-tight" style={{ color: 'var(--brand)' }}>
          Rose
        </h1>
      </div>

      <nav className="flex flex-col gap-0.5 flex-1">
        {NAV_ENTRIES.map((entry) => {
          // Use icon as unique key (Home and Reels both use path '/feed')
          const itemKey = entry.icon;
          if (entry.hideEffect === 'hide_search_nav' && spells.hideSearchNav) return null;
          if (entry.hideEffect === 'hide_feeds_nav' && spells.hideFeedsNav) return null;
          if (entry.hideEffect === 'hide_profile_nav' && spells.hideProfileNav) return null;

          const isActive = entry.path === '/profile'
            ? pathname?.startsWith('/profile')
            : pathname === entry.path || pathname?.startsWith(entry.path + '/') ||
              (entry.path === '/feed' && (pathname === '/feed' || pathname === '/')) ||
              (entry.path === '/groups' && pathname?.startsWith('/groups/'));

          if (entry.path === '/profile') {
            return (
              <button
                key={itemKey}
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
              key={itemKey}
              onClick={() => router.push(entry.path)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="relative">
                <NavIcon icon={entry.icon} isActive={isActive} />
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
