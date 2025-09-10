// hooks/useRound.js
import { useState, useEffect } from 'react';
import { useFetch } from '@scooting/hooks/useFetch';
import { fetchRound } from '@scooting/lib/api/fetchRound';
import { useDebounce } from '@components/hooks/useDebounce';

export const useRound = (roundId, tournamentId) => {
	const [matchToShow, setMatchToShow] = useState(null);
	const [search, setSearch] = useState(''); // 🔍 nouveau state pour la recherche

	const debouncedSearch = useDebounce(search, 300);

	// mettre search comme dépendance
	const {
		data: round,
		loading,
		error,
		setData,
		refetch,
	} = useFetch(`/api/rounds/${roundId}/matchs?search=${encodeURIComponent(debouncedSearch)}`);

	const { results: matchs = [], updatedAt, playersDecks = { players: [] } } = round || {};

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
				playersDecks: { ...playersDecks, players: data.playersDecks.players || [] },
			});
			closeMatchModal();
		} catch (err) {
			console.error('Error:', err);
		}
	};

	const getPlayerDecksInk = (playerId) => playersDecks.players.find((p) => p.playerId === playerId)?.decks || [];

	const getMatchPlayerInks = (match) => {
		const matchPlayerInks = match.player_match_relationships
			.map((pmr) => playersDecks.players.find((p) => p.playerId === pmr.player.id))
			.filter(Boolean);

		return matchPlayerInks.length ? matchPlayerInks : undefined;
	};

	const refreshRound = async () => {
		const res = await fetchRound(tournamentId, roundId);
		setData(res.datas);
	};

	return {
		matchs,
		updatedAt,
		loading,
		error,
		matchToShow,
		openMatchModal,
		closeMatchModal,
		onValidateAssignDeck,
		getPlayerDecksInk,
		getMatchPlayerInks,
		refreshRound,
		search,
		setSearch, // expose la recherche
	};
};
