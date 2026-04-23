import { ScoutingService } from '@/src/services/ScoutingService';

export default async function handler(req, res) {
	if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

	try {
		const roundId = Number(req.query.roundId);
		const matchId = Number(req.query.matchId);
		const { decks } = req.body;

		const result = await ScoutingService.assignDecks(roundId, matchId, decks);
		return res.status(200).json(result);
	} catch (err) {
		if (err.message === 'Round not found') return res.status(404).json({ error: err.message });
		if (err.message === 'Match not found') return res.status(404).json({ error: err.message });
		console.error(err);
		return res.status(500).json({ error: err.message });
	}
}
