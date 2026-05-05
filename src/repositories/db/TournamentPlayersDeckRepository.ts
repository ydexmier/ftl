import TournamentPlayersDeck from '@models/TournamentPlayersDeck.js';
import connectToMongoDB from '@/src/lib/db';
import type { Deck } from '@/src/types/ink';

export const TournamentPlayersDeckRepository = {
	async findByTournamentId(tournamentId: number) {
		await connectToMongoDB();
		return TournamentPlayersDeck.findOne({ tournamentId });
	},

	async upsert(tournamentId: number, players: unknown[] = []) {
		await connectToMongoDB();
		return TournamentPlayersDeck.findOneAndUpdate(
			{ tournamentId },
			{ tournamentId, players },
			{ new: true, upsert: true },
		);
	},

	async deleteMany(tournamentId: number) {
		await connectToMongoDB();
		return TournamentPlayersDeck.deleteMany({ tournamentId });
	},

	async assignDecks(
		tournamentId: number,
		assignments: { playerId: number; bestIdentifier: string; eventBestIdentifier: string; decks: Deck[] }[],
	) {
		await connectToMongoDB();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const doc = await TournamentPlayersDeck.findOne({ tournamentId }) as any;
		if (!doc) throw new Error(`TournamentPlayersDeck not found for tournament ${tournamentId}`);

		const modified: unknown[] = [];

		for (const { playerId, bestIdentifier, eventBestIdentifier, decks } of assignments) {
			const idx = doc.players.findIndex((p: { playerId: number }) => p.playerId === playerId);

			if (idx !== -1) {
				if (!decks || decks.length === 0) {
					doc.players.splice(idx, 1);
					doc.markModified('players');
					modified.push({ playerId, decks });
				} else {
					doc.set(`players.${idx}.decks`, decks);
					modified.push({ ...doc.players[idx].toObject(), decks });
				}
			} else if (decks.length > 0) {
				doc.players.push({ playerId, best_identifier: bestIdentifier, event_best_identifier: eventBestIdentifier, decks });
				modified.push({ playerId, best_identifier: bestIdentifier, event_best_identifier: eventBestIdentifier, decks });
			}
		}

		await doc.save();
		return modified;
	},
};
