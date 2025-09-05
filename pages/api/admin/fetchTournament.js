import fetchAndSaveTournament from '../../../components/scooting/scripts/fetchAndSaveTournament.js';

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Méthode non autorisée' });
	}

	const { tournamentId } = req.body;

	if (!tournamentId) {
		return res.status(400).json({ error: 'TournamentId requis' });
	}

	await fetchAndSaveTournament(tournamentId)
		.then(() => {
			return res.status(200).json({ message: 'Tournoi récupéré !' });
		})
		.catch((error) => {
			console.error('Erreur fetchAndSaveTournament:', error);
			return res.status(500).json({ error: error.message });
		});
}
