import { useState, useCallback } from 'react';
import { useFetch } from '@/src/hooks/useFetch';
import { useDeckAssignment } from '@/src/hooks/useDeckAssignment';
import { useDebounce } from '@/src/hooks/useDebounce';
import { mergePlayersDecks, getPlayerDecksInk, getMatchPlayerInks } from '@/src/domain/rules/scoutingRules';
import { FETCH_ALL_ASYNC } from '@/src/lib/constants';
import type { PaginatedMatches, ScoutingFilter } from '@/src/types/round';
import type { Match } from '@/src/types/match';
import type { DeckAssignment } from '@/src/domain/rules/scoutingRules';

const useAsyncFetch = process.env.NEXT_PUBLIC_USE_ASYNC_FETCH === 'true';

interface RoundOptions {
	page?: number;
	perPage?: number;
	search?: string;
	excludeOnePlayerMatches?: boolean;
	groupId?: string | null;
	scoutingFilter?: ScoutingFilter[];
}

interface ValidateAssignDeckPayload {
	combination1: DeckAssignment;
	combination2: DeckAssignment;
}

async function fetchRoundFromAPI(
	tournamentId: number,
	roundId: number,
	options: RoundOptions & { mode?: string },
): Promise<{ datas: PaginatedMatches }> {
	const res = await fetch('/api/rounds/fetch', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ tournamentId, roundId, options }),
	});
	if (!res.ok) throw new Error("Erreur lors de l'exécution du script");
	return res.json();
}

export function useRound(roundId: number, tournamentId: number, options: RoundOptions = {}) {
	const [matchToShow, setMatchToShow] = useState<Match | null>(null);
	const { page = 1, perPage = 10, search = '', excludeOnePlayerMatches = false, groupId = null, scoutingFilter = [] } = options;
	const debouncedSearch = useDebounce(search, 300);
	const { assignDecks } = useDeckAssignment(roundId, groupId);

	const { data: round, loading, error, setData, refetch } = useFetch<PaginatedMatches>(
		`/api/rounds/${roundId}/matchs?search=${encodeURIComponent(debouncedSearch)}&page=${page}&perPage=${perPage}&excludeOnePlayerMatches=${excludeOnePlayerMatches}&tournamentId=${tournamentId}${groupId ? `&groupId=${encodeURIComponent(groupId)}` : ''}${scoutingFilter.length > 0 ? `&scoutingFilter=${scoutingFilter.join(',')}` : ''}`,
	);

	const {
		results: matchs = [],
		lastFetchedAt,
		updatedAt,
		pagination = { page: 1, perPage: 10, total: 0, totalPages: 1 },
		scoutingStats,
	} = round ?? {};
	const playersDecks = round?.playersDecks ?? { players: [] };

	const closeMatchModal = () => setMatchToShow(null);
	const openMatchModal = (match: Match) => () => setMatchToShow(match);

	const onValidateAssignDeck = async (payload: ValidateAssignDeckPayload) => {
		if (!matchToShow) return;
		try {
			const data = await assignDecks(matchToShow.id, [payload.combination1, payload.combination2]);
			// Mise à jour optimiste immédiate
			setData((prev) =>
				prev
					? { ...prev, playersDecks: mergePlayersDecks(prev.playersDecks ?? { players: [] }, data.playersDecks) }
					: prev,
			);
			closeMatchModal();
			// Re-fetch autoritatif pour garantir la cohérence avec le serveur
			refetch();
		} catch {
			// erreur silencieuse — l'état précédent est conservé
		}
	};

	const refreshRound = useCallback(async () => {
		await fetchRoundFromAPI(tournamentId, roundId, {
			page,
			perPage,
			search,
			excludeOnePlayerMatches,
			mode: useAsyncFetch ? FETCH_ALL_ASYNC.mode : undefined,
		});
		refetch();
	}, [tournamentId, roundId, search, refetch]);

	return {
		matchs,
		lastFetchedAt,
		updatedAt,
		loading,
		error,
		matchToShow,
		openMatchModal,
		closeMatchModal,
		onValidateAssignDeck,
		getPlayerDecksInk: (playerId: number) => getPlayerDecksInk({ players: playersDecks.players }, playerId),
		getMatchPlayerInks: (match: Match) => getMatchPlayerInks(match, { players: playersDecks.players }),
		refreshRound,
		pagination,
		scoutingStats: scoutingStats ?? null,
	};
}
