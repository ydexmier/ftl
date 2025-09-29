import connectToMongoDB from '@scooting/utils/connectToMongoDB.mjs';
import Round from '@models/Round.js';
import TournamentPlayersDeck from '@models/TournamentPlayersDeck.js';

export default async function handler(req, res) {
	await connectToMongoDB();

	if (req.method === 'GET') {
		try {
			const { roundId, page = 1, perPage = 10, search = '', excludeOnePlayerMatches = false } = req.query;
			const currentPage = Math.max(parseInt(page, 10), 1);
			const limit = Math.max(parseInt(perPage, 10), 1);

			// 1️⃣ Récupération de la round
			const round = await Round.findOne({ id: Number(roundId) })
				.populate('playersDecks')
				.lean();

			if (!round) {
				return res.status(404).json({ error: 'ROUND_NOT_FOUND' });
			}

			let filteredRound = { ...round };

			if (search.trim() || excludeOnePlayerMatches) {
				const isNumeric = !isNaN(search); // ✅ test si c’est un nombre
				const lowerSearch = search.toLowerCase();

				filteredRound.results = (round.results || []).filter((match) => {
					if (excludeOnePlayerMatches && match.player_match_relationships.length < 2) {
						return false;
					}
					if (search.trim() && isNumeric) {
						// 🔎 filtre sur le numéro de table
						return String(match.table_number) === search;
					}

					// 🔎 sinon, filtre sur joueurs
					return match.player_match_relationships.some(
						(pmr) =>
							pmr.player?.best_identifier?.toLowerCase().includes(lowerSearch) ||
							pmr.user_event_status?.best_identifier?.toLowerCase().includes(lowerSearch),
					);
				});
			}

			// 2️⃣ Pagination des matchs
			const totalMatches = filteredRound.results.length;
			const totalPages = Math.ceil(totalMatches / limit);
			const paginatedResults = filteredRound.results.slice((currentPage - 1) * limit, currentPage * limit);

			// 3️⃣ Récupérer tous les playerIds présents dans la page
			const playerIdsInPage = paginatedResults.flatMap((match) =>
				(match.player_match_relationships || []).map((pmr) => pmr.player?.id).filter(Boolean),
			);

			// 4️⃣ Filtrer les decks pour ne garder que les joueurs présents
			let filteredPlayersDecks = [];
			if (filteredRound.playersDecks && filteredRound.playersDecks.players) {
				filteredPlayersDecks = {
					tournamentId: filteredRound.playersDecks.tournamentId,
					players: filteredRound.playersDecks.players.filter((p) => playerIdsInPage.includes(p.playerId)),
				};
			}

			return res.status(200).json({
				results: paginatedResults,
				playersDecks: filteredPlayersDecks,
				pagination: {
					page: currentPage,
					perPage: limit,
					total: totalMatches,
					totalPages,
				},
				updatedAt: round.updatedAt,
			});
		} catch (err) {
			console.error('GET handler error:', err);
			return res.status(500).json({ error: err.message });
		}
	}

	if (req.method === 'POST') {
		try {
			const { roundId, ...rest } = req.body;

			const round = await Round.findOneAndUpdate({ id: Number(roundId) }, rest, {
				new: true,
				upsert: true,
			}).lean();

			return res.status(200).json(round);
		} catch (err) {
			console.error('POST handler error:', err);
			return res.status(500).json({ error: err.message });
		}
	}

	return res.status(405).json({ error: 'Méthode non autorisée' });
}
