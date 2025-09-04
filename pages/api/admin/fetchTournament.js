// pages/api/admin/fetchTournament.js
import { exec } from 'child_process';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { tournamentId } = req.body;

  if (!tournamentId) {
    return res.status(400).json({ error: 'TournamentId requis' });
  }

  // Chemin absolu vers le script
  const scriptPath = path.resolve('./scripts/fetchAndSaveTournament.mjs');

  exec(`node ${scriptPath} ${tournamentId}`, (error, stdout, stderr) => {
    if (error) {
      console.error('Erreur script:', error);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      console.error('stderr:', stderr);
    }
    console.log('stdout:', stdout);
    return res.status(200).json({ message: 'Tournoi récupéré !', output: stdout });
  });
}
