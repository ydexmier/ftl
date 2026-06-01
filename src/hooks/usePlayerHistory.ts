'use client';
import { useState, useEffect } from 'react';
import type { PlayerHistoryEntry } from '@/src/types/player';

export function usePlayerHistory(
  tournamentId: number,
  playerId: number | null,
  groupId?: string | null,
) {
  const [entries, setEntries] = useState<PlayerHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) {
      setEntries([]);
      return;
    }
    const params = new URLSearchParams();
    if (groupId) params.set('groupId', groupId);

    setLoading(true);
    setError(null);
    fetch(`/api/tournaments/${tournamentId}/players/${playerId}/history?${params}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => setEntries(data.history ?? []))
      .catch(() => setError('Impossible de charger le parcours'))
      .finally(() => setLoading(false));
  }, [tournamentId, playerId, groupId]);

  return { entries, loading, error };
}
