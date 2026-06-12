import { useState, useCallback, useEffect } from 'react';
import { useFetch } from '@/src/hooks/useFetch';
import { useDeckAssignment } from '@/src/hooks/useDeckAssignment';
import { useDebounce } from '@/src/hooks/useDebounce';
import { mergePlayersDecks, getPlayerDecksInk, getMatchPlayerInks } from '@/src/domain/rules/scoutingRules';
import { FETCH_ALL_ASYNC } from '@/src/lib/constants';
import type { PaginatedMatches, ScoutingFilter } from '@/src/types/round';
import type { Match } from '@/src/types/match';
import type { DeckAssignment, PlayerDecksEntry } from '@/src/domain/rules/scoutingRules';

type PlaceholderEntry = { match: Match; combinations: PlayerDecksEntry[] | undefined };

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
	const [fadingMatchIds, setFadingMatchIds] = useState<Set<number>>(new Set());
	const [placeholderMatches, setPlaceholderMatches] = useState<Map<number, PlaceholderEntry>>(new Map());
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

	// Clé stable pour détecter les vrais changements de filtre (évite les re-renders sur référence tableau)
	const scoutingFilterKey = scoutingFilter.join(',');

	// Réinitialise le fade et les placeholders si l'utilisateur change de filtre/page/recherche
	useEffect(() => {
		setFadingMatchIds(new Set());
		setPlaceholderMatches(new Map());
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [scoutingFilterKey, page, debouncedSearch]);

	const closeMatchModal = () => setMatchToShow(null);
	const openMatchModal = (match: Match) => () => setMatchToShow(match);

	const dismissPlaceholder = useCallback((matchId: number) => {
		setPlaceholderMatches((prev) => { const m = new Map(prev); m.delete(matchId); return m; });
		// Garde le match invisible le temps du refetch (évite un flash du MatchCard)
		setFadingMatchIds((prev) => new Set(prev).add(matchId));
		refetch();
	}, [refetch]);

	const onValidateAssignDeck = async (payload: ValidateAssignDeckPayload) => {
		if (!matchToShow) return;
		const currentMatch = matchToShow;
		// Lance l'assignation — peut lever une ApiError propagée jusqu'à MatchModal
		const data = await assignDecks(currentMatch.id, [payload.combination1, payload.combination2]);
		// Calcul du merge avant setData pour pouvoir snapshoter les combinations
		const mergedDecks = mergePlayersDecks(playersDecks, data.playersDecks);
		setData((prev) => prev ? { ...prev, playersDecks: mergedDecks } : prev);
		closeMatchModal();
		// Si ce match était un placeholder (re-validation), on l'efface d'abord
		setPlaceholderMatches((prev) => { const m = new Map(prev); m.delete(currentMatch.id); return m; });
		if (scoutingFilter.length > 0) {
			// Snapshot des combinations avant le refetch (playersDecks sera vidé après)
			const combinations = getMatchPlayerInks(currentMatch, { players: mergedDecks.players });
			// Démarre le fade : la carte disparaît progressivement
			setFadingMatchIds((prev) => new Set(prev).add(currentMatch.id));
			setTimeout(() => {
				// Passe en placeholder inline (pas de refetch : on garde matchs stable pour la position)
				setFadingMatchIds((prev) => { const s = new Set(prev); s.delete(currentMatch.id); return s; });
				setPlaceholderMatches((prev) => new Map(prev).set(currentMatch.id, { match: currentMatch, combinations }));
			}, 2500);
		} else {
			refetch();
		}
	};

	const quickAssignDeck = async (matchId: number, assignments: DeckAssignment[]) => {
		const data = await assignDecks(matchId, assignments);
		setData((prev) =>
			prev
				? { ...prev, playersDecks: mergePlayersDecks(prev.playersDecks ?? { players: [] }, data.playersDecks) }
				: prev,
		);
		refetch();
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
		quickAssignDeck,
		fadingMatchIds,
		placeholderMatches,
		dismissPlaceholder,
		getPlayerDecksInk: (playerId: number) => getPlayerDecksInk({ players: playersDecks.players }, playerId),
		getMatchPlayerInks: (match: Match) => getMatchPlayerInks(match, { players: playersDecks.players }),
		refreshRound,
		pagination,
		scoutingStats: scoutingStats ?? null,
	};
}
