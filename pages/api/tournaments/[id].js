import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';

export default async function handler(req, res) {
	const id = Number(req.query.id);

	if (req.method === 'GET') {
		try {
			const tournament = await TournamentRepository.findById(id);
			if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
			return res.status(200).json(tournament);
		} catch (err) {
			return res.status(500).json({ error: err.message });
		}
	}

	if (req.method === 'DELETE') {
		try {
			const deleted = await TournamentRepository.deleteById(id);
			if (!deleted) return res.status(404).json({ error: 'Tournament not found' });
			return res.status(200).json({ message: 'Tournament deleted' });
		} catch (err) {
			return res.status(500).json({ error: err.message });
		}
	}

	return res.status(405).json({ error: 'Méthode non autorisée' });
}
