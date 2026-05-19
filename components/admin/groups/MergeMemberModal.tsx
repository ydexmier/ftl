'use client';
import { useState } from 'react';
import { GitMerge } from 'lucide-react';
import { Button } from '@components/ui/Button';

export interface Member {
  userId: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

export interface Tournament {
  tournamentId: number;
  name: string;
  start_datetime: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface RawConflict {
  _id: string;
  tournamentId: number;
  playerId: number;
  playerName: string;
  previousInks: string[][];
  proposedInks: string[][];
}

interface Props {
  groupId: string;
  member: Member;
  tournaments: Tournament[];
  onClose: () => void;
  onConflicts: (conflicts: RawConflict[], tournamentName: string) => void;
  onSuccess: () => void;
}

export function MergeMemberModal({ groupId, member, tournaments, onClose, onConflicts, onSuccess }: Props) {
  const [tournamentId, setTournamentId] = useState<number | ''>(tournaments[0]?.tournamentId ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!tournamentId) { setError('Sélectionnez un tournoi'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/groups/${groupId}/members/${member.userId}/merge-tournament`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? 'Erreur lors de la fusion');
        return;
      }
      const data = await res.json();
      if (data.conflicts?.length > 0) {
        const t = tournaments.find((t) => t.tournamentId === tournamentId);
        onConflicts(data.conflicts, t?.name ?? String(tournamentId));
      } else {
        setDone(true);
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-foreground">
          Fusionner les données — {member.username}
        </h2>
        <p className="text-sm text-muted-foreground">
          Les données de scouting personnelles seront importées dans le groupe. Des conflits seront créés si les encres diffèrent.
        </p>
        {done ? (
          <p className="text-sm text-success">Fusion effectuée avec succès.</p>
        ) : (
          <>
            {tournaments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun tournoi lié à ce groupe.</p>
            ) : (
              <select
                value={tournamentId}
                onChange={(e) => setTournamentId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {tournaments.map((t) => (
                  <option key={t.tournamentId} value={t.tournamentId}>{t.name}</option>
                ))}
              </select>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Fermer</Button>
          {!done && tournaments.length > 0 && (
            <Button onClick={submit} loading={loading}>
              <GitMerge className="h-4 w-4" />
              Fusionner
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
