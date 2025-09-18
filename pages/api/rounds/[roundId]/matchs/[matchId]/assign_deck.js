import connectToMongoDB from '@scooting/utils/connectToMongoDB.mjs';
import Round from '@models/Round.js';
import TournamentPlayersDeck from '@models/TournamentPlayersDeck.js';

export default async function handler(req, res) {
	await connectToMongoDB();

	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Méthode non autorisée' });
	}

	try {
		const { roundId, matchId } = req.query;
		const data = req.body;

		const round = await Round.findOne({ id: Number(roundId) });

		const tournamentPlayersDeck = await TournamentPlayersDeck.findOne({ tournamentId: round.tournamentId });
		if (!tournamentPlayersDeck) {
			return res.status(404).json({ error: 'TournamentPlayersDeck not found' });
		}
		if (!round) return res.status(404).json({ error: 'Round not found' });

		const matchIndex = round.results.findIndex((m) => m.id === Number(matchId));
		if (matchIndex === -1) return res.status(404).json({ error: 'Match not found' });

		const match = round.results[matchIndex];
		const playersModified = [];
		// On a des playerId → assigner directement aux decks des joueurs correspondants
		data.decks.forEach((playerDecks) => {
			const tournamentPlayerDeckIndex = tournamentPlayersDeck.players.findIndex(
				({ playerId }) => playerId === playerDecks.playerId,
			);
			const playerIndex = match.player_match_relationships.findIndex(
				(pmr) => pmr.player.id === playerDecks.playerId,
			);

			const playerObject = match.player_match_relationships[playerIndex];
			if (tournamentPlayerDeckIndex !== -1) {
				if (!playerDecks.decks || playerDecks.decks.length === 0) {
					tournamentPlayersDeck.players.splice(tournamentPlayerDeckIndex, 1);
					tournamentPlayersDeck.markModified('players');
					playersModified.push({
						playerId: playerObject.player.id,
						decks: playerDecks.decks,
					});
				} else {
					tournamentPlayersDeck.set(`players.${tournamentPlayerDeckIndex}.decks`, playerDecks.decks);
					playersModified.push({
						...tournamentPlayersDeck.players[tournamentPlayerDeckIndex].toObject(),
						decks: playerDecks.decks,
					});
				}
			} else {
				playerObject &&
					tournamentPlayersDeck.players.push({
						playerId: playerObject.player.id,
						best_identifier: playerObject.player.best_identifier,
						event_best_identifier: playerObject.user_event_status.best_identifier,
						decks: playerDecks.decks,
					});
				playersModified.push({
					playerId: playerObject.player.id,
					best_identifier: playerObject.player.best_identifier,
					event_best_identifier: playerObject.user_event_status.best_identifier,
					decks: playerDecks.decks,
				});
			}
		});
		await round.save();
		await tournamentPlayersDeck.save();
		console.log(playersModified);
		return res.status(200).json({ matchs: round.results, playersDecks: { players: playersModified } });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: err.message });
	}
}
