// hooks/useRound.js
import { useCallback } from 'react';
import { useFetch } from '@components/hooks/useFetch';
import { fetchTournament } from '@lib/api/fetchTournament';

export const useTournament = (tournamentId, options = {}) => {
	// mettre search comme dépendance
	const { data: tournament, loading, error, setData } = useFetch(`/api/tournaments/${tournamentId}`);

	const refreshTournament = useCallback(async () => {
		const res = await fetchTournament(tournamentId, true);
		setData(res.datas);
	}, [tournamentId]);

	return {
		tournament,
		loading,
		error,
		refreshTournament,
	};
};
