import { RoundService } from '@/src/services/RoundService';

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Méthode non autorisée' });
	}

	const { tournamentId, roundId, options = {} } = req.body;

	if (!tournamentId) {
		return res.status(400).json({ error: 'TournamentId requis' });
	}
	if (!roundId) {
		return res.status(400).json({ error: 'RoundId requis' });
	}

	try {
		const datas = await RoundService.fetchAndSave(Number(tournamentId), Number(roundId), options);
		return res.status(200).json({ message: 'Round récupéré !', datas });
	} catch (error) {
		console.error('Erreur fetchAndSaveRound:', error);
		return res.status(500).json({ error: error.message });
	}
}
