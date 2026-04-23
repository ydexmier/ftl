import Round from '@models/Round.js';
import connectToMongoDB from '@/src/lib/db';
import { mergeDeep, mergeArrayById } from '@/src/lib/mergeDeep';

export interface MatchQueryOptions {
	page?: number;
	perPage?: number;
	search?: string;
	excludeOnePlayer?: boolean;
}

export const RoundRepository = {
	async findById(id: number) {
		await connectToMongoDB();
		return Round.findOne({ id }).lean();
	},

	async findByIdWithDecks(id: number) {
		await connectToMongoDB();
		return Round.findOne({ id }).populate('playersDecks').lean();
	},

	async upsert(data: Record<string, unknown>) {
		await connectToMongoDB();
		return Round.findOneAndUpdate({ id: data.id }, data, { new: true, upsert: true }).lean();
	},

	async deleteMany(tournamentId: number) {
		await connectToMongoDB();
		return Round.deleteMany({ tournamentId });
	},

	async findMatchesPaginated(roundId: number, options: MatchQueryOptions = {}) {
		const { page = 1, perPage = 10, search = '', excludeOnePlayer = false } = options;
		await connectToMongoDB();

		const round = await Round.findOne({ id: roundId }).populate('playersDecks').lean();
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

		const playersDecks = round.playersDecks ?? null;
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
			updatedAt: round.updatedAt,
		};
	},

	async findMatch(roundId: number, matchId: number) {
		await connectToMongoDB();
		const round = await Round.findOne({ id: roundId }).lean();
		if (!round) return null;
		return round.results?.find((m) => m.id === matchId) ?? null;
	},

	async mergeAndSave(id: number, tournamentId: number, newData: Record<string, unknown>) {
		await connectToMongoDB();
		const existing = await Round.findOne({ id });
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
			await existing.save();
		} else {
			await Round.create({ ...newData, id, tournamentId });
		}
		return Round.findOne({ id }).populate('playersDecks').lean();
	},
};
