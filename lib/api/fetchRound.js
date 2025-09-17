// lib/api/fetchRound.js

export async function fetchRound(tournamentId, roundId, options) {
	const res = await fetch('/api/admin/fetchRound', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ tournamentId, roundId, options }),
	});

	if (!res.ok) throw new Error('Erreur lors de l’exécution du script');
	return await res.json();
}
