import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';
import { RavensburgerClient } from '@/src/repositories/external/RavensburgerClient';

export const TournamentService = {
	async fetchAndSave(id: number, isRefetch = false) {
		if (!id) throw new Error('Tournament id requis');

		const raw = await RavensburgerClient.fetchTournament(id);
		if (raw?.id !== id) throw new Error('Fetch failed: id mismatch');

		return TournamentRepository.mergeAndSave(raw as Record<string, unknown>, isRefetch);
	},

	async getAll() {
		return TournamentRepository.findAll();
	},

	async getById(id: number) {
		const tournament = await TournamentRepository.findById(id);
		if (!tournament) throw new Error(`Tournament ${id} not found`);
		return tournament;
	},

	async delete(id: number) {
		const [deletedRounds, deletedDecks] = await Promise.all([
			RoundRepository.deleteMany(id),
			TournamentPlayersDeckRepository.deleteMany(id),
		]);

		const deleted = await TournamentRepository.deleteById(id);
		if (!deleted) throw new Error(`Tournament ${id} not found`);

		return {
			deletedTournament: deleted,
			deleted: {
				rounds: deletedRounds.deletedCount,
				decks: deletedDecks.deletedCount,
			},
		};
	},
};
