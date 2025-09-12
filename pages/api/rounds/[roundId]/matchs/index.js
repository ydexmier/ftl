import connectToMongoDB from '@scooting/utils/connectToMongoDB.mjs';
import Round from '@models/Round.js';

export default async function handler(req, res) {
	await connectToMongoDB();

	if (req.method === 'GET') {
		try {
			const { roundId, search = '' } = req.query;

			const round = await Round.findOne({ id: Number(roundId) })
				.populate('playersDecks')
				.lean();

			if (!round) {
				return res.status(404).json({ error: 'ROUND_NOT_FOUND' });
			}

			let filteredRound = { ...round };

			if (search.trim()) {
				const isNumeric = !isNaN(search); // ✅ test si c’est un nombre
				const lowerSearch = search.toLowerCase();

				filteredRound.results = (round.results || []).filter((match) => {
					if (isNumeric) {
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

			return res.status(200).json(filteredRound);
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
