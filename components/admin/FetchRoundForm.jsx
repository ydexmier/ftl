'use client';
import { useState } from 'react';
import { Box, Button, Alert, Typography, Select, FormControl, MenuItem } from '@mui/material';
import { getRoundName } from '@components/scooting/utils/roundToString';
import { fetchRound } from 'lib/api/fetchRound';
import { FETCH_ALL_ASYNC } from 'constants/index.js';

const useAsyncFetch = process.env.NEXT_PUBLIC_USE_ASYNC_FETCH === 'true';

export default function FetchRoundForm({ tournament, phases = [] }) {
	const [loadingId, setLoadingId] = useState(null);
	const [message, setMessage] = useState('');
	const [round, setRound] = useState();

	const handleRunRound = async (page, perPage) => {
		setLoadingId(round);
		setMessage('');

		try {
			await fetchRound(tournament.id, round, { page, perPage });
			setMessage(`✅ Script exécuté pour le round ${round}`);
		} catch (err) {
			setMessage(`❌ ${err.message}`);
		} finally {
			setLoadingId(null);
		}
	};

	const fetchAllMatchs = async () => {
		if (!round) return;
		setLoadingId(round);
		setMessage('');

		try {
			await fetchRound(tournament.id, round, {
				perPage: useAsyncFetch ? FETCH_ALL_ASYNC.perPage : 2000,
				mode: useAsyncFetch && FETCH_ALL_ASYNC.mode,
			});
			setMessage(`✅ Tous les matchs ont été fetchés`);
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
					<Box sx={{ display: 'flex', flexWrap: 'wrap', flexDirection: 'column', gap: 2, mb: 2 }}>
						{phase.rounds.length === 0 ? (
							<Typography>Aucune round disponible</Typography>
						) : (
							<>
								<FormControl
									size="small"
									sx={{ minWidth: 120, display: 'flex', flexDirection: 'row', gap: 2 }}
								>
									<Select
										value={round}
										onChange={(e) => {
											setRound(Number(e.target.value));
										}}
									>
										{phase.rounds.map((r) => (
											<MenuItem key={r.id} value={r.id}>
												{getRoundName(phase, r)}
											</MenuItem>
										))}
									</Select>
									<Button
										variant="contained"
										onClick={() => fetchAllMatchs()}
										disabled={loadingId === round}
									>
										{loadingId === round ? 'Exécution en cours...' : 'Fetch all matches'}
									</Button>
								</FormControl>
								{round && (
									<Box>
										{[
											...Array(
												Math.floor(tournament.registered_user_count / FETCH_ALL_ASYNC.perPage),
											),
										].map((_, page) => (
											<Button onClick={() => handleRunRound(page + 1, FETCH_ALL_ASYNC.perPage)}>
												match {page * FETCH_ALL_ASYNC.perPage + 1} -{' '}
												{page * FETCH_ALL_ASYNC.perPage + FETCH_ALL_ASYNC.perPage}
											</Button>
										))}
									</Box>
								)}
							</>
						)}
					</Box>
				</Box>
			))}

			{message && (
				<Alert severity={loadingId ? 'info' : message.startsWith('✅') ? 'success' : 'error'} sx={{ mt: 2 }}>
					{message}
				</Alert>
			)}
		</div>
	);
}
