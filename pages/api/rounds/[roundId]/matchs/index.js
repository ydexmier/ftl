import { RoundRepository } from '@/src/repositories/db/RoundRepository';

export default async function handler(req, res) {
	if (req.method === 'GET') {
		try {
			const { roundId, page = 1, perPage = 10, search = '', excludeOnePlayerMatches = false } = req.query;

			const data = await RoundRepository.findMatchesPaginated(Number(roundId), {
				page: Number(page),
				perPage: Number(perPage),
				search: String(search),
				excludeOnePlayer: excludeOnePlayerMatches === 'true',
			});

			if (!data) return res.status(404).json({ error: 'ROUND_NOT_FOUND' });
			return res.status(200).json(data);
		} catch (err) {
			console.error('GET handler error:', err);
			return res.status(500).json({ error: err.message });
		}
	}

	if (req.method === 'POST') {
		try {
			const { roundId, ...rest } = req.body;
			const round = await RoundRepository.upsert({ id: Number(roundId), ...rest });
			return res.status(200).json(round);
		} catch (err) {
			console.error('POST handler error:', err);
			return res.status(500).json({ error: err.message });
		}
	}

	return res.status(405).json({ error: 'Méthode non autorisée' });
}
