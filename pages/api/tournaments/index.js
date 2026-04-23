import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';

export default async function handler(req, res) {
	if (req.method === 'GET') {
		try {
			const tournaments = await TournamentRepository.findAll();
			return res.status(200).json(tournaments);
		} catch (err) {
			return res.status(500).json({ error: err.message });
		}
	}

	if (req.method === 'POST') {
		try {
			const tournament = await TournamentRepository.upsert(req.body);
			return res.status(200).json(tournament);
		} catch (err) {
			return res.status(500).json({ error: err.message });
		}
	}

	return res.status(405).json({ error: 'Méthode non autorisée' });
}
