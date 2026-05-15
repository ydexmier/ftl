'use client';
import { useState } from 'react';
import { X, AlertTriangle, Check, Ban } from 'lucide-react';
import { Button } from '@components/ui/Button';
import Ink from '@components/ui/Ink';

interface AdminConflict {
  _id: string;
  tournamentId: number;
  playerId: number;
  playerName: string;
  previousInks: string[][];
  proposedInks: string[][];
  userId: { _id: string; username: string } | string;
}

interface Props {
  groupId: string;
  tournamentName: string;
  conflicts: AdminConflict[];
  onConflictResolved: (conflictId: string) => void;
  onClose: () => void;
}

function username(userId: AdminConflict['userId']): string {
  if (typeof userId === 'object' && 'username' in userId) return userId.username;
  return String(userId);
}

function InkDeck({ decks }: { decks: string[][] }) {
  if (decks.length === 0) return <span className="text-muted-foreground text-xs italic">Aucune encre</span>;
  return (
    <div className="flex gap-2 flex-wrap">
      {decks.map((deck, i) => (
        <Ink key={i} type={deck} width={40} />
      ))}
    </div>
  );
}

export function AdminConflictModal({ groupId, tournamentName, conflicts, onConflictResolved, onClose }: Props) {
  const [loading, setLoading] = useState<Record<string, 'APPROVED' | 'REJECTED' | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resolve = async (conflictId: string, decision: 'APPROVED' | 'REJECTED') => {
    setLoading((prev) => ({ ...prev, [conflictId]: decision }));
    setErrors((prev) => ({ ...prev, [conflictId]: '' }));
    try {
      const res = await fetch(`/api/groups/${groupId}/conflicts/${conflictId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrors((prev) => ({ ...prev, [conflictId]: data.error ?? 'Erreur' }));
        return;
      }
      onConflictResolved(conflictId);
    } finally {
      setLoading((prev) => ({ ...prev, [conflictId]: null }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div>
              <h2 className="font-semibold text-foreground">Propositions en attente</h2>
              <p className="text-xs text-muted-foreground">{tournamentName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          <p className="text-sm text-muted-foreground">
            Des membres ont proposé des corrections d&apos;encres. Approuvez pour appliquer leur version au groupe,
            rejetez pour conserver les encres actuelles.
          </p>

          {conflicts.map((conflict) => (
            <div key={conflict._id} className="border border-border rounded-lg p-4 space-y-3">
              <div>
                <p className="font-medium text-foreground text-sm">{conflict.playerName}</p>
                <p className="text-xs text-muted-foreground">Proposé par {username(conflict.userId)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Encres actuelles du groupe
                  </p>
                  <InkDeck decks={conflict.previousInks} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-yellow-400 uppercase tracking-wide">
                    Version proposée
                  </p>
                  <InkDeck decks={conflict.proposedInks} />
                </div>
              </div>

              {errors[conflict._id] && (
                <p className="text-xs text-destructive">{errors[conflict._id]}</p>
              )}

              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="success"
                  loading={loading[conflict._id] === 'APPROVED'}
                  disabled={!!loading[conflict._id]}
                  onClick={() => resolve(conflict._id, 'APPROVED')}
                >
                  <Check className="h-3.5 w-3.5" />
                  Approuver
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  loading={loading[conflict._id] === 'REJECTED'}
                  disabled={!!loading[conflict._id]}
                  onClick={() => resolve(conflict._id, 'REJECTED')}
                  className="hover:text-destructive hover:border-destructive"
                >
                  <Ban className="h-3.5 w-3.5" />
                  Rejeter
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border p-4 flex justify-end shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
