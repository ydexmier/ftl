import TournamentPlayersDeck from '@components/scooting/models/TournamentPlayersDeck.js';
import connectToMongoDB from '@components/scooting/utils/connectToMongoDB.mjs';

// Create or update (upsert)
export async function upsertTournamentPlayersDeck(tournament) {
	try {
		await connectToMongoDB();
		const playersDeckData = {
			tournamentId: tournament.id,
			players: tournament.players || [],
		};
		const tournamentPlayersDeck = await TournamentPlayersDeck.findOneAndUpdate(
			{ tournamentId: tournament.id },
			playersDeckData,
			{ new: true, upsert: true },
		);
		console.log(`TournamentPlayersDeck for tournament ${tournament.id} upserted`);
		return tournamentPlayersDeck;
	} catch (err) {
		console.error("Erreur lors de l'upsert de TournamentPlayersDeck :", err);
		throw err;
	}
}
