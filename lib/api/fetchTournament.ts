export async function fetchTournament(tournamentId: number | string): Promise<unknown> {
  const res = await fetch('/api/admin/fetchTournament', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tournamentId: Number(tournamentId) }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? 'Erreur lors de la récupération du tournoi');
  }

  return res.json();
}
