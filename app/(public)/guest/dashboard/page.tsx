'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, Clock, ChevronRight } from 'lucide-react';
import { Spinner } from '@components/ui/Spinner';
import { Badge } from '@components/ui/Badge';

interface TournamentEntry {
  accessId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED' | 'REJECTED';
  groupId: string;
  tournamentId: number;
  tournamentName: string;
  expiresAt: string;
}

function statusBadge(status: TournamentEntry['status']) {
  switch (status) {
    case 'PENDING': return <Badge label="En attente de validation" color="warning" size="sm" />;
    case 'ACCEPTED': return <Badge label="Accès actif" color="success" size="sm" />;
    case 'REJECTED': return <Badge label="Refusé" color="secondary" size="sm" />;
    case 'REVOKED': return <Badge label="Révoqué" color="secondary" size="sm" />;
    case 'EXPIRED': return <Badge label="Expiré" color="secondary" size="sm" />;
  }
}

export default function GuestDashboardPage() {
  const [tournaments, setTournaments] = useState<TournamentEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/guest/my-tournaments')
      .then((res) => (res.ok ? res.json() : { tournaments: [] }))
      .then((data) => setTournaments(data.tournaments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const active = tournaments.filter((t) => t.status === 'ACCEPTED');
  const pending = tournaments.filter((t) => t.status === 'PENDING');

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mes tournois</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tournois auxquels tu as été invité à participer.
        </p>
      </div>

      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            En attente de validation
          </h2>
          {pending.map((t) => (
            <div
              key={t.accessId}
              className="flex items-center gap-4 px-4 py-4 rounded-lg border border-yellow-800/50 bg-yellow-900/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-background border border-border shrink-0">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{t.tournamentName}</p>
                <div className="mt-1">{statusBadge(t.status)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Accès actifs
          </h2>
          {active.map((t) => (
            <Link
              key={t.accessId}
              href={`/tournaments/${t.tournamentId}?groupId=${t.groupId}`}
              className="flex items-center gap-4 px-4 py-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-background border border-border shrink-0">
                <Trophy className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{t.tournamentName}</p>
                <div className="mt-1">{statusBadge(t.status)}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      )}

      {tournaments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg">
          <Trophy className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Aucun tournoi pour le moment.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Tu apparaîtras ici dès qu&apos;un admin t&apos;aura invité via un lien d&apos;accès.
          </p>
        </div>
      )}
    </div>
  );
}
