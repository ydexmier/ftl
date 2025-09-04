'use client';
import { useState } from 'react';
import { TextField, Button, Alert, Box } from '@mui/material';

export default function FetchTournamentForm({ onFetch, onValidate }) {
  const [tournamentId, setTournamentId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!tournamentId) {
      setError('Veuillez saisir un ID de tournoi');
      return;
    }

    // ✅ validation via la fonction parent
    if (onValidate && !onValidate(Number(tournamentId))) {
      setError(`Le tournoi ${tournamentId} est déjà présent dans la liste.`);
      return;
    }

    try {
      const fetchRes = await fetch('/api/admin/fetchTournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: Number(tournamentId) }),
      });

      if (!fetchRes.ok) throw new Error('Erreur lors de la récupération du tournoi');

      setSuccess(`Tournoi ${tournamentId} récupéré avec succès !`);
      setTournamentId(''); // reset champ
      if (onFetch) onFetch(); // rafraîchir liste des tournois
    } catch (err) {
      setError(err.message);
    }
  };

  return (
   <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
  {/* Ligne avec input + bouton */}
  <Box sx={{ display: 'flex', gap: 2 }}>
    <TextField
      label="ID du tournoi"
      type="number"
      value={tournamentId}
      onChange={(e) => setTournamentId(e.target.value)}
      required
      sx={{ flex: 1 }} // pour que l'input prenne tout l'espace disponible
    />
    <Button type="submit" variant="contained">
      Récupérer
    </Button>
  </Box>

  {/* Alerts sous la ligne */}
  {error && <Alert severity="error">{error}</Alert>}
  {success && <Alert severity="success">{success}</Alert>}
</Box>

    
  );
}
