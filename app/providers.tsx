'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/access-request'];
const POLL_INTERVAL_MS = 4 * 60 * 1000; // 4 min — bien sous les 30 min d'inactivité DB

function SessionGuard() {
  const pathname = usePathname();
  const lastCheckRef = useRef(Date.now());
  const checkingRef = useRef(false);
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  useEffect(() => {
    if (isPublic) return;

    const check = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        // redirect: 'manual' pour intercepter la redirection middleware (cookie expiré = 302)
        const res = await fetch('/api/auth/refresh', { method: 'POST', redirect: 'manual' });
        if (res.status === 401 || res.type === 'opaqueredirect') {
          window.location.href = '/login?reason=expired';
        } else {
          lastCheckRef.current = Date.now();
        }
      } catch {
        // ignore les erreurs réseau (offline, etc.)
      } finally {
        checkingRef.current = false;
      }
    };

    const onVisibilityChange = () => {
      // Vérifie immédiatement si l'onglet revient au premier plan après >1 min d'absence
      if (document.visibilityState === 'visible' && Date.now() - lastCheckRef.current > 60_000) {
        check();
      }
    };

    const interval = setInterval(check, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isPublic]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SessionGuard />
      {children}
    </>
  );
}
