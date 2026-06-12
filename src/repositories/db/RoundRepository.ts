import RoundModel from '@models/Round';
import connectToMongoDB from '@/src/lib/db';
import { mergeDeep, mergeArrayById } from '@/src/lib/mergeDeep';
import type { Match } from '@/src/types/match';
import type { PlayersDecksMap } from '@/src/domain/rules/scoutingRules';
import type { ScoutingFilter, ScoutingStats } from '@/src/types/round';
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
	scoutingFilter?: ScoutingFilter[];
	tournamentId?: number;
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
		const { page = 1, perPage = 10, search = '', excludeOnePlayer = false, scoutingFilter = null, tournamentId: optTournamentId } = options;
		await connectToMongoDB();

		const currentPage = Math.max(search.trim() ? 1 : page, 1);
		const limit = Math.max(perPage, 1);

		type RoundMeta = { tournamentId: number; lastFetchedAt: Date | null; updatedAt: Date };
		const fetchMeta = () =>
			RoundModel.findOne({ id: roundId }, { tournamentId: 1, lastFetchedAt: 1, updatedAt: 1 })
				.lean() as Promise<RoundMeta | null>;

		// Fetch meta and player decks in parallel when tournamentId is provided by the caller
		let meta: RoundMeta | null;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let rawDecks: any;

		if (optTournamentId) {
			[meta, rawDecks] = await Promise.all([
				fetchMeta(),
				TournamentPlayersDeckRepository.findByScope(optTournamentId, scope),
			]);
		} else {
			meta = await fetchMeta();
			if (!meta) return null;
			rawDecks = await TournamentPlayersDeckRepository.findByScope(meta.tournamentId, scope);
		}

		if (!meta) return null;
		const { lastFetchedAt, updatedAt } = meta;

		// full: exactly 1 deck with 2 inks · partial: 2+ decks OR 1 deck with 1 ink · none: 0 inks
		const players: Array<{ playerId: number; decks: string[][] }> = rawDecks?.players ?? [];
		const fullPlayerIds: number[] = players
			.filter((p) => p.decks.length === 1 && p.decks[0].length === 2)
			.map((p) => p.playerId);
		const partialPlayerIds: number[] = players
			.filter((p) => p.decks.length >= 2 || (p.decks.length === 1 && p.decks[0].length === 1))
			.map((p) => p.playerId);
		const knownPlayerIds: number[] = [...fullPlayerIds, ...partialPlayerIds];

		// Build search filter stages — moved into $facet branches so uniquePlayers stats stay global
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const searchStages: any[] = [];
		if (search.trim()) {
			const isNumeric = !isNaN(Number(search));
			if (isNumeric) {
				searchStages.push({ $match: { 'results.table_number': Number(search) } });
			} else {
				const regex = { $regex: search.trim(), $options: 'i' };
				searchStages.push({
					$match: {
						$or: [
							{ 'results.player_match_relationships.player.best_identifier': regex },
							{ 'results.player_match_relationships.user_event_status.best_identifier': regex },
						],
					},
				});
			}
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const pipeline: any[] = [
			{ $match: { id: roundId } },
			{ $unwind: '$results' },
		];

		if (excludeOnePlayer) {
			pipeline.push({
				$match: {
					$expr: { $gte: [{ $size: { $ifNull: ['$results.player_match_relationships', []] } }, 2] },
				},
			});
		}

		// Compute per-match player presence flags for each scouting category
		pipeline.push({
			$addFields: {
				_hasFullPlayer: {
					$gt: [{
						$size: {
							$filter: {
								input: { $ifNull: ['$results.player_match_relationships', []] },
								as: 'pmr',
								cond: { $in: ['$$pmr.player.id', fullPlayerIds] },
							},
						},
					}, 0],
				},
				_hasPartialPlayer: {
					$gt: [{
						$size: {
							$filter: {
								input: { $ifNull: ['$results.player_match_relationships', []] },
								as: 'pmr',
								cond: { $in: ['$$pmr.player.id', partialPlayerIds] },
							},
						},
					}, 0],
				},
				_hasNonePlayer: {
					$gt: [{
						$size: {
							$filter: {
								input: { $ifNull: ['$results.player_match_relationships', []] },
								as: 'pmr',
								cond: { $not: [{ $in: ['$$pmr.player.id', knownPlayerIds] }] },
							},
						},
					}, 0],
				},
			},
		});

		const fieldMap: Record<ScoutingFilter, string> = { full: '_hasFullPlayer', partial: '_hasPartialPlayer', none: '_hasNonePlayer' };
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let scoutingFilterStages: any[] = [];
		const activeFilters = scoutingFilter ?? [];
		if (activeFilters.length === 1) {
			scoutingFilterStages = [{ $match: { [fieldMap[activeFilters[0]]]: true } }];
		} else if (activeFilters.length > 1) {
			scoutingFilterStages = [{ $match: { $or: activeFilters.map((f) => ({ [fieldMap[f]]: true })) } }];
		}

		pipeline.push({
			$facet: {
				// Collect unique player IDs across the whole round (no search/filter) for player-based stats
				uniquePlayers: [
					{ $unwind: '$results.player_match_relationships' },
					{ $group: { _id: '$results.player_match_relationships.player.id' } },
				],
				total: [...searchStages, ...scoutingFilterStages, { $count: 'count' }],
				data: [
					...searchStages,
					...scoutingFilterStages,
					{ $skip: (currentPage - 1) * limit },
					{ $limit: limit },
					{ $replaceRoot: { newRoot: '$results' } },
				],
			},
		});

		const aggResult = await RoundModel.aggregate(pipeline);

		const { uniquePlayers: uniquePlayersArr, total: totalArr, data } = (aggResult[0] ?? { uniquePlayers: [], total: [], data: [] }) as {
			uniquePlayers: Array<{ _id: number }>;
			total: Array<{ count: number }>;
			data: Match[];
		};

		const total = totalArr[0]?.count ?? 0;
		const totalPages = Math.ceil(total / limit);

		// Compute player-based scoutingStats using the same categorization as the filter
		const fullSet = new Set<number>(fullPlayerIds);
		const partialSet = new Set<number>(partialPlayerIds);
		const uniquePlayerIds = uniquePlayersArr.map((p) => p._id);
		const scoutingStats: ScoutingStats = {
			full: uniquePlayerIds.filter((id) => fullSet.has(id)).length,
			partial: uniquePlayerIds.filter((id) => partialSet.has(id)).length,
			none: uniquePlayerIds.filter((id) => !fullSet.has(id) && !partialSet.has(id)).length,
			total: uniquePlayerIds.length,
		};

		const playerIdsInPage = data.flatMap((match) =>
			(match.player_match_relationships ?? []).map((pmr) => pmr.player?.id).filter(Boolean),
		);

		const playersDecks = rawDecks as PlayersDecksMap | null;
		const filteredPlayersDecks =
			playersDecks && playersDecks.players
				? {
						tournamentId: playersDecks.tournamentId,
						players: playersDecks.players.filter((p) => playerIdsInPage.includes(p.playerId)),
					}
				: null;

		return {
			results: data,
			playersDecks: filteredPlayersDecks,
			pagination: { page: currentPage, perPage: limit, total, totalPages },
			lastFetchedAt: lastFetchedAt ?? null,
			updatedAt,
			scoutingStats,
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
