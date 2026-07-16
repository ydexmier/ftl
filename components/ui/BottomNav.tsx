'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Users, UserCircle } from 'lucide-react';
import { cn } from './cn';

type Tab = {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  badge?: number;
  tourId?: string;
};

interface BottomNavProps {
  isGuest?: boolean;
  groupsBadge?: number;
}

export function BottomNav({ isGuest = false, groupsBadge = 0 }: BottomNavProps) {
  const pathname = usePathname();

  const tabs: Tab[] = [
    { href: '/', icon: Home, label: 'Accueil', active: pathname === '/' },
    { href: '/tournaments', icon: Trophy, label: 'Tournois', active: pathname.startsWith('/tournaments') },
    ...(!isGuest
      ? [{ href: '/groups', icon: Users, label: 'Groupes', badge: groupsBadge, active: pathname.startsWith('/groups') } as Tab]
      : []),
    { href: '/profile', icon: UserCircle, label: 'Profil', active: pathname.startsWith('/profile'), tourId: 'nav-profile' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {tabs.map(({ href, icon: Icon, label, active, badge, tourId }) => (
          <Link
            key={href}
            href={href}
            data-tour={tourId}
            className={cn(
              'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
              active ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.75} />
              {badge && badge > 0 ? (
                <span className="absolute -top-1 -right-1.5 h-4 min-w-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                  {badge > 9 ? '9+' : badge}
                </span>
              ) : null}
            </div>
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
