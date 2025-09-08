import connectToMongoDB from '@scooting/utils/connectToMongoDB.mjs';
import Round from '@scooting/models/Round.js';
import TournamentPlayersDeck from '@scooting/models/TournamentPlayersDeck.js';

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
		console.log(data);
		if (data.decks.every((d) => !d.playerId)) {
			// Aucun playerId → assigner probable_decks à tous les joueurs
			match.player_match_relationships.forEach((pmr, index) => {
				const playerIndex = tournamentPlayersDeck.players.findIndex(({ id }) => id === pmr.player.id);
				if (playerIndex !== -1) {
					tournamentPlayersDeck.set(`players.${playerIndex}`, {
						...tournamentPlayersDeck.players[playerIndex], // conserver les autres champs existants
						probable_decks: data.decks.map((d) => ({ inks: d.inks })),
						status: 'probable_decks',
					});
				} else {
					tournamentPlayersDeck.players.push({
						playerId: pmr.player.id, // ou l'id du joueur si tu l'as
						best_identifier: pmr.player.best_identifier,
						event_best_identifier: pmr.user_event_status.best_identifier,
						probable_decks: data.decks.map((d) => ({ inks: d.inks })),
						status: 'probable_decks',
					});
				}
			});
		} else {
			// On a des playerId → assigner directement aux decks des joueurs correspondants
			data.decks.forEach((deck) => {
				const tournamentPlayerDeckIndex = tournamentPlayersDeck.players.findIndex(
					({ id }) => id === deck.playerId,
				);
				const playerIndex = match.player_match_relationships.findIndex(
					(pmr) => pmr.player.id === deck.playerId,
				);
				if (tournamentPlayerDeckIndex !== -1) {
					tournamentPlayersDeck.set(`players.${playerIndex}.deck`, [deck]);
					tournamentPlayersDeck.set(`players.${playerIndex}.status`, 'deck');
				} else {
					const playerObject = match.player_match_relationships[playerIndex];

					playerObject &&
						tournamentPlayersDeck.players.push({
							playerId: playerObject.player.id,
							best_identifier: playerObject.player.best_identifier,
							event_best_identifier: playerObject.user_event_status.best_identifier,
							deck: [deck],
							status: 'deck',
						});
				}
			});
		}
		console.log('Updated tournamentPlayersDeck:', tournamentPlayersDeck);
		await round.save();
		await tournamentPlayersDeck.save();

		return res.status(200).json({ matchs: round.results, playersDecks: tournamentPlayersDeck.players });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: err.message });
	}
}
