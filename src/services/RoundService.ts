import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { TournamentPlayersDeckRepository, type PlayerInfo } from '@/src/repositories/db/TournamentPlayersDeckRepository';
import { GroupTournamentRepository } from '@/src/repositories/db/GroupTournamentRepository';
import { RavensburgerClient } from '@/src/repositories/external/RavensburgerClient';
import { FETCH_ALL_ASYNC } from '@/src/lib/constants';
import type { DeckScope } from '@/src/repositories/db/TournamentPlayersDeckRepository';
import type { ScoutingFilter } from '@/src/types/round';

const useAsyncFetch = process.env.NEXT_PUBLIC_USE_ASYNC_FETCH === 'true';

export interface FetchRoundOptions {
	page?: number;
	perPage?: number;
	search?: string;
	mode?: string;
	excludeOnePlayerMatches?: boolean;
	scoutingFilter?: ScoutingFilter[];
	tournamentId?: number;
}

function extractPlayersFromResults(results: unknown[]): PlayerInfo[] {
	const seen = new Set<number>();
	const players: PlayerInfo[] = [];
	for (const match of results as Array<{
		player_match_relationships?: Array<{
			player?: {
				id?: number;
				best_identifier?: string;
				pronouns?: string | null;
			};
			user_event_status?: { best_identifier?: string };
		}>;
	}>) {
		for (const pmr of match.player_match_relationships ?? []) {
			const p = pmr.player;
			if (p?.id && !seen.has(p.id)) {
				seen.add(p.id);
				players.push({
					id: p.id,
					best_identifier: p.best_identifier ?? '',
					pronouns: p.pronouns ?? null,
					eventBestIdentifier: pmr.user_event_status?.best_identifier ?? '',
				});
			}
		}
	}
	return players;
}

export const RoundService = {
	async fetchAndSave(tournamentId: number, roundId: number, options: FetchRoundOptions = {}, scope: DeckScope) {
		const { page = 1, perPage = 10, search = '', mode, excludeOnePlayerMatches = false } = options;

		const tournament = await TournamentRepository.findById(tournamentId);
		if (!tournament) throw new Error(`Tournoi ${tournamentId} introuvable en base`);

		const shouldFetchAllAsync = useAsyncFetch && mode === FETCH_ALL_ASYNC.mode;
		const fetchPageSize = shouldFetchAllAsync ? FETCH_ALL_ASYNC.perPage : perPage;

		const firstPage = await RavensburgerClient.fetchRound(roundId, 1, fetchPageSize);
		const allResults = [...(firstPage.results ?? [])];

		if (shouldFetchAllAsync && firstPage.total > allResults.length) {
			const remaining = Math.ceil((firstPage.total - allResults.length) / FETCH_ALL_ASYNC.perPage);
			const pages = await Promise.all(
				Array.from({ length: remaining }, (_, i) =>
					RavensburgerClient.fetchRound(roundId, i + 2, FETCH_ALL_ASYNC.perPage),
				),
			);
			pages.forEach((p) => allResults.push(...(p.results ?? [])));
		}

		const roundData = { ...firstPage, results: allResults };
		await RoundRepository.mergeAndSave(roundId, tournamentId, roundData as Record<string, unknown>);

		// Populate TournamentPlayersDeck for all group scopes + existing personal scopes
		const uniquePlayers = extractPlayersFromResults(allResults);
		if (uniquePlayers.length > 0) {
			const groups = await GroupTournamentRepository.findGroupsByTournamentId(tournamentId);
			await Promise.all(
				groups.map((gt) =>
					TournamentPlayersDeckRepository.upsertMissingPlayers(
						tournamentId,
						uniquePlayers,
						{ groupId: String(gt.groupId) },
					),
				),
			);
			await TournamentPlayersDeckRepository.upsertMissingPlayersAllExisting(tournamentId, uniquePlayers);
			await TournamentPlayersDeckRepository.syncPlayerIdentifiers(tournamentId, uniquePlayers);
		}

		return RoundRepository.findMatchesPaginated(roundId, {
			page: Number(page),
			perPage: Number(perPage),
			search,
			excludeOnePlayer: excludeOnePlayerMatches,
		}, scope);
	},

	async getMatchesPaginated(roundId: number, options: FetchRoundOptions = {}, scope: DeckScope) {
		const data = await RoundRepository.findMatchesPaginated(roundId, {
			page: options.page,
			perPage: options.perPage,
			search: options.search,
			excludeOnePlayer: options.excludeOnePlayerMatches,
			scoutingFilter: options.scoutingFilter,
			tournamentId: options.tournamentId,
		}, scope);
		if (!data) throw new Error('ROUND_NOT_FOUND');
		return data;
	},

	async getMatch(roundId: number, matchId: number) {
		const match = await RoundRepository.findMatch(roundId, matchId);
		if (!match) throw new Error('Match not found');
		return match;
	},
};
