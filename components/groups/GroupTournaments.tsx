'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { AddTournamentModal } from './AddTournamentModal';
import { ExternalAccessModal } from './ExternalAccessModal';

interface GroupTournamentEntry {
  _id: string;
  tournamentId: number;
  addedBy: string;
  createdAt: string;
  name: string;
  eventStatus: string;
  startDatetime: string;
}

interface Props {
  groupId: string;
  groupName: string;
  tournaments: GroupTournamentEntry[];
  myRole: 'MEMBER' | 'ADMIN';
}

function statusColor(status: string): 'success' | 'info' | 'warning' | 'secondary' {
  if (status === 'ENDED') return 'secondary';
  if (status === 'IN_PROGRESS') return 'success';
  if (status === 'UPCOMING') return 'info';
  return 'secondary';
}

export function GroupTournaments({ groupId, groupName, tournaments: initial, myRole }: Props) {
  const router = useRouter();
  const [tournaments, setTournaments] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [externalModal, setExternalModal] = useState<{ tournamentId: number; name: string } | null>(null);

  const isAdmin = myRole === 'ADMIN';

  const removeTournament = async (tid: number) => {
    if (!confirm('Retirer ce tournoi du groupe ?')) return;
    setLoadingId(String(tid));
    try {
      const res = await fetch(`/api/groups/${groupId}/tournaments/${tid}`, { method: 'DELETE' });
      if (res.ok) setTournaments((prev) => prev.filter((t) => t.tournamentId !== tid));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/groups/${groupId}`} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground">Tournois</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{groupName}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        )}
      </div>

      {tournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg">
          <Trophy className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Aucun tournoi dans ce groupe.</p>
          {isAdmin && (
            <p className="text-sm text-muted-foreground mt-1">
              Ajoutez un tournoi pour commencer le scouting.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {tournaments.map((t) => (
            <div
              key={t._id}
              className="flex items-center justify-between p-4 rounded-lg border border-border bg-card gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Trophy className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/tournaments/${t.tournamentId}?groupId=${groupId}`}
                      className="font-medium text-foreground hover:underline truncate"
                    >
                      {t.name}
                    </Link>
                    {t.eventStatus && (
                      <Badge label={t.eventStatus} color={statusColor(t.eventStatus)} size="sm" />
                    )}
                  </div>
                  {t.startDatetime && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(t.startDatetime).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {isAdmin && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExternalModal({ tournamentId: t.tournamentId, name: t.name })}
                      title="Inviter un utilisateur externe"
                    >
                      <Users className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={loadingId === String(t.tournamentId)}
                      onClick={() => removeTournament(t.tournamentId)}
                      className="hover:text-destructive"
                      title="Retirer du groupe"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <AddTournamentModal
          groupId={groupId}
          existingIds={tournaments.map((t) => t.tournamentId)}
          onClose={() => setShowAdd(false)}
          onAdded={(entry) => { setShowAdd(false); setTournaments((prev) => [...prev, entry]); }}
        />
      )}

      {externalModal && (
        <ExternalAccessModal
          groupId={groupId}
          tournamentId={externalModal.tournamentId}
          tournamentName={externalModal.name}
          onClose={() => setExternalModal(null)}
        />
      )}
    </div>
  );
}
