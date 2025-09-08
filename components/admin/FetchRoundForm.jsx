'use client';
import { useState } from 'react';
import { Box, Button, Alert, Typography } from '@mui/material';
import { getRoundName } from '../scooting/utils/roundToString';

export default function FetchRoundForm({ tournamentId, phases = [] }) {
	const [loadingId, setLoadingId] = useState(null);
	const [message, setMessage] = useState('');
	console.log(phases);
	const handleRunRound = async (roundId) => {
		setLoadingId(roundId);
		setMessage('');

		try {
			const res = await fetch('/api/admin/fetchRound', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tournamentId, roundId }),
			});

			if (!res.ok) throw new Error('Erreur lors de l’exécution du script');
			await res.json();
			setMessage(`✅ Script exécuté pour le round ${roundId}`);
		} catch (err) {
			setMessage(`❌ ${err.message}`);
		} finally {
			setLoadingId(null);
		}
	};

	if (phases.length === 0) {
		return <Typography>Aucune phase de tournoi disponible</Typography>;
	}

	return (
		<div>
			{phases.map((phase, idx) => (
				<Box key={idx} mb={2}>
					<Typography variant="subtitle1" gutterBottom>
						Phase: {phase.name} ({phase.round_type})
					</Typography>
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
						{phase.rounds.length === 0 ? (
							<Typography>Aucune round disponible</Typography>
						) : (
							phase.rounds.map((r) => (
								<Button
									key={r.id}
									variant="contained"
									color="primary"
									onClick={() => handleRunRound(r.id)}
									disabled={loadingId === r.id}
								>
									{loadingId === r.id ? 'Chargement...' : getRoundName(phase, r)}
								</Button>
							))
						)}
					</Box>
				</Box>
			))}

			{message && (
				<Alert severity={message.startsWith('✅') ? 'success' : 'error'} sx={{ mt: 2 }}>
					{message}
				</Alert>
			)}
		</div>
	);
}
