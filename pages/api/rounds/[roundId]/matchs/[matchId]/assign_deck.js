import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';

export default async function handler(req, res) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

	try {
		const roundId = Number(req.query.roundId);
		const matchId = Number(req.query.matchId);
		const { decks } = req.body;

		const round = await RoundRepository.findById(roundId);
		if (!round) return res.status(404).json({ error: 'Round not found' });

		const matchIndex = round.results.findIndex((m) => m.id === matchId);
		if (matchIndex === -1) return res.status(404).json({ error: 'Match not found' });

		const match = round.results[matchIndex];

		const assignments = decks.map((playerDecks) => {
			const pmr = match.player_match_relationships.find((p) => p.player.id === playerDecks.playerId);
			return {
				playerId: playerDecks.playerId,
				bestIdentifier: pmr?.player?.best_identifier ?? '',
				eventBestIdentifier: pmr?.user_event_status?.best_identifier ?? '',
				decks: playerDecks.decks,
			};
		});

		const playersModified = await TournamentPlayersDeckRepository.assignDecks(round.tournamentId, assignments);

		return res.status(200).json({ matchs: round.results, playersDecks: { players: playersModified } });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: err.message });
	}
}
