'use client';
import { useEffect, useState } from 'react';
import { Spinner } from '@components/ui/Spinner';
import Ink from '@components/ui/Ink';

interface PlayerRow {
  playerId: number;
  best_identifier: string;
  decks: string[][];
}

interface PlayersTabProps {
  tournamentId: number;
  groupId?: string | null;
}

export function PlayersTab({ tournamentId, groupId }: PlayersTabProps) {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = groupId
      ? `/api/tournaments/${tournamentId}/players?groupId=${groupId}`
      : `/api/tournaments/${tournamentId}/players`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : { players: [] }))
      .then((data) => setPlayers(data.players ?? []))
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false));
  }, [tournamentId, groupId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-16">
        Aucune bicolorité enregistrée pour ce tournoi.
      </p>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Joueur
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bicolorité
            </th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => (
            <tr key={p.playerId} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 text-foreground truncate max-w-xs">{p.best_identifier}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  {p.decks.length === 0 ? (
                    <span className="text-muted-foreground text-xs">—</span>
                  ) : (
                    p.decks.map((deck, i) => (
                      <Ink key={i} type={deck} width={32} />
                    ))
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
