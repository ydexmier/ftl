import { useEffect, useState } from 'react';
import type { TournamentStats } from '@/src/types/tournament';

export function useTournamentStats(tournamentId: number, groupId?: string | null) {
  const [stats, setStats] = useState<TournamentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (groupId) params.set('groupId', groupId);
    fetch(`/api/tournaments/${tournamentId}/stats?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [tournamentId, groupId]);

  return { stats, loading };
}
