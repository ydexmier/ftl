export async function fetchRound(tournamentId, roundId, options) {
	const res = await fetch('/api/admin/fetchRound', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ tournamentId, roundId, options }),
	});

	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.error ?? "Erreur lors de la récupération du round");
	}

	return res.json();
}
