import { useCallback } from 'react';
import { useFetch } from '@/src/hooks/useFetch';
import type { Tournament } from '@/src/types/tournament';

async function fetchTournament(tournamentId: number): Promise<{ datas: Tournament }> {
	const res = await fetch('/api/tournaments/fetch', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ tournamentId }),
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.error ?? 'Erreur lors de la récupération du tournoi');
	}
	return res.json();
}

export function useTournament(tournamentId: number) {
	const { data: tournament, loading, error, setData } = useFetch<Tournament>(`/api/tournaments/${tournamentId}`);

	const refreshTournament = useCallback(async () => {
		const res = await fetchTournament(tournamentId);
		setData(res.datas);
	}, [tournamentId]);

	return { tournament, loading, error, refreshTournament };
}
