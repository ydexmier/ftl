import { TournamentRepository } from '@/src/repositories/db/TournamentRepository';
import { RoundRepository } from '@/src/repositories/db/RoundRepository';
import { TournamentPlayersDeckRepository } from '@/src/repositories/db/TournamentPlayersDeckRepository';

export default async function handler(req, res) {
	const { id } = req.body;
	if (!id) return res.status(400).json({ error: 'Tournament id requis' });
	if (req.method !== 'DELETE') return res.status(405).json({ error: 'Méthode non autorisée' });

	try {
		const tournamentId = Number(id);

		const [deletedRounds, deletedDecks] = await Promise.all([
			RoundRepository.deleteMany(tournamentId),
			TournamentPlayersDeckRepository.deleteMany(tournamentId),
		]);

		const deletedTournament = await TournamentRepository.deleteById(tournamentId);
		if (!deletedTournament) return res.status(404).json({ error: `Tournament ${id} non trouvé` });

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
