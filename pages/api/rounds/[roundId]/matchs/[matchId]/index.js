import { RoundRepository } from '@/src/repositories/db/RoundRepository';

export default async function handler(req, res) {
	const roundId = Number(req.query.roundId);
	const matchId = Number(req.query.matchId);

	if (req.method === 'GET') {
		try {
			const match = await RoundRepository.findMatch(roundId, matchId);
			if (match === null) return res.status(404).json({ error: 'Match not found' });
			return res.status(200).json(match);
		} catch (err) {
			return res.status(500).json({ error: err.message });
		}
	}

	if (req.method === 'POST') {
		try {
			const round = await RoundRepository.upsert({ id: roundId, ...req.body });
			return res.status(200).json(round);
		} catch (err) {
			return res.status(500).json({ error: err.message });
		}
	}

	return res.status(405).json({ error: 'Méthode non autorisée' });
}
