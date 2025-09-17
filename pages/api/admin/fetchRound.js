import fetchAndSaveRound from '@scooting/scripts/fetchAndSaveRound.js';

export default function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Méthode non autorisée' });
	}

	const { tournamentId, roundId, options = {} } = req.body;
	const { page = 1, perPage = 10, search = '' } = options;

	if (!tournamentId) {
		return res.status(400).json({ error: 'TournamentId requis' });
	}
	if (!roundId) {
		return res.status(400).json({ error: 'RoundId requis' });
	}

	// Chemin absolu vers le script
	fetchAndSaveRound(tournamentId, roundId, { page, perPage, search })
		.then((datas) => {
			return res.status(200).json({ message: 'Round récupéré !', datas });
		})
		.catch((error) => {
			console.error('Erreur fetchAndSaveRound:', error);
			return res.status(500).json({ error: error.message });
		});
}
