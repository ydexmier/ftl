'use client';
import { useState, useEffect } from 'react';
import { X, AlertTriangle, HelpCircle, Send, MessageSquare } from 'lucide-react';
import { Button } from '@components/ui/Button';
import Ink from '@components/ui/Ink';

export interface ConflictGroup {
  _id: string;
  groupId: { _id: string; name: string } | string;
  playerId: number;
  playerName: string;
  previousInks: string[][];
  proposedInks: string[][];
}

interface Props {
  tournamentId: number;
  conflicts: ConflictGroup[];
  onConflictResolved: (conflictId: string) => void;
  onClose: () => void;
}

function groupName(groupId: ConflictGroup['groupId']): string {
  if (typeof groupId === 'object' && 'name' in groupId) return groupId.name;
  return String(groupId);
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

interface GroupComment {
  _id: string;
  content: string;
  inks: string[];
  authorId: { _id: string; username: string } | string;
}

export function ConflictResolutionModal({ tournamentId, conflicts, onConflictResolved, onClose }: Props) {
  const [loading, setLoading] = useState<Record<string, 'PENDING_ADMIN' | 'UNCERTAINTY' | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [groupComments, setGroupComments] = useState<Record<string, GroupComment[]>>({});

  useEffect(() => {
    conflicts.forEach((conflict) => {
      if (groupComments[conflict._id] !== undefined) return;
      const gid = typeof conflict.groupId === 'object' ? conflict.groupId._id : String(conflict.groupId);
      fetch(`/api/tournaments/${tournamentId}/players/${conflict.playerId}/comments?groupId=${gid}`)
        .then((r) => (r.ok ? r.json() : { comments: [] }))
        .then((d) => {
          const list = Array.isArray(d.comments) ? d.comments : [];
          setGroupComments((prev) => ({ ...prev, [conflict._id]: list }));
        })
        .catch(() => setGroupComments((prev) => ({ ...prev, [conflict._id]: [] })));
    });
  }, [conflicts, tournamentId]);

  const resolve = async (conflictId: string, status: 'PENDING_ADMIN' | 'UNCERTAINTY') => {
    setLoading((prev) => ({ ...prev, [conflictId]: status }));
    setErrors((prev) => ({ ...prev, [conflictId]: '' }));
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/conflicts/${conflictId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
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
    <div data-testid="conflict-resolution-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <h2 className="font-semibold text-foreground">
              Conflits d&apos;encres ({conflicts.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          <p className="text-sm text-muted-foreground">
            Des joueurs ont des encres différentes entre vos données personnelles et celles du groupe.
            Proposez votre version à l&apos;admin ou marquez comme incertitude si vous n&apos;êtes pas sûr.
          </p>

          {conflicts.map((conflict) => (
            <div key={conflict._id} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground text-sm">{conflict.playerName}</p>
                  <p className="text-xs text-muted-foreground">Groupe : {groupName(conflict.groupId)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Version du groupe
                  </p>
                  <InkDeck decks={conflict.previousInks} />
                  {(groupComments[conflict._id] ?? []).length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> Notes du groupe
                      </p>
                      {(groupComments[conflict._id] ?? []).map((c) => (
                        <div key={c._id} className="rounded-lg bg-muted/20 border border-border px-3 py-2">
                          <p className="text-xs text-foreground/80">{c.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-yellow-400 uppercase tracking-wide">
                    Ma version
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
                  variant="default"
                  loading={loading[conflict._id] === 'PENDING_ADMIN'}
                  disabled={!!loading[conflict._id]}
                  onClick={() => resolve(conflict._id, 'PENDING_ADMIN')}
                >
                  <Send className="h-3.5 w-3.5" />
                  Proposer à l&apos;admin
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  loading={loading[conflict._id] === 'UNCERTAINTY'}
                  disabled={!!loading[conflict._id]}
                  onClick={() => resolve(conflict._id, 'UNCERTAINTY')}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Incertitude
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
