'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Swords, LogOut, UserCircle } from 'lucide-react';
import { cn } from './cn';
import { BottomNav } from './BottomNav';

interface BadgeCounts {
  groupInvitations: number;
  isGuest: boolean;
}

const EMPTY_COUNTS: BadgeCounts = { groupInvitations: 0, isGuest: false };

function groupsBadgeCount(counts: BadgeCounts): number {
  return counts.groupInvitations;
}

function NavBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="ml-1.5 rounded-full px-1.5 py-px text-[10px] font-bold min-w-[18px] text-center leading-4 bg-destructive text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [counts, setCounts] = useState<BadgeCounts>(EMPTY_COUNTS);

  useEffect(() => {
    fetch('/api/user/badge-counts')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setCounts(data); })
      .catch(() => {});
  }, [pathname]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const groupsCount = groupsBadgeCount(counts);
  const isGuest = counts.isGuest;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground shrink-0"
          >
            <Swords className="h-5 w-5" />
            Companion
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/"
              className={cn(
                'text-sm font-medium px-3 py-1.5 rounded-md transition-colors',
                pathname === '/'
                  ? 'text-foreground bg-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              )}
            >
              Accueil
            </Link>
            <Link
              href="/tournaments"
              className={cn(
                'text-sm font-medium px-3 py-1.5 rounded-md transition-colors',
                pathname === '/tournaments'
                  ? 'text-foreground bg-accent'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              )}
            >
              Tournois
            </Link>
            {!isGuest && (
              <Link
                href="/groups"
                className={cn(
                  'flex items-center text-sm font-medium px-3 py-1.5 rounded-md transition-colors',
                  pathname === '/groups'
                    ? 'text-foreground bg-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                )}
              >
                Groupes
                <NavBadge count={groupsCount} />
              </Link>
            )}
          </nav>

          <div className="ml-auto" />

          <Link
            href="/profile"
            data-tour="nav-profile"
            className="hidden sm:flex items-center text-muted-foreground hover:text-foreground hover:bg-accent p-2.5 rounded-md transition-colors"
            aria-label="Mon profil"
          >
            <UserCircle className="h-5 w-5" />
          </Link>

          <button
            onClick={logout}
            className="flex text-muted-foreground hover:text-destructive hover:bg-accent p-2.5 rounded-md transition-colors"
            aria-label="Déconnexion"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-4 pb-24 sm:py-6">{children}</main>
      <BottomNav isGuest={isGuest} groupsBadge={groupsCount} />
    </>
  );
}
