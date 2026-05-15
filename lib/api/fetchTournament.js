export async function fetchTournament(tournamentId) {
  const res = await fetch('/api/admin/fetchTournament', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tournamentId: Number(tournamentId) }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? 'Erreur lors de la récupération du tournoi');
  }

  return res.json();
}
