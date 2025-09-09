import connectToMongoDB from '@scooting/utils/connectToMongoDB.mjs';
import Round from '@scooting/models/Round.js';

export default async function handler(req, res) {
	await connectToMongoDB();

	if (req.method === 'GET') {
		try {
			const { roundId } = req.query;

			const round = await Round.findOne({ id: Number(roundId) })
				.populate('playersDecks') // ⚡ auto-merge des joueurs
				.lean();

			if (!round) {
				return res.status(404).json({ error: 'ROUND_NOT_FOUND' });
			}

			return res.status(200).json(round);
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
