import connectToMongoDB from '@scooting/utils/connectToMongoDB.mjs';
import Tournament from '@models/Tournament.js';

export default async function handler(req, res) {
	await connectToMongoDB();
	const { id } = req.query;
	const tournamentId = Number(id);

	if (req.method === 'GET') {
		try {
			const tournament = await Tournament.findOne({ id: tournamentId });
			if (!tournament) {
				return res.status(404).json({ error: 'Tournament not found' });
			}
			return res.status(200).json(tournament);
		} catch (err) {
			return res.status(500).json({ error: err.message });
		}
	}

	if (req.method === 'DELETE') {
		try {
			const result = await Tournament.deleteOne({ id });
			if (result.deletedCount === 0) {
				return res.status(404).json({ error: 'Tournament not found' });
			}
			return res.status(200).json({ message: 'Tournament deleted' });
		} catch (err) {
			return res.status(500).json({ error: err.message });
		}
	}

	return res.status(405).json({ error: 'Méthode non autorisée' });
}
