import RoundModel from '@models/Round';
import connectToMongoDB from '@/src/lib/db';
import { mergeDeep, mergeArrayById } from '@/src/lib/mergeDeep';
import type { Match } from '@/src/types/match';
import type { PlayersDecksMap } from '@/src/domain/rules/scoutingRules';
import { TournamentPlayersDeckRepository, type DeckScope } from './TournamentPlayersDeckRepository';

export interface RoundDocument {
	id: number;
	tournamentId: number;
	results: Match[];
	playersDecks?: PlayersDecksMap | null;
	lastFetchedAt?: string | null;
	updatedAt?: string;
	createdAt?: string;
}

export interface MatchQueryOptions {
	page?: number;
	perPage?: number;
	search?: string;
	excludeOnePlayer?: boolean;
}

export const RoundRepository = {
	async findById(id: number): Promise<RoundDocument | null> {
		await connectToMongoDB();
		return RoundModel.findOne({ id }).lean() as Promise<RoundDocument | null>;
	},

	async findByIdWithDecks(id: number, scope: DeckScope): Promise<RoundDocument | null> {
		await connectToMongoDB();
		const round = (await RoundModel.findOne({ id }).lean()) as RoundDocument | null;
		if (!round) return null;
		const playersDecks = await TournamentPlayersDeckRepository.findByScope(round.tournamentId, scope);
		return { ...round, playersDecks: (playersDecks as PlayersDecksMap | null) ?? null };
	},

	async upsert(data: Record<string, unknown>) {
		await connectToMongoDB();
		return RoundModel.findOneAndUpdate({ id: data.id }, data, { new: true, upsert: true }).lean();
	},

	async deleteMany(tournamentId: number) {
		await connectToMongoDB();
		return RoundModel.deleteMany({ tournamentId });
	},

	async findMatchesPaginated(roundId: number, options: MatchQueryOptions = {}, scope: DeckScope) {
		const { page = 1, perPage = 10, search = '', excludeOnePlayer = false } = options;
		await connectToMongoDB();

		const round = (await RoundModel.findOne({ id: roundId }).lean()) as RoundDocument | null;
		if (!round) return null;

		const currentPage = Math.max(search.trim() ? 1 : page, 1);
		const limit = Math.max(perPage, 1);

		let results = round.results ?? [];

		if (search.trim() || excludeOnePlayer) {
			const isNumeric = !isNaN(Number(search));
			const lowerSearch = search.toLowerCase();

			results = results.filter((match) => {
				if (excludeOnePlayer && match.player_match_relationships.length < 2) return false;
				if (!search.trim()) return true;
				if (isNumeric) return String(match.table_number) === search;
				return match.player_match_relationships.some(
					(pmr) =>
						pmr.player?.best_identifier?.toLowerCase().includes(lowerSearch) ||
						pmr.user_event_status?.best_identifier?.toLowerCase().includes(lowerSearch),
				);
			});
		}

		const total = results.length;
		const totalPages = Math.ceil(total / limit);
		const paginatedResults = results.slice((currentPage - 1) * limit, currentPage * limit);

		const playerIdsInPage = paginatedResults.flatMap((match) =>
			(match.player_match_relationships ?? []).map((pmr) => pmr.player?.id).filter(Boolean),
		);

		const rawDecks = await TournamentPlayersDeckRepository.findByScope(round.tournamentId, scope);
		const playersDecks = rawDecks as PlayersDecksMap | null;
		const filteredPlayersDecks =
			playersDecks && playersDecks.players
				? {
						tournamentId: playersDecks.tournamentId,
						players: playersDecks.players.filter((p) => playerIdsInPage.includes(p.playerId)),
					}
				: null;

		return {
			results: paginatedResults,
			playersDecks: filteredPlayersDecks,
			pagination: { page: currentPage, perPage: limit, total, totalPages },
			lastFetchedAt: round.lastFetchedAt ?? null,
			updatedAt: round.updatedAt,
		};
	},

	async findMatch(roundId: number, matchId: number) {
		await connectToMongoDB();
		const round = (await RoundModel.findOne({ id: roundId }).lean()) as RoundDocument | null;
		if (!round) return null;
		return round.results?.find((m) => m.id === matchId) ?? null;
	},

	async findUniquePlayersByTournamentId(tournamentId: number) {
		await connectToMongoDB();
		const rounds = (await RoundModel.find({ tournamentId }).lean()) as RoundDocument[];
		const seen = new Set<number>();
		const players: import('@/src/repositories/db/TournamentPlayersDeckRepository').PlayerInfo[] = [];
		for (const round of rounds) {
			for (const match of round.results ?? []) {
				for (const pmr of match.player_match_relationships ?? []) {
					const p = pmr.player;
					if (p?.id && !seen.has(p.id)) {
						seen.add(p.id);
						players.push({
							id: p.id,
							best_identifier: p.best_identifier,
							pronouns: p.pronouns ?? null,
							eventBestIdentifier: pmr.user_event_status?.best_identifier ?? '',
						});
					}
				}
			}
		}
		return players;
	},

	async findPlayerInTournament(tournamentId: number, playerId: number) {
		await connectToMongoDB();
		const rounds = (await RoundModel.find(
			{ tournamentId, 'results.player_match_relationships.player.id': playerId },
		).lean()) as RoundDocument[];
		for (const round of rounds) {
			for (const match of round.results ?? []) {
				for (const pmr of match.player_match_relationships ?? []) {
					if (pmr.player?.id === playerId) {
						return {
							id: pmr.player.id,
							best_identifier: pmr.player.best_identifier,
							eventBestIdentifier: pmr.user_event_status?.best_identifier ?? '',
						};
					}
				}
			}
		}
		return null;
	},

	async findAllMatchesByTournamentId(tournamentId: number): Promise<import('@/src/types/match').Match[]> {
		await connectToMongoDB();
		const rounds = (await RoundModel.find({ tournamentId }, { results: 1, _id: 0 }).lean()) as RoundDocument[];
		return rounds.flatMap((r) => r.results ?? []);
	},

	async findLastFetchedIdByTournament(tournamentId: number): Promise<number | null> {
		await connectToMongoDB();
		const round = await RoundModel.findOne(
			{ tournamentId, lastFetchedAt: { $ne: null } },
			{ id: 1 },
		)
			.sort({ lastFetchedAt: -1 })
			.lean();
		return round ? (round as { id: number }).id : null;
	},

	async mergeAndSave(id: number, tournamentId: number, newData: Record<string, unknown>) {
		await connectToMongoDB();
		const existing = await RoundModel.findOne({ id });
		if (existing) {
			for (const key in newData) {
				if (key === 'results') {
					mergeArrayById(
						existing.results as unknown as { id: number }[],
						(newData.results as { id: number }[]) ?? [],
					);
					existing.markModified('results');
				} else if (newData[key] && typeof newData[key] === 'object' && !Array.isArray(newData[key])) {
					if (!existing.get(key)) existing.set(key, {});
					mergeDeep(existing.get(key) as Record<string, unknown>, newData[key] as Record<string, unknown>);
				} else {
					existing.set(key, newData[key]);
				}
			}
			existing.lastFetchedAt = new Date();
			await existing.save();
		} else {
			await RoundModel.create({ ...newData, id, tournamentId, lastFetchedAt: new Date() });
		}
		return RoundModel.findOne({ id }).lean();
	},

	async findRoundsByTournamentId(tournamentId: number): Promise<{ id: number; results: Match[] }[]> {
		await connectToMongoDB();
		const rounds = (await RoundModel.find(
			{ tournamentId },
			{ id: 1, results: 1, _id: 0 },
		)
			.sort({ id: 1 })
			.lean()) as { id: number; results: Match[] }[];
		return rounds;
	},

	async existsByTournamentId(tournamentId: number): Promise<boolean> {
		await connectToMongoDB();
		return RoundModel.exists({ tournamentId }).then(Boolean);
	},
};
