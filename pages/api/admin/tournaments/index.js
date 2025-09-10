// pages/api/admin/tournaments/[id].js
import connectToMongoDB from '@scooting/utils/connectToMongoDB.mjs';
import Tournament from '@scooting/models/Tournament.js';
import Round from '@scooting/models/Round.js';
import TournamentPlayersDeck from '@scooting/models/TournamentPlayersDeck.js';

export default async function handler(req, res) {
	await connectToMongoDB();

	const { id } = req.body;
	if (!id) return res.status(400).json({ error: 'Tournament id requis' });
	if (req.method !== 'DELETE') return res.status(405).json({ error: 'Méthode non autorisée' });

	try {
		const tournamentId = Number(id);

		// 1️⃣ Supprimer toutes les collections liées en parallèle
		const [deletedRounds, deletedDecks] = await Promise.all([
			Round.deleteMany({ tournamentId }),
			TournamentPlayersDeck.deleteMany({ tournamentId }),
		]);

		// 2️⃣ Supprimer le tournoi
		const deletedTournament = await Tournament.findOneAndDelete({ id: tournamentId });

		if (!deletedTournament) {
			return res.status(404).json({ error: `Tournament ${id} non trouvé` });
		}

		return res.status(200).json({
			message: `Tournament ${id} et ses données associées supprimés avec succès`,
			deletedTournament,
			deleted: {
				rounds: deletedRounds.deletedCount,
				decks: deletedDecks.deletedCount,
			},
		});
	} catch (err) {
		console.error(`Erreur API tournaments/[id]:`, err);
		return res.status(500).json({ error: err.message });
	}
}
