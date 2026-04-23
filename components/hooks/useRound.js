// hooks/useRound.js
import { useState, useCallback } from ‘react’;
import { useFetch } from ‘@components/hooks/useFetch’;
import { fetchRound } from ‘lib/api/fetchRound’;
import { useDebounce } from ‘@components/hooks/useDebounce’;
import { FETCH_ALL_ASYNC } from ‘constants/index.js’;
import {
	mergePlayersDecks,
	getPlayerDecksInk,
	getMatchPlayerInks,
} from ‘@/src/services/ScoutingService’;

const useAsyncFetch = process.env.NEXT_PUBLIC_USE_ASYNC_FETCH === ‘true’;

export const useRound = (roundId, tournamentId, options = {}) => {
	const [matchToShow, setMatchToShow] = useState(null);
	const { page, perPage, search, excludeOnePlayerMatches } = options;
	const debouncedSearch = useDebounce(search, 300);

	// mettre search comme dépendance
	const {
		data: round,
		loading,
		error,
		setData,
	} = useFetch(
		`/api/rounds/${roundId}/matchs?search=${encodeURIComponent(debouncedSearch)}&page=${page}&perPage=${perPage}&excludeOnePlayerMatches=${excludeOnePlayerMatches}`,
	);

	const {
		results: matchs = [],
		updatedAt,
		playersDecks = { players: [] },
		pagination = { page: 1, totalPages: 1 },
	} = round || {};

	const closeMatchModal = () => setMatchToShow(null);
	const openMatchModal = (match) => () => setMatchToShow(match);

	const onValidateAssignDeck = async (datas) => {
		try {
			const response = await fetch(`/api/rounds/${roundId}/matchs/${matchToShow.id}/assign_deck`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ decks: [datas.combination1, datas.combination2] }),
			});
			if (!response.ok) throw new Error('Network error');

			const data = await response.json();
			setData({
				...round,
				playersDecks: mergePlayersDecks(playersDecks, data.playersDecks),
			});
			closeMatchModal();
		} catch (err) {
			console.error('Error:', err);
		}
	};

	const getPlayerDecksInkForPlayer = (playerId) => getPlayerDecksInk({ players: playersDecks.players }, playerId);
	const getMatchPlayerInksForMatch = (match) => getMatchPlayerInks(match, { players: playersDecks.players });

	const refreshRound = useCallback(async () => {
		const res = await fetchRound(tournamentId, roundId, {
			page,
			perPage,
			search,
			excludeOnePlayerMatches,
			mode: useAsyncFetch && FETCH_ALL_ASYNC.mode,
		});
		setData(res.datas);
	}, [tournamentId, roundId, search]);

	return {
		matchs,
		updatedAt,
		loading,
		error,
		matchToShow,
		openMatchModal,
		closeMatchModal,
		onValidateAssignDeck,
		getPlayerDecksInk: getPlayerDecksInkForPlayer,
		getMatchPlayerInks: getMatchPlayerInksForMatch,
		refreshRound,
		pagination,
	};
};
