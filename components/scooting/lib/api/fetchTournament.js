// lib/api/fetchTournament.js
export async function fetchTournament(tournamentId, isRefetch = false) {
  const fetchRes = await fetch('/api/admin/fetchTournament', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tournamentId: Number(tournamentId), isRefetch }),
  });

  if (!fetchRes.ok) {
    throw new Error('Erreur lors de la récupération du tournoi');
  }

  return await fetchRes.json(); // ✅ retourne directement la réponse JSON
}
