// hooks/useRound.js
import { useState, useCallback } from 'react';
import { useFetch } from '@components/hooks/useFetch';
import { fetchRound } from 'lib/api/fetchRound';
import { useDebounce } from '@components/hooks/useDebounce';

function mergePlayersDecks(playersDecks, updatedPlayersDecks) {
	if (!playersDecks || !Array.isArray(playersDecks.players)) return playersDecks;

	// Création d'un lookup des joueurs à mettre à jour
	const updatedPlayersById = {};
	(updatedPlayersDecks?.players || []).forEach((player) => {
		updatedPlayersById[player.playerId] = player;
	});

	// Map sur les joueurs existants
	const mergedPlayers = playersDecks.players.map((player) => {
		if (updatedPlayersById[player.playerId]) {
			return { ...player, ...updatedPlayersById[player.playerId] };
		}
		return player; // sinon on garde l'existant
	});
	// Ajouter les nouveaux joueurs qui n’existent pas encore
	const existingIds = new Set(playersDecks.players.map((p) => p.playerId));
	const newPlayers = (updatedPlayersDecks?.players || []).filter((p) => !existingIds.has(p.playerId));

	return { ...playersDecks, players: [...mergedPlayers, ...newPlayers] };
}

export const useRound = (roundId, tournamentId) => {
	const [matchToShow, setMatchToShow] = useState(null);
	const [search, setSearch] = useState(''); // 🔍 nouveau state pour la recherche
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(10);
	const debouncedSearch = useDebounce(search, 300);

	// mettre search comme dépendance
	const {
		data: round,
		loading,
		error,
		setData,
	} = useFetch(
		`/api/rounds/${roundId}/matchs?search=${encodeURIComponent(debouncedSearch)}&page=${page}&perPage=${perPage}`,
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

	const getPlayerDecksInk = (playerId) => playersDecks.players.find((p) => p.playerId === playerId)?.decks || [];

	const getMatchPlayerInks = (match) => {
		const matchPlayerInks = match.player_match_relationships
			.map((pmr) => playersDecks.players.find((p) => p.playerId === pmr.player.id))
			.filter(Boolean);

		return matchPlayerInks.length ? matchPlayerInks : undefined;
	};

	const refreshRound = useCallback(async () => {
		const res = await fetchRound(tournamentId, roundId, { page, perPage, search });
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
		getPlayerDecksInk,
		getMatchPlayerInks,
		refreshRound,
		search,
		setSearch, // expose la recherche
		setPage,
		setPerPage,
		pagination,
	};
};
